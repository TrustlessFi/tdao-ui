import { configureStore, ThunkAction, Action } from '@reduxjs/toolkit'

import balancesReducer from '../slices/balances'
import chainIDReducer from '../slices/chainID'
import claimedAllocationRoundsReducer from '../slices/claimedAllocationRounds'
import contractsReducer from '../slices/contracts'
import currentChainInfoReducer from '../slices/currentChainInfo'
import genesisAllocationsReducer from '../slices/genesisAllocations'
import genesisPositionsReducer from '../slices/genesisPositions'
import governorReducer from '../slices/governor'
import notificationsReducer from '../slices/notifications'
import tcpProposalsReducer from '../slices/proposals/tcpProposals'
import tcpProposalsVoterInfoReducer from '../slices/proposalsVoterInfo/tcpProposals'
import tcpAllocationInfoReducer from '../slices/tcpAllocation'
import tdaoInfoReducer from '../slices/tdaoInfo'
import tdaoPositionsReducer from '../slices/tdaoPositions'
import transactionsReducer from '../slices/transactions'
import voteDelegationReducer from '../slices/voteDelegation'
import walletReducer from '../slices/wallet'

export const store = configureStore({
  reducer: {
    balances: balancesReducer,
    chainID: chainIDReducer,
    claimedAllocationRounds: claimedAllocationRoundsReducer,
    contracts: contractsReducer,
    currentChainInfo: currentChainInfoReducer,
    genesisAllocations: genesisAllocationsReducer,
    genesisPositions: genesisPositionsReducer,
    governor: governorReducer,
    notifications: notificationsReducer,
    tcpProposals: tcpProposalsReducer,
    tcpProposalsVoterInfo: tcpProposalsVoterInfoReducer,
    tcpAllocationInfo: tcpAllocationInfoReducer,
    tdaoInfo: tdaoInfoReducer,
    tdaoPositions: tdaoPositionsReducer,
    transactions: transactionsReducer,
    voteDelegation: voteDelegationReducer,
    wallet: walletReducer,
  }
})

export type AppDispatch = typeof store.dispatch
export type RootState = ReturnType<typeof store.getState>
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>
