import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { initialState } from '../../'
import { getGenericReducerBuilder } from '../../'
import { addressToProtocolToken } from '../../../utils/'
import getContract from '../../../utils/getContract'
import { proposalsArgs, proposalsVoterInfo, ProposalsState, fetchProposalsVoterInfo } from '../'
import { TcpGovernorAlpha } from '@trustlessfi/typechain'
import { ProtocolContract } from '../../contracts/'

export const getTcpProposalsVoterInfo = createAsyncThunk(
  'tcpProposals/getTcpProposalsVoterInfo',
  async (args: proposalsArgs): Promise<proposalsVoterInfo> =>  {

    return await fetchProposalsVoterInfo(
      args.userAddress,
      getContract(args.contracts.TcpGovernorAlpha, ProtocolContract.TcpGovernorAlpha ) as TcpGovernorAlpha,
      addressToProtocolToken(args.contracts.Tcp),
      args.trustlessMulticall,
    )
  }
)

export const tcpProposalsVoterInfoSlice = createSlice({
  name: 'tcpProposalsVoterInfo',
  initialState: initialState as ProposalsState,
  reducers: {
    clearTcpProposalsVoterInfo: (state) => {
      state.data.value = null
    },
  },
  extraReducers: (builder) => {
    builder = getGenericReducerBuilder(builder, getTcpProposalsVoterInfo)
  },
})

export const { clearTcpProposalsVoterInfo } = tcpProposalsVoterInfoSlice.actions

export default tcpProposalsVoterInfoSlice.reducer
