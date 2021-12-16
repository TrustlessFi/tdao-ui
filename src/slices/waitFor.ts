import { AppDispatch, store, RootState } from "../app/store"
import { AsyncThunkAction, AsyncThunk } from "@reduxjs/toolkit"
import { AppSelector } from "../app/hooks"
import { getGovernorInfo, governorInfo } from "./governor"
import { getMarketInfo, marketInfo } from "./market"
import { getRatesInfo, ratesInfo } from "./rates"
import { getBalances } from "./balances"
import { ChainID } from "@trustlessfi/addresses"
import { getPoolsMetadata } from "./poolsMetadata"
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

import { getGenesisPositions, getGenesisAllocations } from "./genesis"


const getStateSelector = <T>(selectorFunc: (state: RootState) => T) =>
  (selector: AppSelector, _dispatch: AppDispatch) => selector(selectorFunc)

interface fetchNodeTypes {
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
  GovernorInfo: getWaitFunction((state: RootState) => state.governor, getGovernorInfo, ['Governor']),
  LiquidationsInfo: getWaitFunction(
    (state: RootState) => state.liquidations,
    getLiquidationsInfo,
    ['TrustlessMulticall', 'Contracts']
  ),
  RewardsInfo: getWaitFunction(
    (state: RootState) => state.rewards,
    getRewardsInfo,
    ['Contracts', 'TrustlessMulticall']
  ),
  MarketInfo: getWaitFunction(
    (state: RootState) => state.market,
    getMarketInfo,
    ['Contracts', 'TrustlessMulticall']
  ),
  RatesInfo: getWaitFunction(
    (state: RootState) => state.rates,
    getRatesInfo,
    ['Contracts', 'TrustlessMulticall'],
  ),
  SDI: getWaitFunction(
    (state: RootState) => state.systemDebt,
    getSystemDebtInfo,
    ['Contracts'],
  ),
  Contracts: getWaitFunction(
    (state: RootState) => state.contracts,
    getContracts,
    ['Governor', 'TDao', 'TrustlessMulticall'],
  ),
})

const getWaitFunction = <
    Dependency extends keyof fetchNodeTypes,
    Args extends Pick<fetchNodeTypes, Dependency>,
    Value
  >(
    stateSelector: (state: RootState) => sliceState<Value>,
    thunk: AsyncThunk<Value, Args, {}>,
    dependencies: Dependency[]
  ) => (selector: AppSelector, dispatch: AppDispatch) => {
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

export type FetchNode = keyof fetchNodeTypes

const waitFor = (fetchNodes: FetchNode[], selector: AppSelector, dispatch: AppDispatch) => {
  const nodes = getFetchNodes()
  return Object.fromEntries(fetchNodes.map(fetchNode => [fetchNode, nodes[fetchNode](selector, dispatch)]))
}



export default waitFor
