import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { initialState } from '../../'
import { getGenericReducerBuilder } from '../../'
import { addressToProtocolToken } from '../../../utils/'
import getContract from '../../../utils/getContract'
import { proposalsArgs, proposalsInfo, ProposalsState, fetchProposals } from '../'
import { TcpGovernorAlpha } from '@trustlessfi/typechain'
import { ProtocolContract } from '../../contracts/'

export const getTcpProposals = createAsyncThunk(
  'tcpProposals/getProposals',
  async (args: proposalsArgs): Promise<proposalsInfo> =>  {

    return await fetchProposals(
      args.userAddress,
      getContract(args.contracts.TcpGovernorAlpha, ProtocolContract.TcpGovernorAlpha ) as TcpGovernorAlpha,
      addressToProtocolToken(args.contracts.Tcp),
      args.trustlessMulticall,
      0.005,
    )
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
