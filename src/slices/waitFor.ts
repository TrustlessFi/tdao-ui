import { AppDispatch, store, RootState } from "../app/store"
import { AsyncThunkAction } from "@reduxjs/toolkit"
import { AppSelector } from "../app/hooks"
import { getGovernorInfo } from "./governor"
import { getMarketInfo } from "./market"
import { getRatesInfo } from "./rates"
import { getBalances } from "./balances"
import { getPoolsMetadata } from "./poolsMetadata"
import { getLiquidityPositions } from "./liquidityPositions"
import { getTDaoPositions } from "./tdaoPositions"
import { getPositions } from "./positions"
import { getProposals } from "./proposals"
import { getSystemDebtInfo } from "./systemDebt"
import { getLiquidationsInfo } from "./liquidations"
import { getRewardsInfo } from "./rewards"
import { getPricesInfo } from "./prices"
import { getPoolCurrentData } from "./poolCurrentData"
import { getContracts } from "./contracts"
import { getTDaoInfo } from './tdaoInfo'
import { getTcpAllocationInfo } from './tcpAllocation'

import { sliceState } from "./"
import { assertUnreachable } from "../utils/index"

import { getGenesisPositions, getGenesisAllocations } from "./genesis"

enum FetchNode {
  ChainID,
  Governor,
  TDao,
  TrustlessMulticall,
  ProtocolDataAggregator,

  TDaoInfo,

  GovernorInfo,
  LiquidationsInfo,
  RewardsInfo,
  MarketInfo,
  RatesInfo,
  PoolsMetadata,
  SDI,
  UserAddress,
  Contracts,
  GenesisAllocation,
}

const getNodeFetch = (
  fetchNode: FetchNode,
  selector: AppSelector,
  dispatch: AppDispatch
) => {
  switch (fetchNode) {
    case FetchNode.ChainID:
      return { chainID: selector(state => state.chainID.chainID) }
    case FetchNode.Governor:
      return { governor: selector(state => state.chainID.governor) }
    case FetchNode.TDao:
      return { tdao: selector(state => state.chainID.tdao) }
    case FetchNode.TDaoInfo:
      return { tdaoInfo: waitForTDaoInfo(selector, dispatch) }
    case FetchNode.GenesisAllocation:
      return {
        genesisAllocation: selector(state => state.chainID.genesisAllocation),
      }
    case FetchNode.TrustlessMulticall:
      return {
        trustlessMulticall: selector(
          state => state.chainID.trustlessMulticall
        ),
      }
    case FetchNode.ProtocolDataAggregator:
      return {
        protocolDataAggregator: selector(
          state => state.chainID.protocolDataAggregator
        ),
      }

    case FetchNode.GovernorInfo:
      return { governorInfo: waitForGovernor(selector, dispatch) }
    case FetchNode.LiquidationsInfo:
      return { liquidationsInfo: waitForLiquidations(selector, dispatch) }
    case FetchNode.RewardsInfo:
      return { rewardsInfo: waitForRewards(selector, dispatch) }
    case FetchNode.MarketInfo:
      return { marketInfo: waitForMarket(selector, dispatch) }
    case FetchNode.RatesInfo:
      return { ratesInfo: waitForRates(selector, dispatch) }
    case FetchNode.PoolsMetadata:
      return { poolsMetadata: waitForPoolsMetadata(selector, dispatch) }
    case FetchNode.SDI:
      return { sdi: waitForSDI(selector, dispatch) }
    case FetchNode.UserAddress:
      return { userAddress: selector(state => state.wallet.address) }
    case FetchNode.Contracts:
      return { contracts: waitForContracts(selector, dispatch) }

    default:
      assertUnreachable(fetchNode)
  }
}

const getWaitFunction =
  <Args extends {}, Value, AdditionalData extends {}>(
    stateSelector: (state: RootState) => sliceState<Value>,
    thunk: (args: Args) => AsyncThunkAction<Value | null, Args, {}>,
    fetchNodes: FetchNode[],
    additionalData?: AdditionalData
  ) =>
  (selector: AppSelector, dispatch: AppDispatch) => {
    const state = selector(stateSelector)

    let inputArgs = additionalData === undefined ? {} : { ...additionalData }
    fetchNodes.map((fetchNode) => {
      const fetchedNode = getNodeFetch(fetchNode, selector, dispatch)
      inputArgs = { ...inputArgs, ...fetchedNode }
    })

    if (Object.values(inputArgs).includes(null)) return null

    if (state !== undefined && state.data.error !== null) {
      console.error(state.data.error.message)
      throw state.data.error
    }

    if (
      state === undefined ||
      (state.data.value === null && !stateSelector(store.getState()).loading)
    ) {
      dispatch(thunk(inputArgs as NonNullable<Args>))
    }

    return state === undefined ? null : state.data.value
  }

/// ============================ Get Contracts Logic =======================================
export const waitForContracts = getWaitFunction(
  (state: RootState) => state.contracts,
  getContracts,
  [FetchNode.TDao, FetchNode.Governor, FetchNode.TrustlessMulticall]
)

export const getPoolCurrentDataWaitFunction = (poolAddress: string) =>
  getWaitFunction(
    (state: RootState) => state.poolCurrentData[poolAddress],
    getPoolCurrentData,
    [
      FetchNode.Contracts,
      FetchNode.TrustlessMulticall,
      FetchNode.UserAddress,
      FetchNode.RewardsInfo,
      FetchNode.PoolsMetadata,
    ],
    { poolAddress }
  )

/// ============================ Get Info Logic =======================================
export const waitForGovernor = getWaitFunction(
  (state: RootState) => state.governor,
  getGovernorInfo,
  [FetchNode.Governor]
)

export const waitForPrices = getWaitFunction(
  (state: RootState) => state.prices,
  getPricesInfo,
  [
    FetchNode.Contracts,
    FetchNode.LiquidationsInfo,
    FetchNode.TrustlessMulticall,
  ]
)

export const waitForMarket = getWaitFunction(
  (state: RootState) => state.market,
  getMarketInfo,
  [FetchNode.Contracts, FetchNode.TrustlessMulticall]
)

export const waitForPositions = getWaitFunction(
  (state: RootState) => state.positions,
  getPositions,
  [
    FetchNode.UserAddress,
    FetchNode.SDI,
    FetchNode.MarketInfo,
    FetchNode.Contracts,
    FetchNode.TrustlessMulticall,
  ]
)

export const waitForProposals = getWaitFunction(
  (state: RootState) => state.proposals,
  getProposals,
  [FetchNode.Contracts, FetchNode.UserAddress]
)

export const waitForLiquidations = getWaitFunction(
  (state: RootState) => state.liquidations,
  getLiquidationsInfo,
  [FetchNode.Contracts, FetchNode.TrustlessMulticall]
)

export const waitForRewards = getWaitFunction(
  (state: RootState) => state.rewards,
  getRewardsInfo,
  [FetchNode.Contracts, FetchNode.TrustlessMulticall]
)

export const waitForRates = getWaitFunction(
  (state: RootState) => state.rates,
  getRatesInfo,
  [FetchNode.Contracts, FetchNode.TrustlessMulticall]
)

export const waitForSDI = getWaitFunction(
  (state: RootState) => state.systemDebt,
  getSystemDebtInfo,
  [FetchNode.Contracts]
)

export const waitForBalances = getWaitFunction(
  (state: RootState) => state.balances,
  getBalances,
  [FetchNode.Contracts, FetchNode.UserAddress, FetchNode.TrustlessMulticall, FetchNode.TDao, FetchNode.TDaoInfo]
)

export const waitForLiquidityPositions = getWaitFunction(
  (state: RootState) => state.liquidityPositions,
  getLiquidityPositions,
  [FetchNode.UserAddress, FetchNode.Contracts, FetchNode.TrustlessMulticall]
)

export const waitForPoolsMetadata = getWaitFunction(
  (state: RootState) => state.poolsMetadata,
  getPoolsMetadata,
  [
    FetchNode.ProtocolDataAggregator,
    FetchNode.TrustlessMulticall,
    FetchNode.Contracts,
    FetchNode.UserAddress,
  ]
)

export const waitForGenesisPositions = getWaitFunction(
  (state: RootState) => state.genesis.positions,
  getGenesisPositions,
  [FetchNode.Contracts, FetchNode.TrustlessMulticall]
)

export const waitForGenesisAllocations = getWaitFunction(
  (state: RootState) => state.genesis.allocations,
  getGenesisAllocations,
  [FetchNode.Contracts, FetchNode.TrustlessMulticall]
)

export const waitForTDaoPositions = getWaitFunction(
  (state: RootState) => state.tdaoPositions,
  getTDaoPositions,
  [FetchNode.UserAddress, FetchNode.TDao, FetchNode.Contracts, FetchNode.TrustlessMulticall, FetchNode.TDaoInfo]
)

export const waitForTDaoInfo = getWaitFunction(
  (state: RootState) => state.tdaoInfo,
  getTDaoInfo,
  [FetchNode.TDao, FetchNode.TrustlessMulticall]
)

export const waitForTcpAllocationInfo = getWaitFunction(
  (state: RootState) => state.tcpAllocationInfo,
  getTcpAllocationInfo,
  [FetchNode.UserAddress, FetchNode.TrustlessMulticall, FetchNode.Contracts]
)
