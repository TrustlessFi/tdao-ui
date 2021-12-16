import { AppDispatch, store, RootState } from "../app/store"
import { AsyncThunkAction, AsyncThunk } from "@reduxjs/toolkit"
import { AppSelector } from "../app/hooks"
import { getGovernorInfo, governorInfo } from "./governor"
import { getMarketInfo, marketInfo } from "./market"
import { getRatesInfo, ratesInfo } from "./rates"
import { getBalances, balancesInfo } from "./balances"
import { ChainID } from "@trustlessfi/addresses"
import { getPoolsMetadata } from "./poolsMetadata"
import { getLiquidityPositions } from "./liquidityPositions"
import { getTDaoPositions, tdaoPositionsInfo } from "./tdaoPositions"
import { getPositions } from "./positions"
import { getProposals, proposalsInfo } from "./proposals"
import { getSystemDebtInfo, systemDebtInfo } from "./systemDebt"
import { getLiquidationsInfo, liquidationsInfo } from "./liquidations"
import { getRewardsInfo, rewardsInfo } from "./rewards"
import { getPricesInfo } from "./prices"
import { getPoolCurrentData } from "./poolCurrentData"
import { getContracts, ContractsInfo } from "./contracts"
import { getTDaoInfo, tdaoInfo } from './tdaoInfo'
import { getTcpAllocationInfo, tcpAllocationInfo } from './tcpAllocation'
import { sliceState } from "./"

import { getGenesisPositions, getGenesisAllocations, GenesisPositions } from "./genesis"
import { Allocations } from "./genesis/api"


interface fetchNodeTypes {
  chainID: ChainID
  governor: string
  tdao: string
  genesisAllocation: string
  trustlessMulticall: string
  protocolDataAggregator: string
  userAddress: string

  balances: balancesInfo
  tdaoInfo: tdaoInfo
  governorInfo: governorInfo
  liquidationsInfo: liquidationsInfo
  rewardsInfo: rewardsInfo
  marketInfo: marketInfo
  ratesInfo: ratesInfo
  sdi: systemDebtInfo
  contracts: ContractsInfo
  tdaoPositions: tdaoPositionsInfo
  tcpAllocationInfo: tcpAllocationInfo,
  genesisPositions: GenesisPositions,
  genesisAllocations: Allocations,
  proposals: proposalsInfo,
}

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
      const fetchedNode = { [fetchNode]: (() => fetchNodesImpl)()[fetchNode](selector, dispatch) }
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

type FetchNode = keyof fetchNodeTypes



export const waitForBalances = getWaitFunction(
  (state: RootState) => state.balances,
  getBalances,
  ['tdao', 'trustlessMulticall', 'userAddress', 'tdao', 'contracts', 'tdaoInfo'],
)

export const waitForTDaoInfo = getWaitFunction(
  (state: RootState) => state.tdaoInfo,
  getTDaoInfo,
  ['tdao', 'trustlessMulticall'],
)

export const waitForGovernorInfo = getWaitFunction(
  (state: RootState) => state.governor,
  getGovernorInfo,
  ['governor']
)

export const waitForLiquidationsInfo = getWaitFunction(
  (state: RootState) => state.liquidations,
  getLiquidationsInfo,
  ['trustlessMulticall', 'contracts']
)

export const waitForRewardsInfo = getWaitFunction(
  (state: RootState) => state.rewards,
  getRewardsInfo,
  ['contracts', 'trustlessMulticall']
)

export const waitForMarketInfo = getWaitFunction(
  (state: RootState) => state.market,
  getMarketInfo,
  ['contracts', 'trustlessMulticall']
)

export const waitForRatesInfo = getWaitFunction(
  (state: RootState) => state.rates,
  getRatesInfo,
  ['contracts', 'trustlessMulticall'],
)

export const waitForSDI = getWaitFunction(
  (state: RootState) => state.systemDebt,
  getSystemDebtInfo,
  ['contracts'],
)
export const waitForContracts = getWaitFunction(
  (state: RootState) => state.contracts,
  getContracts,
  ['governor', 'tdao', 'trustlessMulticall'],
)

export const waitForTDaoPositions = getWaitFunction(
  (state: RootState) => state.tdaoPositions,
  getTDaoPositions,
  ['userAddress', 'tdao', 'contracts', 'trustlessMulticall', 'tdaoInfo']
)

export const waitForTcpAllocationInfo = getWaitFunction(
  (state: RootState) => state.tcpAllocationInfo,
  getTcpAllocationInfo,
  ['userAddress', 'trustlessMulticall', 'contracts']
)

export const waitForGenesisPositions = getWaitFunction(
  (state: RootState) => state.genesis.positions,
  getGenesisPositions,
  ['contracts', 'trustlessMulticall']
)

export const waitForGenesisAllocations = getWaitFunction(
  (state: RootState) => state.genesis.allocations,
  getGenesisAllocations,
  []
)

export const waitForProposals = getWaitFunction(
  (state: RootState) => state.proposals,
  getProposals,
  ['contracts', 'userAddress']
)

const getStateSelector = <T>(selectorFunc: (state: RootState) => T) =>
  (selector: AppSelector, _dispatch: AppDispatch) => selector(selectorFunc)

const fetchNodesImpl: {[key in FetchNode]: (selector: AppSelector, _dispatch: AppDispatch) => fetchNodeTypes[key] | null} = {
  chainID: getStateSelector(state => state.chainID.chainID),
  governor: getStateSelector(state => state.chainID.governor),
  tdao: getStateSelector(state => state.chainID.tdao),
  genesisAllocation: getStateSelector(state => state.chainID.genesisAllocation),
  trustlessMulticall: getStateSelector(state => state.chainID.trustlessMulticall),
  protocolDataAggregator: getStateSelector(state => state.chainID.protocolDataAggregator),
  userAddress: getStateSelector(state => state.wallet.address),

  balances: waitForBalances,
  tdaoInfo: waitForTDaoInfo,
  governorInfo: waitForGovernorInfo,
  liquidationsInfo: waitForLiquidationsInfo,
  rewardsInfo: waitForRewardsInfo,
  marketInfo: waitForMarketInfo,
  ratesInfo: waitForRatesInfo,
  sdi: waitForSDI,
  contracts: waitForContracts,
  tdaoPositions: waitForTDaoPositions,
  tcpAllocationInfo: waitForTcpAllocationInfo,
  genesisPositions: waitForGenesisPositions,
  genesisAllocations: waitForGenesisAllocations,
  proposals: waitForProposals,
}


/*
export const getWaitFor = <
  fetchNode extends keyof typeof fetchNodesImpl,
  Return extends ReturnType<(typeof fetchNodesImpl)[fetchNode]>
>(
  selector: AppSelector,
  dispatch: AppDispatch
) => (
  fetchNode: fetchNode
): Return => fetchNodesImpl[fetchNode](selector, dispatch)
*/


/*
export const getWaitFor = (
  selector: AppSelector,
  dispatch: AppDispatch
) =>
  <
    selectedFetchNodes extends keyof fetchNodeTypes,
    requestedNodes extends Pick<{[key in keyof fetchNodeTypes]: boolean}, selectedFetchNodes>,
  >(fetchNodes: requestedNodes) =>
    Object.fromEntries(
      Object.keys(fetchNodes).map(fetchNode =>
        [fetchNode, fetchNodesImpl[fetchNode as FetchNode](selector, dispatch)]
      )
    ) as {
      [key in keyof requestedNodes]: null | fetchNodeTypes[key]
    }
*/
