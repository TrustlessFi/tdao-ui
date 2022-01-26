import { SyntheticEvent } from 'react'
import { useAppDispatch, useAppSelector as selector } from '../../app/hooks'
import { Button, ButtonKind, ButtonSize } from 'carbon-components-react'
import waitFor from '../../slices/waitFor'
import { contractsInfo } from '../../slices/contracts'
import { CSSProperties } from 'react';
import { WalletToken } from '../../slices/transactions'
import { addTokenToWallet, convertSVGStringtoURI } from '../../utils'
import TrustlessLogos from '../../utils/trustless_logos'

const AddTokenToWalletButton = ({
  walletToken,
  // title,
  disabled,
  // kind,
  size,
  style,
}: {
  walletToken: WalletToken | null
  title?: string
  disabled?: boolean
  kind?: ButtonKind
  size?: ButtonSize
  style?: CSSProperties
}) => {
  const dispatch = useAppDispatch()

  const {
    contracts,
    chainID,
    userAddress,
  } = waitFor([
    'contracts',
    'chainID',
    'userAddress',
  ], selector, dispatch)

  if (walletToken === null) return <></>

  const getTokenAddress = (contractsInfo: contractsInfo) => {
    switch(walletToken) {
      case WalletToken.TCP:
        return contractsInfo.Tcp
      case WalletToken.TDao:
        return contractsInfo.TDaoToken
    }
  }

  const getTokenIcon = () => {
    switch(walletToken) {
      case WalletToken.TCP:
        return convertSVGStringtoURI(TrustlessLogos.black.tcp)
      case WalletToken.TDao:
        return convertSVGStringtoURI(TrustlessLogos.black.tdao)
    }
  }

  const onClick = async (event: SyntheticEvent) => {
    event.preventDefault()
    event.stopPropagation()
    if (contracts === null || chainID === null || userAddress === null) return
    await addTokenToWallet({
      address: getTokenAddress(contracts),
      symbol: walletToken,
      decimals: 18,
      image: getTokenIcon(),
    })
  }

  /*
  const alreadyAdded =
    chainID !== null &&
    userAddress !== null &&
    tokensAddedToWallet[walletToken][chainID] !== undefined &&
    tokensAddedToWallet[walletToken][chainID][userAddress] === true
  */

  return (
    <Button
      kind='ghost'
      size={size}
      style={style}
      onClick={onClick}
      disabled={disabled ||
        chainID === null ||
        userAddress === null
      }>
      <img src={getTokenIcon()} width={32} alt={`token ${walletToken === null ? '-' : walletToken}`}/>
      </Button>
  )
}

AddTokenToWalletButton.defaultProps = {
  size: 'sm'
}

export default AddTokenToWalletButton
