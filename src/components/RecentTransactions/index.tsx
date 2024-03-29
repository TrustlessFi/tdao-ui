import { Button, InlineLoading, InlineLoadingStatus } from 'carbon-components-react'
import AppTile from '../library/AppTile'
import { useAppDispatch, useAppSelector as selector } from '../../app/hooks'
import { clearUserTransactions, TransactionStatus, getTxLongName, getTokenAssociatedWithTx } from '../../slices/transactions'
import Center from '../library/Center'
import SimpleTable, { TableHeaderOnly } from '../library/SimpleTable'
import ConnectWalletButton from '../library/ConnectWalletButton'
import { getSortedUserTxs, UserTxSortOption } from '../library'
import AddTokenToWalletButton from '../library/AddTokenToWalletButton'
import { getDateTimeStringMS } from '../../utils'
import { getEtherscanTxLink, getEtherscanAddressLink } from '../library/ExplorerLink'
import waitFor from '../../slices/waitFor'

const txStatusToLoadingStatus: {[key in TransactionStatus]: InlineLoadingStatus} = {
  [TransactionStatus.Pending]: 'active',
  [TransactionStatus.Failure]: 'error',
  [TransactionStatus.Success]: 'finished',
}

const RecentTransactions = () => {
  const dispatch = useAppDispatch()

  const {
    userAddress,
    transactions,
    chainID,
  } = waitFor([
    'userAddress',
    'transactions',
    'chainID',
  ], selector, dispatch)


  const txs = getSortedUserTxs(chainID, userAddress, transactions, UserTxSortOption.NONCE_DESCENDING)

  const table =
    userAddress === null || txs.length === 0
    ? (
        <div style={{position: 'relative'}}>
          <TableHeaderOnly headers={['Nonce', 'Add Token to Wallet', 'Transaction', 'Start Time', 'Status',]} />
          <Center>
            <div style={{margin: 32}}>
              {userAddress === null
                ? <ConnectWalletButton />
                : <Button onClick={() => window.open(getEtherscanAddressLink(userAddress, chainID!), '_blank')} size='sm'>
                    View History on Etherscan
                  </Button>
              }
            </div>
          </Center>
        </div>
      )
    : <SimpleTable rows={
        txs.map(tx => ({
        key: tx.hash,
        data: {
          'Nonce': tx.nonce,
          'Add Token to Wallet': <AddTokenToWalletButton walletToken={getTokenAssociatedWithTx(tx.type)} />,
          'Transaction': getTxLongName(tx.args),
          'Start Time': getDateTimeStringMS(tx.startTimeMS),
          'Status': <InlineLoading status={txStatusToLoadingStatus[tx.status]} />,
        },
        onClick: () => window.open(getEtherscanTxLink(tx.hash, chainID!), '_blank'),
      }))
    } />

  const clearTransactionsButton =
    userAddress === null || txs.length === 0
    ? null
    : <Button
        small
        kind="tertiary"
        onClick={() => dispatch(clearUserTransactions(userAddress))}>
        Clear all
      </Button>

  const tableTitle = 'Recent Transactions (' + txs.length + ')'

  return (
    <AppTile title={tableTitle} rightElement={clearTransactionsButton}>
      {table}
    </AppTile>
  )
}

export default RecentTransactions
