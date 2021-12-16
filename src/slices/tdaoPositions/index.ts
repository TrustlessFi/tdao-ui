import { BigNumber } from "ethers"
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { sliceState, initialState } from '../'
import { ContractsInfo } from '../contracts'
import { getGenericReducerBuilder } from '../'
import { tdaoInfo } from '../tdaoInfo'
import getContract, { getMulticallContract } from '../../utils/getContract'
import { getDuplicateFuncMulticall, executeMulticalls, rc } from '@trustlessfi/multicall'
import { PromiseType } from '@trustlessfi/utils'
import { unscale, bnf } from '../../utils'

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

    const getSVGId = (id: string) => id + 'svg'
    const getCanBeUnlockedId = (id: string) => id + 'canBeUnlocked'

    const { positions, tokenSVGs, canBeUnlocked } = await executeMulticalls(trustlessMulticall, {
      positions: getDuplicateFuncMulticall(
        tdao,
        'getPosition',
        (result: any) => result as PromiseType<ReturnType<TDao['getPosition']>>,
        Object.fromEntries(positionIDs.map(positionID => [positionID, [positionID]]))
      ),
      tokenSVGs: getDuplicateFuncMulticall(
        tdaoPostionNFT,
        'tokenURI',
        rc.String,
        Object.fromEntries(positionIDs.map(positionID => [getSVGId(positionID), [positionID]]))
      ),
      canBeUnlocked: getDuplicateFuncMulticall(
        tdao,
        'positionIsAbleToBeUnlocked',
        rc.Boolean,
        Object.fromEntries(positionIDs.map(positionID => [getCanBeUnlockedId(positionID), [positionID]]))
      ),
    })

    const result = Object.fromEntries(positionIDs.map(id => {
      const position = positions[id]

      let approximateRewards = BigNumber.from(0)
      const lastPeriodPositionUpdated = position.lastPeriodUpdated.toNumber()

      const tokenRewardsStatus = args.tdaoInfo.underlyingProtocolTokens[position.tokenID].rs

      if (lastPeriodPositionUpdated < args.tdaoInfo.lastPeriodGlobalInflationUpdated)   {
        let avgDebtPerPeriod =
          bnf(tokenRewardsStatus.cumulativeVirtualCount)
            .sub(position.startCumulativeVirtualCount)
            .div(args.tdaoInfo.lastPeriodGlobalInflationUpdated - lastPeriodPositionUpdated)

        if (!avgDebtPerPeriod.eq(0)) {
          approximateRewards =
            position.count
              .mul(position.durationMonths)
              .div(12)
              .mul(bnf(tokenRewardsStatus.totalRewards).sub(position.startTotalRewards))
              .div(avgDebtPerPeriod)
        }
      }

      return [id, {
        nftTokenID: id,
        approximateRewards: unscale(approximateRewards, 18),
        count: positions[id].count.toString(),
        startTotalRewards: positions[id].startTotalRewards.toString(),
        startCumulativeVirtualCount: positions[id].startCumulativeVirtualCount.toString(),
        lastPeriodUpdated: positions[id].lastPeriodUpdated.toNumber(),
        endPeriod: positions[id].endPeriod.toNumber(),
        durationMonths: positions[id].durationMonths.toNumber(),
        underlyingTokenID: positions[id].tokenID,
        canBeUnlocked: canBeUnlocked[getCanBeUnlockedId(id)],
        svg: tokenSVGs[getSVGId(id)]
      }]
    }))

    return result
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
