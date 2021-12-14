import { Contract } from 'ethers'
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { sliceState, initialState } from '../'
import { getGenericReducerBuilder } from '../'
import getContract, { getMulticallContract } from '../../utils/getContract'
import { ContractsInfo } from '../contracts/'
import {
  executeMulticalls,
  rc,
  getMulticall,
  contractFunctionSelector,
  getDuplicateContractMulticall,
  getDuplicateFuncMulticall
} from '@trustlessfi/multicall'
import { zeroAddress, unscale } from '../../utils'
import { PromiseType } from '@trustlessfi/utils'


import { TDao, TcpAllocation } from '@trustlessfi/typechain'
import { TDaoRootContract, ProtocolContract } from '../contracts'

export interface tcpAllocationInfo {
  restrictedToUnlockDuration: boolean
  restrictedUnlockTime: number
  startTime: number
  blockTime: number
  totalAllocation: number
  minimumAverageTokensAllocatedxLockYears: string
  tokensAllocated: number
  cumulativeTokensAllocatedxLockYears: string
}

export interface tcpAllocationInfoArgs {
  userAddress: string
  trustlessMulticall: string
  contracts: ContractsInfo
}

export interface TcpAllocationInfoState extends sliceState<tcpAllocationInfo> {}


export const getTcpAllocationInfo = createAsyncThunk(
  'tcpAllocation/getTcpAllocationInfo',
  async (args: tcpAllocationInfoArgs): Promise<tcpAllocationInfo> => {
    console.log('tcpAllocation/getTcpAllocationInfo', {args})
    const tcpAllocation = getContract(args.contracts.TcpAllocation, ProtocolContract.TcpAllocation) as TDao
    const trustlessMulticall = getMulticallContract(args.trustlessMulticall)

    console.log("here 1")

    const { tdaoInfo, lockPosition, blockTime } = await executeMulticalls(trustlessMulticall, {
      tdaoInfo: getMulticall(
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
      blockTime: getMulticall(
        trustlessMulticall,
        {
          getCurrentBlockTimestamp: rc.BigNumberToNumber,
        },
      ),
      lockPosition: getDuplicateFuncMulticall(
        tcpAllocation,
        'getUserAllocation',
        (result: any) => result as PromiseType<ReturnType<TcpAllocation['getUserAllocation']>>,
        { lockPosition: [args.userAddress]}
      ),
    })

    console.log({tdaoInfo, lockPosition})
    console.log("here 2")

    return {
      restrictedToUnlockDuration: tdaoInfo.restrictedToUnlockDuration,
      restrictedUnlockTime: tdaoInfo.restrictedUnlockTime,
      startTime: tdaoInfo.startTime,
      blockTime: blockTime.getCurrentBlockTimestamp,
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
