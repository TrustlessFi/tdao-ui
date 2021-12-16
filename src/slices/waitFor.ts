import { AppDispatch, store, RootState } from "../app/store"
import { AsyncThunkAction, AsyncThunk } from "@reduxjs/toolkit"
import { AppSelector } from "../app/hooks"
import { getGovernorInfo, governorInfo } from "./governor"
import { getMarketInfo, marketInfo } from "./market"
import { getRatesInfo, ratesInfo } from "./rates"
import { getBalances } from "./balances"
import { ChainID } from "@trustlessfi/addresses"
import { getPoolsMetadata, poolMetadata } from "./poolsMetadata"
import { getLiquidityPositions } from "./liquidityPositions"
import { getTDaoPositions } from "./tdaoPositions"
import { getPositions } from "./positions"
import { getProposals } from "./proposals"
import { getSystemDebtInfo, systemDebtInfo } from "./systemDebt"
import { getLiquidationsInfo, liquidationsInfo } from "./liquidations"
import { getRewardsInfo, rewardsInfo } from "./rewards"
import { getPricesInfo } from "./prices"
import { getPoolCurrentData } from "./poolCurrentData"
import { getContracts, ContractsInfo } from "./contracts"
import { getTDaoInfo, tdaoInfo } from './tdaoInfo'
import { getTcpAllocationInfo } from './tcpAllocation'
import { sliceState } from "./"
import { assertUnreachable } from "../utils/index"

import { getGenesisPositions, getGenesisAllocations } from "./genesis"


const getStateSelector = <T>(selectorFunc: (state: RootState) => T) =>
  (selector: AppSelector, _dispatch: AppDispatch) => selector(selectorFunc)

export interface fetchNodeTypes {
  ChainID: ChainID
  Governor: string
  TDao: string
  GenesisAllocation: string
  TrustlessMulticall: string
  ProtocolDataAggregator: string
  UserAddress: string
  TDaoInfo: tdaoInfo
  GovernorInfo: governorInfo
  LiquidationsInfo: liquidationsInfo
  RewardsInfo: rewardsInfo
  MarketInfo: marketInfo
  RatesInfo: ratesInfo
  SDI: systemDebtInfo
  Contracts: ContractsInfo
}

export type FetchNode = keyof fetchNodeTypes
// export type FetchNode = keyof ReturnType<typeof getFetchNodes>

// export type argsList = {[key in FetchNode]?: fetchNodeTypes[key] }

export type fetchDependencyList = {[key in FetchNode]?: boolean}

export type argsList = Partial<fetchNodeTypes>

const getFetchNodes: () => {[key in FetchNode]: (selector: AppSelector, _dispatch: AppDispatch) => fetchNodeTypes[key] | null} = () => ({
  ChainID: getStateSelector(state => state.chainID.chainID),
  Governor: getStateSelector(state => state.chainID.governor),
  TDao: getStateSelector(state => state.chainID.tdao),
  GenesisAllocation: getStateSelector(state => state.chainID.genesisAllocation),
  TrustlessMulticall: getStateSelector(state => state.chainID.trustlessMulticall),
  ProtocolDataAggregator: getStateSelector(state => state.chainID.protocolDataAggregator),
  UserAddress: getStateSelector(state => state.wallet.address),
  TDaoInfo: getWaitFunction(
    (state: RootState) => state.tdaoInfo,
    getTDaoInfo,
    ['TDao', 'TrustlessMulticall'],
  ),
  GovernorInfo: getWaitFunction((state: RootState) => state.governor, getGovernorInfo),
  LiquidationsInfo: getWaitFunction((state: RootState) => state.liquidations, getLiquidationsInfo),
  RewardsInfo: getWaitFunction((state: RootState) => state.rewards, getRewardsInfo),
  MarketInfo: getWaitFunction((state: RootState) => state.market, getMarketInfo),
  RatesInfo: getWaitFunction((state: RootState) => state.rates, getRatesInfo),
  SDI: getWaitFunction((state: RootState) => state.systemDebt, getSystemDebtInfo),
  Contracts: getWaitFunction((state: RootState) => state.contracts, getContracts),
})

const test1: fetchDependencyList = {}
// const test1: fetchDependencyList = {TDao: true, TrustlessMulticall: true}

const derp = typeof test1

const getWaitFunction = <
    Dependency extends keyof fetchNodeTypes,
    Args extends Pick<fetchNodeTypes, Dependency>,
    Value
  >(
    stateSelector: (state: RootState) => sliceState<Value>,
    thunk: AsyncThunk<Value, Args, {}>,
    dependencies: Dependency[]
  ) =>
  (selector: AppSelector, dispatch: AppDispatch) => {
    const state = selector(stateSelector)

    let inputArgs = {}
    dependencies.map((fetchNode) => {
      const fetchedNode = { [fetchNode]: getFetchNodes()[fetchNode](selector, dispatch) }
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
