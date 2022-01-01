import { sliceState } from '../'
import { initialState, getGenericReducerBuilder } from '../'
import { genesisAllocationsInfo } from '../genesisAllocations'
import { range } from '../../utils'
import { RootContract } from '../contracts'
import getContract, { getMulticallContract} from '../../utils/getContract'
import {
  executeMulticalls,
  rc,
  oneContractOneFunctionMC,
} from '@trustlessfi/multicall'
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { GenesisAllocation } from '@trustlessfi/typechain'

export interface claimedAllocationRoundsInfo {
  claimedRounds: {[key: string]: boolean}
  countRounds: number
}

export interface claimedAllocationRoundsState extends sliceState<claimedAllocationRoundsInfo> {}

export interface claimedAllocationRoundsArgs {
  genesisAllocations: genesisAllocationsInfo
  trustlessMulticall: string
  userAddress: string
  genesisAllocation: string
}

export const getClaimedAllocationRounds = createAsyncThunk(
  'claimedAllocationRounds/getClaimedAllocationRounds',
  async (
    args: claimedAllocationRoundsArgs,
  ): Promise<claimedAllocationRoundsInfo> => {
    const multicall = getMulticallContract(args.trustlessMulticall)
    const genesisAllocation = getContract(args.genesisAllocation, RootContract.GenesisAllocation) as GenesisAllocation

    const countRounds = args.genesisAllocations.roundCount

    const roundIDs = range(0, countRounds)

    const claimedRounds = await executeMulticalls(
      multicall,
      {
        claimedRounds: oneContractOneFunctionMC(
          genesisAllocation,
          'claimedSig',
          rc.Boolean,
          Object.fromEntries(roundIDs.map(roundID => [roundID, [args.userAddress, roundID]])),
        ),
      }
    )
    return {
      ...claimedRounds,
      countRounds,
    }
  }
)

export const claimedAllocationRoundsSlice = createSlice({
  name: 'claimedAllocationRounds',
  initialState: initialState as claimedAllocationRoundsState,
  reducers: {
    clearClaimedAllocationRounds: (state) => {
      state.data.value = null
    },
  },
  extraReducers: (builder) => {
    builder = getGenericReducerBuilder(builder, getClaimedAllocationRounds)
  },
})

export const { clearClaimedAllocationRounds } = claimedAllocationRoundsSlice.actions

export default claimedAllocationRoundsSlice.reducer
