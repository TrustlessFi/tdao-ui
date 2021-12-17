import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { initialState } from '../../'
import { getGenericReducerBuilder } from '../../'
import getContract from '../../../utils/getContract'
import { proposalsArgs, proposalsInfo, ProposalsState, fetchProposals } from '../'
import { TcpGovernorAlpha } from '@trustlessfi/typechain'
import { ProtocolContract } from '../../contracts/'

export const getTcpProposals = createAsyncThunk(
  'tcpProposals/getProposals',
  async (args: proposalsArgs): Promise<proposalsInfo> =>  {
    console.log("inside ", 'tcpProposals/getProposals', args)
    const govAlpha = getContract(
      args.contracts.TcpGovernorAlpha,
      ProtocolContract.TcpGovernorAlpha
    ) as TcpGovernorAlpha
    console.log("here 1")

    const result =  await fetchProposals(args.userAddress, govAlpha)
    console.log("here 2")
    return result
  }
)

export const tcpProposalsSlice = createSlice({
  name: 'tcpProposals',
  initialState: initialState as ProposalsState,
  reducers: {
    clearTcpProposals: (state) => {
      state.data.value = null
    },
  },
  extraReducers: (builder) => {
    builder = getGenericReducerBuilder(builder, getTcpProposals)
  },
})

export const { clearTcpProposals } = tcpProposalsSlice.actions

export default tcpProposalsSlice.reducer
