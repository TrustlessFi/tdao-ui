import React, { FunctionComponent } from 'react'
import { useAppDispatch, useAppSelector as selector } from '../../app/hooks'
import AppTile from '../library/AppTile'
import CreateTransactionButton from '../library/CreateTransactionButton'
import { TransactionType } from '../../slices/transactions'
import { waitForContracts } from '../../slices/waitFor'
import { notNullString } from '../../utils'

const VoteDelegationPanel: FunctionComponent = () => {
  const dispatch = useAppDispatch()

  const contracts = waitForContracts(selector, dispatch)
  const userAddress = selector(state => state.wallet.address)

  const selfDelegateDataNull =
    contracts === null ||
    userAddress === null

  const selfDelegateButton =
    <CreateTransactionButton
      style={{marginTop: 8}}
      disabled={selfDelegateDataNull}
      title="Self Delegate Tcp"
      size="sm"
      txArgs={{
        type: TransactionType.SelfDelegateTcp,
        userAddress: notNullString(userAddress),
        tcp: contracts === null ? '' : contracts.Tcp,
      }}
    />

  return (
    <AppTile title="Delegate" rightElement={selfDelegateButton}>
      <div>VoteDelegationPanel</div>
    </AppTile>
  )
}

VoteDelegationPanel.propTypes = {

}

export default VoteDelegationPanel
