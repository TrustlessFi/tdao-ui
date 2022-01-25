import { useEffect } from "react"
import { useHistory } from 'react-router-dom'
import MetaMaskOnboarding from "@metamask/onboarding"
import { Button, InlineLoading } from 'carbon-components-react'
import { useAppDispatch, useAppSelector as selector } from '../../app/hooks'
import { store } from '../../app/store'
import { chainIDFound } from '../../slices/chainID'
import { abbreviateAddress } from '../../utils'
import { getSortedUserTxs } from '../library'
import ConnectWalletButton from '../library/ConnectWalletButton'
import { getWalletConnectedFunction } from '../library/WalletConnection'
import { TransactionStatus } from '../../slices/transactions'
import { clearEphemeralStorage } from '../library/LocalStorageManager'
import { getEtherscanAddressLink } from '../library/ExplorerLink';
import waitFor from '../../slices/waitFor'

const Wallet = () => {
  const dispatch = useAppDispatch()
  const history = useHistory()

  const {
    userAddress,
    chainID,
    transactions,
  } = waitFor([
    'userAddress',
    'chainID',
    'transactions',
  ], selector, dispatch)

  const walletConnected = getWalletConnectedFunction(dispatch)

  const chainChanged = (chainID: number | string) => {
    const getCurrentChainID = () => store.getState().chainID

    if (typeof chainID === 'string') chainID = parseInt(chainID)

    const currentChainID = getCurrentChainID()

    if (currentChainID !== chainID) {
      if (currentChainID === null) {
        dispatch(chainIDFound(chainID))
      } else {
        clearEphemeralStorage()
        window.location.reload()
      }
    }
  }

  useEffect(() => {
    const { ethereum } = window
    if (!ethereum) return

    ethereum.request({ method: 'eth_chainId' }).then(chainChanged)

    ethereum.on('chainChanged', chainChanged)
    // TODO remove any
    ethereum.on('connect', (provider: any) => chainChanged(provider.chainId))
    ethereum.on('accountsChanged', walletConnected)

    ethereum.autoRefreshOnNetworkChange = false

    if (MetaMaskOnboarding.isMetaMaskInstalled()) {
      ethereum.request({ method: 'eth_accounts' }).then(walletConnected)
    }
  })

  const countPendingTxs =
    getSortedUserTxs(chainID, userAddress, transactions)
      .filter(tx => tx.status === TransactionStatus.Pending)
      .length

  return (
    userAddress !== null && chainID !== null
      ? (countPendingTxs > 0
          ? <Button
              size="small"
              onClick={() => history.push('/transactions/')}
              style={{paddingLeft: 12, paddingRight: 24, paddingBottom: 0, paddingTop: 0}}>
              <div style={{whiteSpace: 'nowrap', paddingRight: 12}}>
                {countPendingTxs} Pending
              </div>
              <InlineLoading />
            </Button>
          : <Button
              kind="secondary"
              size="small"
              onClick={() => window.open(getEtherscanAddressLink(userAddress, chainID), '_blank')}>
              {abbreviateAddress(userAddress)}
            </Button>
        )
      : <ConnectWalletButton size="sm" />
  )
}

export default Wallet
