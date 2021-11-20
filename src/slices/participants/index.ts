import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { sliceState, initialState } from '../'
import { getGenericReducerBuilder } from '../'
import getContract, {getMulticallContract} from '../../utils/getContract'

import { Accounting, HuePositionNFT } from '@trustlessfi/typechain'
import { ProtocolContract } from '../contracts'
import { fetchParticipants } from './api';

export interface participantsInfo {
  addresses: string[]
}

export interface PositionsState extends sliceState<participantsInfo> {

}

export interface getParticipantsArgs {
    ProtocolDataAggregator: string,
    Accounting: string,
    HuePositionNFT: string,
    TrustlessMulticall: string,
}

export const getParticipants = createAsyncThunk(
  'participants/getParticipants',
  async (args: getParticipantsArgs) => {
    const accounting = getContract(args.Accounting, ProtocolContract.Accounting) as Accounting
    const huePositionNFT = getContract(args.HuePositionNFT, ProtocolContract.HuePositionNFT) as HuePositionNFT
    const trustlessMulticall = getMulticallContract(args.TrustlessMulticall);
    const contracts = {accounting, huePositionNFT, trustlessMulticall};

    return {addresses: await fetchParticipants({contracts})};
  }
)

export const participantsSlice = createSlice({
  name: 'participants',
  initialState: initialState as PositionsState,
  reducers: {
    clearPositions: (state) => {
      state.data.value = null
    },
  },
  extraReducers: (builder) => {
    getGenericReducerBuilder(builder, getParticipants)
  },
})


export default participantsSlice.reducer
