import { AppDispatch, store, RootState } from "../app/store"
import { AsyncThunk } from "@reduxjs/toolkit"
import { AppSelector } from "../app/hooks"
import { getGovernorInfo, governorInfo } from "./governor"
import { getBalances, balancesInfo } from "./balances"
import { ChainID } from "@trustlessfi/addresses"
import { getTDaoPositions, tdaoPositionsInfo } from './tdaoPositions'
import { proposalsInfo } from './proposals/'
import { getTcpProposals } from './proposals/tcpProposals'
import { getTcpProposalsVoterInfo } from './proposalsVoterInfo/tcpProposals'
import { getContracts, contractsInfo } from "./contracts"
import { getTDaoInfo, tdaoInfo } from './tdaoInfo'
import { getTcpAllocationInfo, tcpAllocationInfo } from './tcpAllocation'
import { getCurrentChainInfo } from './currentChainInfo'
import { sliceState } from "./"

import { getGenesisPositions, genesisPositionsInfo } from "./genesisPositions"
import { getGenesisAllocations, genesisAllocationsInfo } from "./genesisAllocations"
import { getClaimedAllocationRounds } from "./claimedAllocationRounds"
import { getVoteDelegation } from './voteDelegation'


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
  contracts: contractsInfo
  tdaoPositions: tdaoPositionsInfo
  tcpAllocationInfo: tcpAllocationInfo,
  genesisAllocations: genesisAllocationsInfo,
  genesisPositions: genesisPositionsInfo,
  tcpProposals: proposalsInfo,
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

    const inputArgs = Object.fromEntries(dependencies.map(fetchNode =>
      [fetchNode, (() => fetchNodesImpl)()[fetchNode](selector, dispatch)]
    ))

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


export const waitForCurrentChainInfo = getWaitFunction(
  (state: RootState) => state.currentChainInfo,
  getCurrentChainInfo,
  ['trustlessMulticall'],
)

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

export const waitForTcpProposals = getWaitFunction(
  (state: RootState) => state.tcpProposals,
  getTcpProposals,
  ['contracts', 'trustlessMulticall']
)

export const waitForTcpProposalsVoterInfo = getWaitFunction(
  (state: RootState) => state.tcpProposalsVoterInfo,
  getTcpProposalsVoterInfo,
  ['contracts', 'trustlessMulticall', 'userAddress']
)

export const waitForGenesisPositions = getWaitFunction(
  (state: RootState) => state.genesisPositions,
  getGenesisPositions,
  ['contracts', 'trustlessMulticall']
)

export const waitForGenesisAllocations = getWaitFunction(
  (state: RootState) => state.genesisAllocations,
  getGenesisAllocations,
  ['chainID']
)

export const waitForClaimedAllocationRounds = getWaitFunction(
  (state: RootState) => state.claimedAllocationRounds,
  getClaimedAllocationRounds,
  ['genesisAllocations', 'trustlessMulticall', 'userAddress', 'genesisAllocation']
)

export const waitForVoteDelegation = getWaitFunction(
  (state: RootState) => state.voteDelegation,
  getVoteDelegation,
  ['userAddress', 'trustlessMulticall', 'contracts', 'tdaoInfo'],
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
  contracts: waitForContracts,
  tdaoPositions: waitForTDaoPositions,
  tcpAllocationInfo: waitForTcpAllocationInfo,
  genesisPositions: waitForGenesisPositions,
  genesisAllocations: waitForGenesisAllocations,
  tcpProposals: waitForTcpProposals,
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
