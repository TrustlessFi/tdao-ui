import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"
import { initialState as baseInitialState, sliceState } from "../index"
import getContract, { getMulticallContract } from "../../utils/getContract"

import {
  Accounting,
  GenesisAllocation,
  HuePositionNFT,
} from "@trustlessfi/typechain"
import {ContractsInfo, ProtocolContract, RootContract} from "../contracts"
import {
  DebtPosition,
  fetchDebtPositions,
  fetchLiquidityPositions,
  fetchAllocations,
  claimAllocations,
  LiquidityPosition,
  Allocation,
  Allocations,
} from "./api"
import getProvider from "../../utils/getProvider";

interface GenesisPositions {
  debt: DebtPosition[]
  liquidity: LiquidityPosition[]
}

export interface GenesisState {
  positions: sliceState<GenesisPositions>
  allocations: sliceState<Allocations>
}

const initialState: GenesisState = {
  positions: baseInitialState as sliceState<GenesisPositions>,
  allocations: baseInitialState as sliceState<Allocations>,
}

export interface getGenesisPositionsArgs {
  contracts: ContractsInfo
  trustlessMulticall: string
}

export const getGenesisPositions = createAsyncThunk(
  "genesis/getGenesisPositions",
  async (args: getGenesisPositionsArgs) => {
    const accounting = getContract(
      args.contracts.Accounting,
      ProtocolContract.Accounting
    ) as Accounting
    const huePositionNFT = getContract(
      args.contracts.HuePositionNFT,
      ProtocolContract.HuePositionNFT
    ) as HuePositionNFT

    const trustlessMulticall = getMulticallContract(args.trustlessMulticall)
    const contracts = { accounting, huePositionNFT, trustlessMulticall }

    const debtPositions = await fetchDebtPositions({ contracts })
    const debtOwnerIDs = Array.from(
      new Set(debtPositions.map((debtPosition) => debtPosition.owner))
    )
    const liquidityPositions = await fetchLiquidityPositions({
      contracts,
      ownerIDs: debtOwnerIDs,
    })

    return {
      debt: debtPositions,
      liquidity: liquidityPositions,
    }
  }
)

export const getGenesisAllocations = createAsyncThunk(
  "genesis/getGenesisAllocations",
  async (_: {}) => {
    return fetchAllocations()
  }
)

interface claimAllocationsArgs {
  genesisAllocation: string
  allocations: Allocation[]
}
export const waitForGenesisClaimAllocations = createAsyncThunk(
  "genesis/claimAllocations",
  async (opts: claimAllocationsArgs, {dispatch}) => {
    const { allocations } = opts

    const provider = getProvider();
    const genesisAllocation = getContract(
      opts.genesisAllocation,
      RootContract.GenesisAllocation
    ).connect(provider.getSigner()) as GenesisAllocation

    const transaction = await claimAllocations({ genesisAllocation, allocations });
    const receipt = await provider.waitForTransaction(transaction.hash);
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
    builder.addCase(getGenesisAllocations.pending, (state) => {
      state.allocations.loading = true
    })
    builder.addCase(getGenesisPositions.rejected, (state, action) => {
      state.positions.loading = false
      state.positions.data.error = action.error
    })
    builder.addCase(getGenesisAllocations.rejected, (state, action) => {
      state.allocations.loading = false
      state.allocations.data.error = action.error
    })
    builder.addCase(getGenesisPositions.fulfilled, (state, action) => {
      state.positions.loading = false
      state.positions.data.value = action.payload
    })
    builder.addCase(getGenesisAllocations.fulfilled, (state, action) => {
      state.allocations.loading = false
      state.allocations.data.value = action.payload
    })
  },
})

export default genesisSlice.reducer
