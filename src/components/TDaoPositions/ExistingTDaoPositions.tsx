import { Button } from 'carbon-components-react'
import { Row, Col } from 'react-flexbox-grid'
import { useHistory } from 'react-router-dom'
import AppTile from '../library/AppTile'
import Center from '../library/Center'
import { useAppDispatch, useAppSelector as selector } from '../../app/hooks'
import { editorOpened } from '../../slices/positionsEditor'
import { waitForTDaoPositions } from '../../slices/waitFor'
import TDaoPositionDisplay from '../library/TDaoPositionDisplay'
import CreateTransactionButton from '../utils/CreateTransactionButton'
import { TransactionType } from '../../slices/transactions'
import { waitForContracts } from '../../slices/waitFor'
import { first } from '../../utils'

const ExistingTDaoPositions = () => {
  const dispatch = useAppDispatch()
  const history = useHistory()

  // const userAddress = selector((state) => state.wallet.address)

  // const tdao = selector((state) => state.chainID.tdao)
  // const mc = selector((state) => state.chainID.trustlessMulticall)
  // const contracts = waitForContracts(selector, dispatch)
      // return { userAddress:  }
  const positions = waitForTDaoPositions(selector, dispatch)
  const tdao = selector((state) => state.chainID.tdao)
  // const contracts = waitForContracts(selector, dispatch)

  if (positions === null) return <>loading existing positions</>
  else {
    if (Object.values(positions).length === 0) return <>No Positions</>
    const positionsIDsWithRewards: string[] = []

    const positionDisplay =
      Object.values(positions).map((position, index) => {
        if (position.approximateRewards > 0) positionsIDsWithRewards.push(position.nftTokenID)
        return (
          <TDaoPositionDisplay
            key={"positionDisplay" + index}
            position={position}
            onClick={(positionID: string) => history.push(`/positions/${positionID}`)}
          />
        )
      })

    return (
      <>
        <CreateTransactionButton
          style={{marginBottom: 16}}
          disabled={positionsIDsWithRewards.length === 0 || tdao == null}
          title="Claim all TDao Rewards"
          txArgs={{
            type: TransactionType.ClaimAllTDaoPositionRewards,
            tdao: tdao === null ? '' : tdao,
            positionIDs: positionsIDsWithRewards,
          }}
        />
        {positionDisplay}
      </>
    )

  }



  /*
  const positionsIDsWithRewards =
    positions === null
    ? []
    : Object.values(positions).filter(position => position.approximateRewards !== 0).map(position => position.id)

  const rightElement =
    <>
      <CreateTransactionButton
        small
        style={{marginRight: 8}}
        title="Claim All Rewards"
        disabled={positionsIDsWithRewards.length === 0 || contracts === null}
        showDisabledInsteadOfConnectWallet={true}
        txArgs={{
          type: TransactionType.ClaimAllPositionRewards,
          positionIDs: positionsIDsWithRewards,
          Market: contracts === null ? '' : contracts.Market,
        }}
      />
      <Button
        size="small"
        onClick={() => {
          dispatch(editorOpened({
            positionID: 0,
            creating: true,
          }))
          history.push('/positions/new')
        }}>
        New Position
      </Button>
    </>

  return (
    <AppTile title="Positions" rightElement={rightElement}>
      <ExistingPositionsTable />
    </AppTile>
  )
  */
}

export default ExistingTDaoPositions
