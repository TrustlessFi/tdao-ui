import { useHistory } from 'react-router-dom'
import { useAppDispatch, useAppSelector as selector } from '../../app/hooks'
import {
  waitForTDaoPositions,
  waitForTcpAllocationInfo,
  waitForBalances,
  waitForContracts,
} from '../../slices/waitFor'
import TDaoPositionDisplay from '../library/TDaoPositionDisplay'
import CreateTransactionButton from '../library/CreateTransactionButton'
import RelativeLoading from '../library/RelativeLoading'
import SpacedList from '../library/SpacedList'
import { TransactionType } from '../../slices/transactions'
import { Button } from 'carbon-components-react'
import { numDisplay, sum } from '../../utils'


import { Row, Col } from 'react-flexbox-grid'
import Text from "../library/Text"
import Center from '../library/Center'
import AppTile from '../library/AppTile'
import LargeText from '../library/LargeText'
import ConnectWalletButton from '../library/ConnectWalletButton'

const ExistingTDaoPositions = () => {
  const dispatch = useAppDispatch()
  const history = useHistory()

  const balances = waitForBalances(selector, dispatch)
  const contracts = waitForContracts(selector, dispatch)
  const positions = waitForTDaoPositions(selector, dispatch)
  const tcpAllocationInfo = waitForTcpAllocationInfo(selector, dispatch)
  const tdao = selector(state => state.chainID.tdao)
  const userAddress = selector(state => state.wallet.address)

  console.log({balances, contracts, positions, tcpAllocationInfo, tdao})

  const dataNull =
    balances === null ||
    contracts === null ||
    positions === null ||
    tcpAllocationInfo === null ||
    tdao === null ||
    userAddress === null

  const tcpBalance =
    balances === null || contracts === null
    ? 0
    : balances.tokens[contracts.Tcp].userBalance

  const positionsIDsWithRewards: string[] = []
  const totalRewards =
    positions === null || Object.values(positions).length === 0
    ? 0
    : Object.values(positions).map(p => p.approximateRewards).reduce(sum)

  const positionDisplay =
    positions === null
    ? null
    : Object.values(positions).map((position, index) => {
        if (position.approximateRewards > 0) positionsIDsWithRewards.push(position.nftTokenID)
        return (
          <TDaoPositionDisplay
            key={`positionDisplay ${index}`}
            position={position}
            onClick={(positionID: string) => history.push(`/positions/${positionID}`)}
          />
        )
      })

  const tokensToBeAllocated =
    tcpAllocationInfo === null
    ? null
    : tcpAllocationInfo.totalAllocation - tcpAllocationInfo.tokensAllocated
  const tokensToBeAllocatedDisplay = tokensToBeAllocated === null ? '-' : numDisplay(tokensToBeAllocated)

  const tcpWalletBalanceDisplay =
    contracts === null || balances === null ? '-' : numDisplay(balances.tokens[contracts.Tcp].userBalance)

  const tdaoWalletBalanceDisplay =
    contracts === null || balances === null ? '-' : numDisplay(balances.tokens[contracts.TDaoToken].userBalance)

  return (
    <SpacedList spacing={16} >
      <div style={{position: 'relative'}}>
        <RelativeLoading show={dataNull} />
        <SpacedList row spacing={8}>
          <Button
            disabled={tokensToBeAllocated === null || tokensToBeAllocated === 0}
            onClick={() => history.push(`/positions/allocate/lock/tcp`)}
            style={{marginBottom: 16}}>
            Stake {tokensToBeAllocatedDisplay} Tcp Rewards
          </Button>
          <Button
            disabled={tcpBalance === 0}
            onClick={() => history.push(`/positions/create/tcp`)}
            style={{marginBottom: 16}}>
            Stake {tcpWalletBalanceDisplay} Tcp From Wallet
          </Button>
        </SpacedList>
      </div>
      {positionDisplay}
      <CreateTransactionButton
        disabled={tcpAllocationInfo === null || tdao == null || positionsIDsWithRewards.length === 0}
        title={`Claim ${numDisplay(totalRewards)} TDao`}
        txArgs={{
          type: TransactionType.ClaimAllTDaoPositionRewards,
          tdao: tdao === null ? '' : tdao,
          positionIDs: positionsIDsWithRewards,
        }}
      />
    </SpacedList>
  )
}

export default ExistingTDaoPositions
