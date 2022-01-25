import { ChainID } from '@trustlessfi/addresses'
import { NonNullValues, sliceState } from './'

import { balances } from './balances'
import { contractsInfo } from './contracts'
import { currentChainInfo } from './currentChainInfo'
import { governorInfo } from './governor'
import { rootContracts } from './rootContracts'
import { notificationState } from './notifications'
import { transactionState } from './transactions'
import { wallet } from './wallet'
import { genesisAllocationsInfo } from './genesisAllocations'
import { claimedAllocationRounds } from './claimedAllocationRounds'
import { genesisPositionsInfo } from './genesisPositions'
import { tcpAllocationInfo } from './tcpAllocation'
import { proposalsInfo } from './proposals/'
import { proposalsVoterInfo } from './proposalsVoterInfo'
import { tdaoInfo } from './tdaoInfo'
import { tdaoPositionsInfo } from './tdaoPositions'
import { voteDelegationInfo } from './voteDelegation'


export type canBeNull<T> = T | null

export interface RootState {
  chainID: canBeNull<ChainID>
  rootContracts: canBeNull<rootContracts>
  userAddress: canBeNull<string>
  notifications: notificationState
  transactions: transactionState
  wallet: wallet

  balances: sliceState<balances>
  contracts: sliceState<contractsInfo>
  currentChainInfo: sliceState<currentChainInfo>
  governor: sliceState<governorInfo>
  genesisAllocations: sliceState<genesisAllocationsInfo>
  claimedAllocationRounds: sliceState<claimedAllocationRounds>,
  genesisPositions: sliceState<genesisPositionsInfo>,
  tcpAllocation: sliceState<tcpAllocationInfo>,
  tcpProposals: sliceState<proposalsInfo>,
  tcpProposalsVoterInfo:sliceState<proposalsVoterInfo>,
  tdao: sliceState<tdaoInfo>,
  tdaoPositions: sliceState<tdaoPositionsInfo>,
  voteDelegation: sliceState<voteDelegationInfo>,
}

export type FetchNode = keyof RootState

export type sliceStateValues = {
  [node in FetchNode]:
    RootState[node] extends sliceState<unknown>
    ? RootState[node]['value']
    : RootState[node]
}

export type thunkDependencies<R extends FetchNode> = {[node in keyof Pick<RootState, R>]: sliceStateValues[node]}

export type thunkArgs<R extends FetchNode> = NonNullValues<thunkDependencies<R>>

export const getThunkDependencies = <R extends FetchNode>(val: R[]) =>
  Object.fromEntries(val.map(key => [key, null])) as thunkDependencies<R>
