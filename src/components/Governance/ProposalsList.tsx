import { useHistory } from 'react-router-dom'
import { useAppDispatch, useAppSelector as selector } from '../../app/hooks'
import {
  waitForTcpProposals,
  waitForContracts,
  waitForTcpProposalsVoterInfo,
  waitForVoteDelegation,
} from '../../slices/waitFor'
import { Proposal, isVotingCompleteState } from '../../slices/proposals'
import AppTile from '../library/AppTile'
import Center from '../library/Center'
import { useDispatch } from 'react-redux'
import CreateTransactionButton from '../library/CreateTransactionButton'
import ProgressBar from '../library/ProgressBar'
import { TransactionType } from '../../slices/transactions'
import { zeroAddress, numDisplay } from '../../utils'
import { FunctionComponent } from 'react'
import SimpleTable, { TableHeaderOnly } from '../library/SimpleTable'
import RelativeLoading from '../library/RelativeLoading'
import SpacedList from '../library/SpacedList'
import { InlineAppTag } from './GovernanceSubcomponents'
import { DataTableSkeleton } from "carbon-components-react"

const VoteDelegationPanel = ({
  underlyingTokenAddress
}:{
  underlyingTokenAddress: string
}) => {
  const dispatch = useAppDispatch()

  const contracts = waitForContracts(selector, dispatch)
  const voteDelegation = waitForVoteDelegation(selector, dispatch)

  const tdao = selector(state => state.chainID.tdao)
  const userAddress = selector(state => state.wallet.address)

  const loading =
    contracts === null ||
    voteDelegation === null ||
    tdao === null ||
    userAddress === null

  const alreadySelfDelegated =
    voteDelegation !== null &&
    userAddress !== null &&
    voteDelegation[underlyingTokenAddress] === userAddress

  if (loading || alreadySelfDelegated) return null

  return (
    <AppTile title='Vote Delegation Delegate'>
      <div style={{position: 'relative'}}>
        <RelativeLoading show={loading} />
        <SpacedList spacing={16}>
          <span>
            Before you can vote, you must delegate your voting power to yourself.
          </span>
          <span>
            You only need to do this once.
          </span>
          <CreateTransactionButton
            style={{marginTop: 8}}
            disabled={loading || alreadySelfDelegated}
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

const ProposalsList: FunctionComponent = () => {
  const dispatch = useDispatch()
  const history = useHistory()

  const tcpProposals = waitForTcpProposals(selector, dispatch)
  const tcpProposalsVoterInfo = waitForTcpProposalsVoterInfo(selector, dispatch)
  console.log("START", {tcpProposals, tcpProposalsVoterInfo})
  const contracts = waitForContracts(selector, dispatch)

  if (tcpProposals === null) {
    return (
      <AppTile title='Proposals'>
        <DataTableSkeleton showHeader={false} showToolbar={false} columnCount={6} />
      </AppTile>
    )
  }

  const getVotingRewardsDisplay = (p: Proposal, inflationPercentage: number) => {
    const totalVotes = p.forVotes + p.againstVotes
    if (totalVotes === null || tcpProposalsVoterInfo === null) return ''
    const votingPower = tcpProposalsVoterInfo[p.id].votingPower

    return numDisplay((p.initialSupply * inflationPercentage * votingPower) / totalVotes)
  }

  const proposalIDsWithUnclaimedRewards: number[] = []

  const table =
    Object.values(tcpProposals.proposals).length === 0
    ? <>
        <TableHeaderOnly headers={['ID', 'Title', 'Stage', 'Status', 'Your Vote', 'Voting Rewards']} />
        <Center>
          <div style={{margin: 32}}>
            There are no proposals.
          </div>
        </Center>
      </>
    : <SimpleTable rows={
        Object.values(tcpProposals.proposals)
          .sort((a, b) => b.id - a.id)
          .map(p => {
            console.log({p, tcpProposalsVoterInfo})
            const vi = tcpProposalsVoterInfo === null ? null : tcpProposalsVoterInfo[p.id]
            console.log({vi})
            if (
              isVotingCompleteState(p.state) &&
              vi !== null &&
              !vi.receipt.rewardReceived
              && vi.receipt.votes > 0
            ) {
              proposalIDsWithUnclaimedRewards.push(p.id)
            }

            return {
              data: {
                'ID': p.id,
                'Title': p.title,
                'Stage': <InlineAppTag proposalState={p.state} />,
                'Status':
                  <div style={{ width: '50%', display: 'flex', flexDirection: 'column' }}>
                    <ProgressBar label="Sentiment" amount={p.forVotes} max={p.forVotes + p.againstVotes} />
                    <ProgressBar label="Quorum" amount={p.forVotes} max={tcpProposals.quorum} />
                  </div>,
                'Your Vote': vi === null || !vi.receipt.hasVoted ? '-' : (vi.receipt.support ? 'Yes' : 'No'),
                'Voting Rewards': getVotingRewardsDisplay(p, tcpProposals.inflationPercentage)
              },
              onClick: () => history.push(`/tcp/proposal/${p.id}`),
            }
          })
        }
      />

  const claimAllRewardsButton =
    <CreateTransactionButton
      style={{marginTop: 8}}
      disabled={proposalIDsWithUnclaimedRewards.length === 0 || contracts === null}
      title="Claim Voting Rewards"
      size="sm"
      txArgs={{
        type: TransactionType.ClaimTcpVotingRewards,
        governorAlpha: contracts === null ? '' : contracts.TcpGovernorAlpha,
        proposalIDs: proposalIDsWithUnclaimedRewards,
      }}
    />

  return (
    <SpacedList spacing={32}>
      <VoteDelegationPanel underlyingTokenAddress={contracts === null ? zeroAddress : contracts.Tcp} />
      <AppTile
        title={`Proposals (${Object.values(tcpProposals.proposals).length})`}
        rightElement={claimAllRewardsButton}>
        {table}
      </AppTile>
    </SpacedList>
  )
}

export default ProposalsList
