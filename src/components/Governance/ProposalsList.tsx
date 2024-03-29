import { useHistory } from 'react-router-dom'
import { useAppSelector as selector } from '../../app/hooks'
import waitFor from '../../slices/waitFor'
import { Proposal, isVotingCompleteState, ProposalState } from '../../slices/proposals'
import AppTile from '../library/AppTile'
import Center from '../library/Center'
import { useDispatch } from 'react-redux'
import CreateTransactionButton from '../library/CreateTransactionButton'
import ProgressBar from '../library/ProgressBar'
import { TransactionType } from '../../slices/transactions'
import { zeroAddress, numDisplay } from '../../utils'
import { FunctionComponent } from 'react'
import SimpleTable, { TableHeaderOnly } from '../library/SimpleTable'
import VoteDelegationPanel from './VoteDelegationPanel'
import { InlineAppTag } from './GovernanceSubcomponents'
import { DataTableSkeleton } from "carbon-components-react"

const ProposalsList: FunctionComponent = () => {
  const dispatch = useDispatch()
  const history = useHistory()

  const {
    contracts,
    tcpProposals,
    tcpProposalsVoterInfo,
  } = waitFor([
    'contracts',
    'tcpProposals',
    'tcpProposalsVoterInfo',
  ], selector, dispatch)

  if (tcpProposals === null) {
    return (
      <AppTile title='Proposals'>
        <DataTableSkeleton showHeader={false} showToolbar={false} columnCount={6} />
      </AppTile>
    )
  }

  const getVotingRewardsDisplay = (p: Proposal) => {
    if (tcpProposalsVoterInfo === null) return '-'
    const vi = tcpProposalsVoterInfo[p.id]
    if (vi.votingPower === 0) return '-'
    if (p.state === ProposalState.Active) return 'Voting still active'

    const rewards = vi.votingRewards
    return (
      vi.receipt.rewardReceived
      ? `Claimed ${numDisplay(rewards)} Tcp`
      : `${numDisplay(rewards)} Tcp`
    )
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
            const vi = tcpProposalsVoterInfo === null ? null : tcpProposalsVoterInfo[p.id]
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
                'Voting Rewards': getVotingRewardsDisplay(p)
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
    <>
      <VoteDelegationPanel
        underlyingTokenAddress={contracts === null ? zeroAddress : contracts.Tcp}
        style={{marginBottom: 32}}
      />
      <AppTile
        title={`Proposals (${Object.values(tcpProposals.proposals).length})`}
        rightElement={claimAllRewardsButton}>
        {table}
      </AppTile>
    </>
  )
}

export default ProposalsList
