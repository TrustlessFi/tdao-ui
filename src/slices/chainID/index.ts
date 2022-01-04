import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { ChainID, getAddress } from "@trustlessfi/addresses"

import localHardhatAddresses from "../../utils/localHardhatAddresses.json"

export interface ChainIDState {
  chainID: ChainID | null
  unknownChainID: number | null
  governor: string | null
  trustlessMulticall: string | null
  protocolDataAggregator: string | null
  genesisAllocation: string | null
  tdao: string | null
}

const initialState: ChainIDState = {
  chainID: null,
  unknownChainID: null,
  governor: null,
  trustlessMulticall: null,
  protocolDataAggregator: null,
  genesisAllocation: null,
  tdao: null,
}

export const getChainIDFromState = (state: ChainIDState) =>
  state.chainID !== null ? state.chainID : state.unknownChainID

const name = "chainID"

export const chainIDSlice = createSlice({
  name,
  initialState: initialState,
  reducers: {
    chainIDFound: (_state, action: PayloadAction<number>) => {
      const chainID = action.payload
      return ChainID[chainID] === undefined
        ? {
            unknownChainID: chainID,
            chainID: null,
            governor: null,
            trustlessMulticall: null,
            protocolDataAggregator: null,
            genesisAllocation: null,
            tdao: null,
          }
        : {
            unknownChainID: null,
            chainID,
            governor: getAddress(
              chainID,
              "TCP",
              "Governor",
              localHardhatAddresses
            ),
            trustlessMulticall: getAddress(
              chainID,
              "TrustlessMulticall",
              "multicall",
              localHardhatAddresses
            ),
            protocolDataAggregator: getAddress(
              chainID,
              "TCP",
              "ProtocolDataAggregator",
              localHardhatAddresses
            ),
            genesisAllocation: getAddress(
              chainID,
              "TCP",
              "GenesisAllocation",
              localHardhatAddresses
            ),
            tdao: getAddress(
              chainID,
              "TDAO",
              "TDao",
              localHardhatAddresses
            ),
          }
    },
  },
})

export const { chainIDFound } = chainIDSlice.actions

export default chainIDSlice.reducer
