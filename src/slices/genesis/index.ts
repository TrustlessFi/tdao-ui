import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"
import { sliceState, initialState as baseInitialState } from "../index"
import getContract, { getMulticallContract } from "../../utils/getContract"

import { Accounting, HuePositionNFT } from "@trustlessfi/typechain"
import { ProtocolContract } from "../contracts"
import {
  fetchGenesisDebtPositions,
  fetchGenesisLiquidityPositions,
  fetchRounds,
  DebtPosition,
  LiquidityPosition,
  Round,
} from "./api"

interface GenesisPositions {
  debt: DebtPosition[]
  liquidity: LiquidityPosition[]
}

export interface GenesisState {
  positions: sliceState<GenesisPositions>
  rounds: sliceState<Round[]>
}

const initialState: GenesisState = {
  positions: baseInitialState as sliceState<GenesisPositions>,
  rounds: baseInitialState as sliceState<Round[]>,
}

export interface getGenesisPositionsArgs {
  Accounting: string
  HuePositionNFT: string
  TrustlessMulticall: string
}

export const getGenesisPositions = createAsyncThunk(
  "genesis/getGenesisPositions",
  async (args: getGenesisPositionsArgs) => {
    const accounting = getContract(
      args.Accounting,
      ProtocolContract.Accounting
    ) as Accounting
    const huePositionNFT = getContract(
      args.HuePositionNFT,
      ProtocolContract.HuePositionNFT
    ) as HuePositionNFT
    const trustlessMulticall = getMulticallContract(args.TrustlessMulticall)
    const contracts = { accounting, huePositionNFT, trustlessMulticall }

    const debtPositions = await fetchGenesisDebtPositions({ contracts })
    const debtOwnerIDs = Array.from(
      new Set(debtPositions.map((debtPosition) => debtPosition.owner))
    )
    const liquidityPositions = await fetchGenesisLiquidityPositions({
      contracts,
      ownerIDs: debtOwnerIDs,
    })

    return {
      debt: debtPositions,
      liquidity: liquidityPositions,
    }
  }
)

export const getGenesisRounds = createAsyncThunk(
  "genesis/getGenesisRounds",
  async (_: {}) => {
    return fetchRounds()
  }
)

export const genesisSlice = createSlice({
  name: "genesis",
  initialState: initialState as GenesisState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(getGenesisPositions.pending, (state) => {
      state.positions.loading = true
    })
    builder.addCase(getGenesisRounds.pending, (state) => {
      state.rounds.loading = true
    })
    builder.addCase(getGenesisPositions.rejected, (state, action) => {
      state.positions.loading = false
      state.positions.data.error = action.error
    })
    builder.addCase(getGenesisRounds.rejected, (state, action) => {
      state.rounds.loading = false
      state.rounds.data.error = action.error
    })
    builder.addCase(getGenesisPositions.fulfilled, (state, action) => {
      state.positions.loading = false
      state.positions.data.value = action.payload
    })
    builder.addCase(getGenesisRounds.fulfilled, (state, action) => {
      state.rounds.loading = false
      state.rounds.data.value = action.payload
    })
  },
})

export default genesisSlice.reducer
