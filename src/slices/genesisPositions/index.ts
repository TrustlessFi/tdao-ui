import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"
import { initialState, sliceState, getGenericReducerBuilder } from "../index"
import getContract, { getMulticallContract } from "../../utils/getContract"

import {
  Accounting,
  HuePositionNFT,
} from "@trustlessfi/typechain"
import {ContractsInfo, ProtocolContract} from "../contracts"
import {
  DebtPosition,
  fetchDebtPositions,
  fetchLiquidityPositions,
  LiquidityPosition,
} from "./api"

export interface genesisPositionsInfo {
  debt: DebtPosition[]
  liquidity: LiquidityPosition[]
}

export type genesisPositionsState = sliceState<genesisPositionsInfo>

export const getGenesisPositions = createAsyncThunk(
  'genesisPositions/getGenesisPositions',
  async (args: { contracts: ContractsInfo, trustlessMulticall: string }): Promise<genesisPositionsInfo> => {
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

export const genesisSlice = createSlice({
  name: 'genesisPositions',
  initialState: initialState as genesisPositionsState,
  reducers: {},
  extraReducers: (builder) => {
    builder = getGenericReducerBuilder(builder, getGenesisPositions)
  },
})

export default genesisSlice.reducer
