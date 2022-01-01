import { BigNumber } from "ethers"
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { sliceState, initialState } from '../'
import { ContractsInfo } from '../contracts'
import { getGenericReducerBuilder } from '../'
import { tdaoInfo } from '../tdaoInfo'
import getContract, { getMulticallContract } from '../../utils/getContract'
import { oneContractOneFunctionMC, idToIdAndArg, executeMulticalls, rc, oneContractManyFunctionMC } from '@trustlessfi/multicall'
import { PromiseType } from '@trustlessfi/utils'
import { unscale, bnf, unique } from '../../utils'

import { TDaoPositionNFT, TDao } from '@trustlessfi/typechain'
import { TDaoContract, TDaoRootContract } from '../contracts'

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
  svg: string
}

export interface tdaoPositionsInfo { [key: string]: TDaoPosition }

export interface tdaoPositionsArgs {
  userAddress: string
  tdao: string
  contracts: ContractsInfo
  trustlessMulticall: string
  tdaoInfo: tdaoInfo
}

export interface TDaoPositionsState extends sliceState<tdaoPositionsInfo> {}

export const getTDaoPositions = createAsyncThunk(
  'tdaoPositions/getTDaoPositions',
  async (args: tdaoPositionsArgs): Promise<tdaoPositionsInfo> => {
    const tdao = getContract(args.tdao, TDaoRootContract.TDao) as TDao
    const tdaoPostionNFT = getContract(args.contracts[TDaoContract.TDaoPositionNFT], TDaoContract.TDaoPositionNFT) as TDaoPositionNFT
    const trustlessMulticall = getMulticallContract(args.trustlessMulticall)

    // fetch the positions
    const positionIDs = (await tdaoPostionNFT.positionIDs(args.userAddress)).map(id => id.toString())

    const positionArgs = idToIdAndArg(positionIDs)

    const {
      rawPositions,
      tokenSVGs,
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
      tokenSVGs: oneContractOneFunctionMC(tdaoPostionNFT, 'tokenURI', rc.String, positionArgs),
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
        idToIdAndArg(Object.keys(args.tdaoInfo.underlyingProtocolTokens)),
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
        svg: tokenSVGs[id]
      }]
    }))
  }
)

export const tdaoPositionsSlice = createSlice({
  name: 'tDaoPositions',
  initialState: initialState as TDaoPositionsState,
  reducers: {
    clearTDaoPositions: (state) => {
      state.data.value = null
    },
  },
  extraReducers: (builder) => {
    builder = getGenericReducerBuilder(builder, getTDaoPositions)
  },
})

export const { clearTDaoPositions } = tdaoPositionsSlice.actions

export default tdaoPositionsSlice.reducer
