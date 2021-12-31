import { useHistory } from 'react-router-dom'
import { useAppDispatch, useAppSelector as selector } from '../../app/hooks'
import { waitForTDaoPositions, waitForTcpAllocationInfo } from '../../slices/waitFor'
import TDaoPositionDisplay from '../library/TDaoPositionDisplay'
import CreateTransactionButton from '../library/CreateTransactionButton'
import RelativeLoading from '../library/RelativeLoading'
import { TransactionType } from '../../slices/transactions'
import { Button } from 'carbon-components-react'
import { numDisplay, sum } from '../../utils'

const ExistingTDaoPositions = () => {
  const dispatch = useAppDispatch()
  const history = useHistory()

  const positions = waitForTDaoPositions(selector, dispatch)
  const tcpAllocationInfo = waitForTcpAllocationInfo(selector, dispatch)
  const tdao = selector((state) => state.chainID.tdao)

  const positionsIDsWithRewards: string[] = []
  const totalRewards = positions === null ? 0 : Object.values(positions).map(p => p.approximateRewards).reduce(sum)

  const positionDisplay =
    positions === null
    ? null
    : Object.values(positions).map((position, index) => {
        if (position.approximateRewards > 0) positionsIDsWithRewards.push(position.nftTokenID)
        return (
          <TDaoPositionDisplay
            key={"positionDisplay" + index}
            position={position}
            onClick={(positionID: string) => history.push(`/positions/${positionID}`)}
          />
        )
      })

  const tokensToBeAllocated =
    tcpAllocationInfo === null
    ? null
    : tcpAllocationInfo.totalAllocation - tcpAllocationInfo.tokensAllocated

  return (
    <>
      <div style={{marginBottom: 16, position: 'relative'}}>
        <RelativeLoading show={positions === null || tcpAllocationInfo === null || tdao === null} />
        <CreateTransactionButton
          style={{marginRight: 16}}
          disabled={tcpAllocationInfo === null || tdao == null || positionsIDsWithRewards.length === 0}
          title={`Claim ${numDisplay(totalRewards)} TDao`}
          txArgs={{
            type: TransactionType.ClaimAllTDaoPositionRewards,
            tdao: tdao === null ? '' : tdao,
            positionIDs: positionsIDsWithRewards,
          }}
        />
        <Button
          disabled={tokensToBeAllocated === null || tokensToBeAllocated === 0}
          onClick={() => history.push(`/positions/allocate/lock/tcp`)}
          style={{marginBottom: 16}}>
          Earn TDao with {tokensToBeAllocated === null ? '-' : numDisplay(tokensToBeAllocated)} TCP
        </Button>
      </div>
      {positionDisplay}
    </>
  )
}

export default ExistingTDaoPositions
