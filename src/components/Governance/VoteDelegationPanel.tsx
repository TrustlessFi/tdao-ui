import { CSSProperties, ReactNode } from 'react';
import { useAppDispatch, useAppSelector as selector } from '../../app/hooks'
import {
  waitForContracts,
  waitForVoteDelegation,
  waitForBalances,
} from '../../slices/waitFor'
import { numDisplay } from '../../utils/'
import AppTile from '../library/AppTile'
import CreateTransactionButton from '../library/CreateTransactionButton'
import { TransactionType } from '../../slices/transactions'
import SpacedList from '../library/SpacedList'

const VoteDelegationPanel = ({
  underlyingTokenAddress,
  style,
}:{
  underlyingTokenAddress: string | null,
  style?: CSSProperties,
}) => {
  const dispatch = useAppDispatch()

  const contracts = waitForContracts(selector, dispatch)
  const balances = waitForBalances(selector, dispatch)
  const voteDelegation = waitForVoteDelegation(selector, dispatch)

  const tdao = selector(state => state.chainID.tdao)
  const userAddress = selector(state => state.wallet.address)

  if (
    contracts === null ||
    balances === null ||
    voteDelegation === null ||
    tdao === null ||
    underlyingTokenAddress === null ||
    userAddress === null
  ) return null // loading

  if (
    voteDelegation !== null &&
    userAddress !== null &&
    underlyingTokenAddress !== null &&
    voteDelegation[underlyingTokenAddress] === userAddress
  ) return null // already self delegated

  const userBalance = balances.tokens[underlyingTokenAddress].userBalance

  if (userBalance === 0) return null // no tokens to vote with

  return (
    <AppTile title={`Self-Delegate ${numDisplay(userBalance)} Votes`} style={style}>
      <div style={{position: 'relative', paddingBottom: 32, paddingLeft: 32}}>
        <SpacedList spacing={16}>
          <span>Before you can vote you must delegate your Tcp voting power to yourself. This only needs to be done once.</span>
          <span>You will not be able to vote on current proposals, but will earn Tcp rewards for voting on future proposals.</span>
          <CreateTransactionButton
            style={{marginTop: 8}}
            title="Self Delegate Tcp"
            size="sm"
            txArgs={{
              type: TransactionType.SelfDelegateTcp,
              tcp: contracts === null ? '' : contracts.Tcp,
            }}
          />
        </SpacedList>
      </div>
    </AppTile>
  )
}

export default VoteDelegationPanel
