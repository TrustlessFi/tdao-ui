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
import getProvider from '../../utils/getProvider';
import erc20Artifact from '@trustlessfi/artifacts/dist/@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json'
import { PromiseType } from '@trustlessfi/utils'


import { TDao, TcpAllocation } from '@trustlessfi/typechain'
import { TDaoRootContract, ProtocolContract } from '../contracts'

export interface tcpAllocationInfo {
  restrictedToUnlockDuration: boolean
  restrictedUnlockTime: number
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

    const { tdaoInfo, lockPosition } = await executeMulticalls(trustlessMulticall, {
      tdaoInfo: getMulticall(
        tcpAllocation,
        {
          restrictedToUnlockDuration: rc.Boolean,
          restrictedUnlockTime: rc.BigNumberToNumber,
          getUserAllocation:
            (result: any) => result as PromiseType<ReturnType<TcpAllocation['getUserAllocation']>>,
        },
        {
          restrictedToUnlockDuration: [args.userAddress],
          getUserAllocation: [args.userAddress],
        }
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
  reducers: {},
  extraReducers: (builder) => {
    builder = getGenericReducerBuilder(builder, getTcpAllocationInfo)
  },
})

export default tcpAllocationInfoSlice.reducer
