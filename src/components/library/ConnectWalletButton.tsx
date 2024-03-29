import MetaMaskOnboarding from "@metamask/onboarding"
import { useAppDispatch, useAppSelector as selector } from '../../app/hooks'
import { connectWallet } from '../library/WalletConnection'
import { CSSProperties } from 'react'
import { Button, ButtonKind, ButtonSize } from 'carbon-components-react'
import waitFor from '../../slices/waitFor'

const ConnectWalletButton = ({
  size,
  style,
  kind,
}: {
  size?: ButtonSize
  style?: CSSProperties
  kind?: ButtonKind
}) => {
  const dispatch = useAppDispatch()

  const {
    wallet,
    userAddress,
  } = waitFor([
    'wallet',
    'userAddress',
  ], selector, dispatch)

  const text = wallet.connecting
    ? 'Waiting for User in Metamask...'
    : (userAddress !== null
        ? 'Connected'
        : 'Connect a Wallet')

  const onClick = async () => {
    if (MetaMaskOnboarding.isMetaMaskInstalled()) {
      await connectWallet(dispatch)
    } else {
      // Set onboarding state?
      (new MetaMaskOnboarding()).startOnboarding()
    }
  }

  return (
    <Button
      onClick={onClick}
      disabled={wallet.connecting}
      size={size}
      kind={kind}
      style={style}>
      {text}
    </Button>
  )
}

export default ConnectWalletButton
