import { TransactionInfo, transactionState } from '../../slices/transactions'
import { AppDispatch } from '../../app/store'
import { clearBalances } from '../../slices/balances'
import { clearTDaoPositions } from '../../slices/tdaoPositions'
import { clearTcpAllocationInfo } from '../../slices/tcpAllocation'
import { clearVoteDelegation } from '../../slices/voteDelegation'
import { clearTcpProposalsVoterInfo } from '../../slices/proposalsVoterInfo/tcpProposals'
import { ChainID } from '@trustlessfi/addresses'

export enum UserTxSortOption {
  NONCE_ASCENDING,
  NONCE_DESCENDING,
}

export const getSortedUserTxs = (
  chainID: ChainID | null,
  userAddress: string | null,
  txs: transactionState | null,
  sortOption: UserTxSortOption = UserTxSortOption.NONCE_ASCENDING,
): TransactionInfo[] => {
  if (chainID === null) return []
  if (userAddress === null) return []
  if (txs === null) return []

  const resultTxs =  Object.values(txs)
    .filter(tx => tx.userAddress === userAddress)
    .filter(tx => tx.chainID === chainID)

  switch(sortOption) {
    case UserTxSortOption.NONCE_ASCENDING:
      return resultTxs.sort((a, b) => a.nonce - b.nonce)

    case UserTxSortOption.NONCE_DESCENDING:
      return resultTxs.sort((a, b) => b.nonce - a.nonce)
  }
}

export const getOpacityTransition = (durationSeconds: number) => {
  const transition = 'opacity ' + durationSeconds + 's ease-in-out'

  return {
      WebkitTransition: transition,
      MozTransition: transition,
      msTransition: transition,
      OTransition: transition,
      transition,
  }
}

export const clearUserData = (dispatch: AppDispatch) => {
  dispatch(clearBalances())
  dispatch(clearTDaoPositions())
  dispatch(clearTcpAllocationInfo())
  dispatch(clearVoteDelegation())
  dispatch(clearTcpProposalsVoterInfo())
}
