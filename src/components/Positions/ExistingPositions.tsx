import { Button } from 'carbon-components-react'
import { useHistory } from 'react-router-dom'
import AppTile from '../library/AppTile'
import { useAppDispatch, useAppSelector as selector } from '../../app/hooks'
import { editorOpened } from '../../slices/positionsEditor'
import { waitForTdaoPositions } from '../../slices/waitFor'
import CreateTransactionButton from '../utils/CreateTransactionButton'
import { TransactionType } from '../../slices/transactions'
import { waitForContracts } from '../../slices/waitFor'
import { first } from '../../utils'

const ExistingPositions = () => {
  const dispatch = useAppDispatch()
  const history = useHistory()

  // const userAddress = selector((state) => state.wallet.address)

  // const tdao = selector((state) => state.chainID.tdao)
  // const mc = selector((state) => state.chainID.trustlessMulticall)
  // const contracts = waitForContracts(selector, dispatch)
      // return { userAddress:  }
  const positions = waitForTdaoPositions(selector, dispatch)
  console.log({positions})
  // const contracts = waitForContracts(selector, dispatch)

  // console.log({positions});
  if (positions === null) return <>loading existing positions</>
  else {
    if (Object.values(positions).length === 0) return <>No Positions</>
    return (
      <>
        {Object.values(positions).map(position =>
          <img
            src={`data:image/svg+xml;base64,${Buffer.from(position.svg, 'binary').toString('base64')}`}
            width={500}
            style={{paddingRight: 16, paddingBottom: 16}}
            alt={`TDao Position ID ${position.nftTokenID}`}
            onClick={() => alert('positionID ' + position.nftTokenID + 'clicked' )}
          />
        )}
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

export default ExistingPositions
