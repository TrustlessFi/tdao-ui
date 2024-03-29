import { Tag, TagTypeName } from 'carbon-components-react'
import { useAppSelector as selector } from '../../app/hooks'
import { ChainID, chainIDToName } from '@trustlessfi/addresses'
import { CSSProperties } from 'react'
import { makeRPCRequest, first, RpcMethod, numberToHex } from '../../utils'

const chainIDColor: {[key in ChainID]: TagTypeName} = {
  [ChainID.Hardhat]: 'magenta',
  [ChainID.Rinkeby]: 'teal',
}

const NetworkIndicator = ({
  style,
}: {
  style?: CSSProperties
}) => {
  const chainID = selector(state => state.chainID)

  // smallest number chain ID
  const correctChainID =
    first((Object.values(ChainID).filter(id => Number.isInteger(id)) as number[]).sort((a, b) => a - b))

  const switchNetwork = async () => {
    await makeRPCRequest({
      method: RpcMethod.SwitchChain,
      chainId: numberToHex(correctChainID as number),
    })
  }

  return (
    chainID === null
    ? <Tag type="red" style={style} onClick={switchNetwork}>{`Switch to ${chainIDToName(correctChainID)}`}</Tag>
    : <Tag type={chainIDColor[chainID]} style={style}>{chainIDToName(chainID)}</Tag>
  )
}

export default NetworkIndicator
