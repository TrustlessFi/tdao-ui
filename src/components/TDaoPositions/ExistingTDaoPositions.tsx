import { useHistory } from 'react-router-dom'
import { useAppDispatch, useAppSelector as selector } from '../../app/hooks'
import waitFor from '../../slices/waitFor'
import TDaoPositionDisplay from '../library/TDaoPositionDisplay'
import CreateTransactionButton from '../library/CreateTransactionButton'
import RelativeLoading from '../library/RelativeLoading'
import SpacedList from '../library/SpacedList'
import { TransactionType } from '../../slices/transactions'
import { Button } from 'carbon-components-react'
import { numDisplay, sum } from '../../utils'

const ExistingTDaoPositions = () => {
  const dispatch = useAppDispatch()
  const history = useHistory()

  const {
    balances,
    contracts,
    tdaoPositions,
    tcpAllocation,
    rootContracts,
    userAddress,
  } = waitFor([
    'balances',
    'contracts',
    'tdaoPositions',
    'tcpAllocation',
    'rootContracts',
    'userAddress',
  ], selector, dispatch)

  const tcpBalance =
    balances === null || contracts === null
    ? null
    : balances.tokens[contracts.Tcp].userBalance

  const positionsIDsWithRewards: string[] = []
  const totalRewards =
    tdaoPositions === null || Object.values(tdaoPositions).length === 0
    ? 0
    : Object.values(tdaoPositions).map(p => p.approximateRewards).reduce(sum)

  const positionDisplay =
    tdaoPositions === null
    ? null
    : Object.values(tdaoPositions).map((position, index) => {
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
    tcpAllocation === null
    ? null
    : tcpAllocation.totalAllocation - tcpAllocation.tokensAllocated
  const tokensToBeAllocatedDisplay = tokensToBeAllocated === null ? '-' : numDisplay(tokensToBeAllocated)

  const tcpWalletBalanceDisplay =
    contracts === null || balances === null ? '-' : numDisplay(balances.tokens[contracts.Tcp].userBalance)

  return (
    <SpacedList spacing={16} >
      <div style={{position: 'relative'}}>
        <RelativeLoading show={(tokensToBeAllocated === null || tcpBalance === null) && userAddress !== null} />
        <SpacedList row spacing={8}>
          <Button
            disabled={tokensToBeAllocated === null || tokensToBeAllocated === 0}
            onClick={() => history.push(`/positions/allocate/lock/tcp`)}
            style={{marginBottom: 16}}>
            Stake {tokensToBeAllocatedDisplay} aTcp
          </Button>
          <Button
            disabled={tcpBalance === null || tcpBalance === 0}
            onClick={() => history.push(`/positions/create/tcp`)}
            style={{marginBottom: 16}}>
            Stake {tcpWalletBalanceDisplay} Tcp From Wallet
          </Button>
        </SpacedList>
      </div>
      {positionDisplay}
      <CreateTransactionButton
        disabled={tcpAllocation === null || rootContracts == null || positionsIDsWithRewards.length === 0}
        title={`Claim ${numDisplay(totalRewards)} TDao`}
        txArgs={{
          type: TransactionType.ClaimAllTDaoPositionRewards,
          tdao: rootContracts === null ? '' : rootContracts.tdao,
          positionIDs: positionsIDsWithRewards,
        }}
      />
    </SpacedList>
  )
}

export default ExistingTDaoPositions
