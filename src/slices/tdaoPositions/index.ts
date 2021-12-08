import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { sliceState, initialState } from '../'
import { ContractsInfo } from '../contracts'
import { getGenericReducerBuilder } from '../'
import getContract, { getMulticallContract } from '../../utils/getContract'
import { getDuplicateFuncMulticall, executeMulticalls, rc } from '@trustlessfi/multicall'
import { PromiseType } from '@trustlessfi/utils'

import { TDaoPositionNFT, TDao } from '@trustlessfi/typechain'
import { TDaoContract, TDaoRootContract } from '../contracts'

export interface TDaoPosition {
  nftTokenID: string
  count: string
  startTotalRewards: string
  startCumulativeVirtualCount: string
  lastPeriodUpdated: number
  endPeriod: number
  durationMonths: number
  underlyingTokenID: number
  svg: string
}

export interface tdaoPositionsInfo { [key: string]: TDaoPosition }

export interface tdaoPositionsArgs {
  userAddress: string,
  tdao: string,
  contracts: ContractsInfo,
  trustlessMulticall: string,
}

export interface TDaoPositionsState extends sliceState<tdaoPositionsInfo> {}

const fetchTDaoPositions = async (args: tdaoPositionsArgs): Promise<tdaoPositionsInfo> => {
  const tdao = getContract(args.tdao, TDaoRootContract.TDao) as TDao
  const tdaoPostionNFT = getContract(args.contracts[TDaoContract.TDaoPositionNFT], TDaoContract.TDaoPositionNFT) as TDaoPositionNFT
  const trustlessMulticall = getMulticallContract(args.trustlessMulticall)

  // fetch the positions
  const positionIDs = (await tdaoPostionNFT.positionIDs(args.userAddress)).map(id => id.toString())

  const getSVGId = (id: string) => id + 'svg'

  const { positions, tokenSVGs } = await executeMulticalls(trustlessMulticall, {
    positions: getDuplicateFuncMulticall(
      tdao,
      'getPosition',
      (result: any) => result as PromiseType<ReturnType<TDao['getPosition']>>,
      Object.fromEntries(positionIDs.map(positionID => [positionID.toString(), [positionID]]))
    ),
    tokenSVGs: getDuplicateFuncMulticall(
      tdaoPostionNFT,
      'tokenURI',
      rc.String,
      Object.fromEntries(positionIDs.map(positionID => [getSVGId(positionID.toString()), [positionID]]))
    ),
  })

  return Object.fromEntries(positionIDs.map(id => [id, {
    nftTokenID: id,
    count: positions[id].count.toString(),
    startTotalRewards: positions[id].startTotalRewards.toString(),
    startCumulativeVirtualCount: positions[id].startCumulativeVirtualCount.toString(),
    lastPeriodUpdated: positions[id].lastPeriodUpdated.toNumber(),
    endPeriod: positions[id].endPeriod.toNumber(),
    durationMonths: positions[id].durationMonths.toNumber(),
    underlyingTokenID: positions[id].tokenID,
    svg: tokenSVGs[getSVGId(id)]
  }]))
}

export const getTDaoPositions = createAsyncThunk(
  'tdaoPositions/getTDaoPositions',
  async (data: tdaoPositionsArgs) => await fetchTDaoPositions(data),
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
