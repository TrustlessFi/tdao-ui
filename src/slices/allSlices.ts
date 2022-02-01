import chainIDSlice from './chainID'
import userAddressSlice from './userAddress'
import balancesSlice from './balances'
import contractsSlice from './contracts'
import currentChainInfoSlice from './currentChainInfo'
import governorSlice from './governor'

import genesisAllocationsSlice from './genesisAllocations'
import genesisPositionsSlice from './genesisPositions'
import claimedAllocationRoundsSlice from './claimedAllocationRounds'
import rootContractsSlice from './rootContracts'
import notificationsSlice from './notifications'
import selectedTDaoPositionSlice from './selectedTDaoPosition'
import transactionsSlice from './transactions'
import tcpAllocationSlice from './tcpAllocation'
import tcpProposalsSlice from './proposals/tcpProposals'
import tcpProposalsVoterInfoSlice from './proposalsVoterInfo/tcpProposals'
import tdaoInfoSlice from './tdaoInfo'
import tdaoPositionsSlice from './tdaoPositions'
import voteDelegationSlice from './voteDelegation'

import walletSlice from './wallet'
import { RootState }  from './fetchNodes'

const allSlicesRaw = {
  chainID: chainIDSlice,
  rootContracts: rootContractsSlice,
  userAddress: userAddressSlice,
  notifications: notificationsSlice,
  selectedTDaoPosition: selectedTDaoPositionSlice,
  transactions: transactionsSlice,
  wallet: walletSlice,

  balances: balancesSlice,
  claimedAllocationRounds: claimedAllocationRoundsSlice,
  contracts: contractsSlice,
  currentChainInfo: currentChainInfoSlice,
  genesisAllocations: genesisAllocationsSlice,
  genesisPositions: genesisPositionsSlice,
  governor: governorSlice,
  tcpAllocation: tcpAllocationSlice,
  tcpProposals: tcpProposalsSlice,
  tcpProposalsVoterInfo: tcpProposalsVoterInfoSlice,
  tdao: tdaoInfoSlice,
  tdaoPositions: tdaoPositionsSlice,
  voteDelegation: voteDelegationSlice,
}

const allSlices: {[key in keyof RootState]: (typeof allSlicesRaw)[key]} = allSlicesRaw

export default allSlices
