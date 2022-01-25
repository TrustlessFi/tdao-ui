import { BigNumber } from "ethers"
import getContract, { getMulticallContract } from '../../utils/getContract'
import {
  oneContractOneFunctionMC,
  idToIdAndArg,
  executeMulticalls,
  rc,
  oneContractManyFunctionMC
} from '@trustlessfi/multicall'
import { PromiseType } from '@trustlessfi/utils'
import { unscale, bnf, decodeDataURL, convertSVGStringtoURI } from '../../utils'
import { TDaoPositionNFT, TDao } from '@trustlessfi/typechain'
import { TDaoContract, TDaoRootContract } from '../contracts/ProtocolContract'
import { thunkArgs, RootState } from '../fetchNodes'
import { createChainDataSlice, CacheDuration } from '../'

export interface TDaoPosition {
  nftTokenID: string
  approximateRewards: number
  count: string
  startTotalRewards: string
  startCumulativeVirtualCount: string
  lastPeriodUpdated: number
  endPeriod: number
  durationMonths: number
  underlyingTokenID: number
  canBeUnlocked: boolean
  imageData: {
    exists: boolean
    name: string
    description: string
    image: string
  }
}

export interface tdaoPositionsInfo { [key: string]: TDaoPosition }

const tdaoPositionsSlice = createChainDataSlice({
  name: 'tdaoPositions',
  dependencies: ['rootContracts', 'contracts', 'tdao', 'tdao', 'userAddress'],
  stateSelector: (state: RootState) => state.tdaoPositions,
  cacheDuration: CacheDuration.NONE,
  reducers: {
    clearTDaoPositions: (state) => {
      state.value = null
    },
  },
  thunkFunction:
    async (args: thunkArgs<'rootContracts' | 'contracts' | 'tdao' | 'tdao' | 'userAddress'>) => {
      const tdao = getContract(args.rootContracts.tdao, TDaoRootContract.TDao) as TDao
      const tdaoPostionNFT = getContract(args.contracts[TDaoContract.TDaoPositionNFT], TDaoContract.TDaoPositionNFT) as TDaoPositionNFT
      const trustlessMulticall = getMulticallContract(args.rootContracts.trustlessMulticall)

      // fetch the positions
      const positionIDs = (await tdaoPostionNFT.positionIDs(args.userAddress)).map(id => id.toString())

      const positionArgs = idToIdAndArg(positionIDs)

      const {
        rawPositions,
        tokenImages,
        canBeUnlocked,
        tdaoCurrentInfo ,
        rewardsStatus,
      } = await executeMulticalls(trustlessMulticall, {
        rawPositions: oneContractOneFunctionMC(
          tdao,
          'getPosition',
          (result: any) => result as PromiseType<ReturnType<TDao['getPosition']>>,
          positionArgs,
        ),
        tokenImages: oneContractOneFunctionMC(tdaoPostionNFT, 'tokenURI', rc.String, positionArgs),
        canBeUnlocked: oneContractOneFunctionMC(tdao, 'positionIsAbleToBeUnlocked', rc.Boolean, positionArgs),
        tdaoCurrentInfo: oneContractManyFunctionMC(
          tdao,
          {
            currentPeriod: rc.BigNumberToNumber,
            lastPeriodGlobalInflationUpdated: rc.BigNumberToNumber,
          }
        ),
        rewardsStatus: oneContractOneFunctionMC(
          tdao,
          'getRewardsStatus',
          (result: any) => result as PromiseType<ReturnType<TDao['getRewardsStatus']>>,
          idToIdAndArg(Object.keys(args.tdao.underlyingProtocolTokens)),
        ),
      })

      return Object.fromEntries(positionIDs.map(id => {
        const position = rawPositions[id]

        let approximateRewards = BigNumber.from(0)
        const lastPeriodPositionUpdated = position.lastPeriodUpdated.toNumber()

        const tokenRewardsStatus = rewardsStatus[position.tokenID]

        if (lastPeriodPositionUpdated < tdaoCurrentInfo.lastPeriodGlobalInflationUpdated)   {
          const inflationPeriods = tdaoCurrentInfo.lastPeriodGlobalInflationUpdated - lastPeriodPositionUpdated
          const realPeriods = tdaoCurrentInfo.currentPeriod - lastPeriodPositionUpdated

          const avgDebtPerPeriod =
            bnf(tokenRewardsStatus.cumulativeVirtualCount).sub(position.startCumulativeVirtualCount)
              .div(inflationPeriods)

          if (!avgDebtPerPeriod.eq(0)) {
            approximateRewards =
              position.count
                .mul(position.durationMonths)
                .div(12)
                .mul(bnf(tokenRewardsStatus.totalRewards).sub(position.startTotalRewards))
                .div(avgDebtPerPeriod)
                .mul(realPeriods)
                .div(inflationPeriods)
          }
        }


        return [id, {
          nftTokenID: id,
          approximateRewards: unscale(approximateRewards, 18),
          count: rawPositions[id].count.toString(),
          startTotalRewards: rawPositions[id].startTotalRewards.toString(),
          startCumulativeVirtualCount: rawPositions[id].startCumulativeVirtualCount.toString(),
          lastPeriodUpdated: rawPositions[id].lastPeriodUpdated.toNumber(),
          endPeriod: rawPositions[id].endPeriod.toNumber(),
          durationMonths: rawPositions[id].durationMonths.toNumber(),
          underlyingTokenID: rawPositions[id].tokenID,
          canBeUnlocked: canBeUnlocked[id],
          // TODO remove and only go with the first branch once new Rinkeby deployment is out
          imageData:
            tokenImages[id].startsWith('data')
            ? decodeDataURL(tokenImages[id])
            : {
              exists: true,
              name: '<name not available>',
              description: '<description not available>',
              image: convertSVGStringtoURI(tokenImages[id]),
            }
        }]
      }))
    }
})

export const { clearTDaoPositions } = tdaoPositionsSlice.slice.actions

export default tdaoPositionsSlice
