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
import { createChainDataSlice, CacheDuration, getNullSliceState } from '../'

export interface specificTDaoPosition {
  nftTokenID: string
  count: string
  imageData: {
    exists: boolean
    name: string
    description: string
    image: string
  }
}

const tdaoPositionsSlice = createChainDataSlice({
  name: 'tdaoPositions',
  dependencies: ['rootContracts', 'contracts', 'tdao', 'tdao', 'userAddress', 'selectedTDaoPosition'],
  stateSelector: (state: RootState) =>
    state.selectedTDaoPosition === '' ||
    state.specificTDaoPositions[state.selectedTDaoPosition] === undefined
    ? getNullSliceState()
    : state.specificTDaoPositions[state.selectedTDaoPosition],
  cacheDuration: CacheDuration.NONE,
  thunkFunction:
    async (args: thunkArgs<'rootContracts' | 'contracts' | 'tdao' | 'tdao' | 'userAddress' | 'selectedTDaoPosition'>) => {
      const tdao = getContract(args.rootContracts.tdao, TDaoRootContract.TDao) as TDao
      const tdaoPostionNFT = getContract(args.contracts[TDaoContract.TDaoPositionNFT], TDaoContract.TDaoPositionNFT) as TDaoPositionNFT
      const trustlessMulticall = getMulticallContract(args.rootContracts.trustlessMulticall)

      // fetch the positions
      const positionIDs = (await tdaoPostionNFT.positionIDs(args.userAddress)).map(id => id.toString())

      const positionArgs = idToIdAndArg([args.selectedTDaoPosition])

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
        return [id, {
          nftTokenID: id,
          count: rawPositions[id].count.toString(),
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
