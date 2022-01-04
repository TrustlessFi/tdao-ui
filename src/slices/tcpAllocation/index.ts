import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { sliceState, initialState } from '../'
import { getGenericReducerBuilder } from '../'
import getContract, { getMulticallContract } from '../../utils/getContract'
import { contractsInfo } from '../contracts/'
import {
  executeMulticalls,
  rc,
  oneContractManyFunctionMC,
} from '@trustlessfi/multicall'
import { unscale } from '../../utils'
import { PromiseType } from '@trustlessfi/utils'


import { TDao, TcpAllocation } from '@trustlessfi/typechain'
import { ProtocolContract } from '../contracts'

export interface tcpAllocationInfo {
  restrictedToUnlockDuration: boolean
  restrictedUnlockTime: number
  startTime: number
  totalAllocation: number
  minimumAverageTokensAllocatedxLockYears: string
  tokensAllocated: number
  cumulativeTokensAllocatedxLockYears: string
}

export interface tcpAllocationInfoArgs {
  userAddress: string
  trustlessMulticall: string
  contracts: contractsInfo
}

export interface TcpAllocationInfoState extends sliceState<tcpAllocationInfo> {}

export const getTcpAllocationInfo = createAsyncThunk(
  'tcpAllocation/getTcpAllocationInfo',
  async (args: tcpAllocationInfoArgs): Promise<tcpAllocationInfo> => {
    const tcpAllocation = getContract(args.contracts.TcpAllocation, ProtocolContract.TcpAllocation) as TDao
    const trustlessMulticall = getMulticallContract(args.trustlessMulticall)

    const { tdaoInfo } = await executeMulticalls(trustlessMulticall, {
      tdaoInfo: oneContractManyFunctionMC(
        tcpAllocation,
        {
          restrictedToUnlockDuration: rc.Boolean,
          restrictedUnlockTime: rc.BigNumberToNumber,
          startTime: rc.BigNumberToNumber,
          getUserAllocation:
            (result: any) => result as PromiseType<ReturnType<TcpAllocation['getUserAllocation']>>,
        },
        {
          restrictedToUnlockDuration: [args.userAddress],
          getUserAllocation: [args.userAddress],
        }
      ),
    })

    return {
      restrictedToUnlockDuration: tdaoInfo.restrictedToUnlockDuration,
      restrictedUnlockTime: tdaoInfo.restrictedUnlockTime,
      startTime: tdaoInfo.startTime,
      totalAllocation: unscale(tdaoInfo.getUserAllocation.totalAllocation),
      minimumAverageTokensAllocatedxLockYears: tdaoInfo.getUserAllocation.minimumAverageTokensAllocatedxLockYears.toString(),
      tokensAllocated: unscale(tdaoInfo.getUserAllocation.tokensAllocated),
      cumulativeTokensAllocatedxLockYears: tdaoInfo.getUserAllocation.cumulativeTokensAllocatedxLockYears.toString(),
    }
  }
)

const name = 'tcpAllocationInfo'

export const tcpAllocationInfoSlice = createSlice({
  name,
  initialState: initialState as TcpAllocationInfoState,
  reducers: {
    clearTcpAllocationInfo: (state) => {
      state.data.value = null
    },
  },
  extraReducers: (builder) => {
    builder = getGenericReducerBuilder(builder, getTcpAllocationInfo)
  },
})

export const { clearTcpAllocationInfo } = tcpAllocationInfoSlice.actions

export default tcpAllocationInfoSlice.reducer
