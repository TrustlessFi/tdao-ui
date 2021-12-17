import { useParams } from 'react-router';
import { Checkbox, Modal, RadioButtonGroup, RadioButton, Tile, RadioButtonValue } from 'carbon-components-react'
import { FunctionComponent, SyntheticEvent, useState } from 'react'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { waitForTcpProposals } from '../../slices/waitFor'
import { Proposal, ProposalState } from '../../slices/proposals'
import { TransactionType } from '../../slices/transactions'
import { waitForContracts } from '../../slices/waitFor'
import { numDisplay } from '../../utils'
import ProgressBar from '../library/ProgressBar'
import CreateTransactionButton from '../utils/CreateTransactionButton'
import { InlineAppTag, ProposalDescription } from './GovernanceSubcomponents'
import { SignatureInfo } from './SignatureInfo'
import Breadcrumbs from '../library/Breadcrumbs'

enum Vote {
  YES = 'YES',
  NO = 'NO',
  NO_VOTE = 'NO_VOTE',
}


const getUserVoteStatusDisplay = (proposal: Proposal): string => {
  const { proposal: p } = proposal
  const { hasVoted } = proposal.receipt
  const hasNoVotingPower = proposal.votingPower === 0
  const proposalActive = p.state === ProposalState.Active

  if (hasVoted) {
    return 'You have already cast a vote.'
  }
  if (proposalActive) {
    if (hasNoVotingPower) {
      return 'You did not have any delegated votes when this proposal was introduced and therefore cannot vote.'
    } else {
      return `Your vote has a weight of ${numDisplay(proposal.votingPower)} CNP.`
    }
  }
  return 'You cannot vote as this proposal is not active.'
}

const getIsVotingDisabled = (proposal: Proposal): boolean => {
  const hasNoVotingPower = proposal.votingPower === 0
  const proposalActive = proposal.proposal.state === ProposalState.Active
  return proposal.receipt.hasVoted || !proposalActive || hasNoVotingPower
}

const ProposalDisplay: FunctionComponent = () => {
  const dispatch = useAppDispatch()
  const contracts = waitForContracts(useAppSelector, dispatch)
  const params: { proposalID: string } = useParams()

  const proposalID = Number(params.proposalID)
  const tcpProposals = waitForTcpProposals(useAppSelector, dispatch)

  const p = tcpProposals === null ? null : tcpProposals.proposals[proposalID]

  const getVote = (proposal: Proposal): Vote =>
    proposal.receipt.hasVoted
    ? (proposal.receipt.support ? Vote.YES : Vote.NO)
    : Vote.NO_VOTE


  const initialVote = p === null ? Vote.NO_VOTE : getVote(p)
  const [ voteChoice, setVoteChoice ] = useState<Vote>(Vote.NO_VOTE)

  const forVotes = p === null ? 0 : p.proposal.forVotes
  const againstVotes = p === null ? 0 : p.proposal.againstVotes
  const totalVotes = forVotes + againstVotes
  const voteForPercentage = Math.round(p === null ? 0 : p.proposal.forVotes / totalVotes * 100)
  const voteAgainstPercentage = Math.round(p === null ? 0 : p.proposal.againstVotes / totalVotes * 100)
  const quorum = tcpProposals === null ? 0 : tcpProposals.quorum

  const handleVoteChange = (newSelection: RadioButtonValue): void => setVoteChoice(newSelection as Vote)

  return (
    <div>
      <Breadcrumbs crumbs={[{ text: 'Tcp', href: '/tcp' }, 'proposal', proposalID.toString()]} />
      <div style={{ marginTop: 16}}>
        <ProposalDescription ipfsHash={p === null ? '' : p.proposal.ipfsHash} fontSize={24} />
        <InlineAppTag proposalState={p === null ? ProposalState.Pending : p.proposal.state} />
      </div>
      {/* TODO: Add ability to copy proposer's address */}
      <div style={{ marginTop: 16}}> Created by: {p === null ? '-' : p.proposal.proposer}</div>
      <div style={{ fontSize: 18, marginTop: 16 }} > Operations: </div>
      {
        p === null
        ? null
        : <SignatureInfo proposal={p} showRaw={true} />
      }
      <div style={{ display: 'flex', marginTop: 16 }} >
        <Tile style={{ flex: '0 1 50%', marginRight: 8 }} light >
          <span style={{ fontSize: 24 }}> Vote Status </span>
          <ProgressBar
            label={`For ${voteForPercentage}%`}
            amount={forVotes}
            max={totalVotes}
            rightLabel={`${forVotes} / ${totalVotes}`}
          />
          <ProgressBar
            label={`Against ${voteAgainstPercentage}%`}
            amount={againstVotes}
            max={totalVotes}
            rightLabel={`${againstVotes} / ${totalVotes}`}
          />
          <ProgressBar
            label={p !== null && p.proposal.forVotes > quorum ? 'Quorum Reached' : 'Quorum Not Reached'}
            amount={forVotes}
            max={quorum}
            rightLabel={`${p === null ? '-' : p.proposal.forVotes} / ${quorum}`}
          />
        </Tile>
        <Tile style={{ flex: '0 1 50%', marginLeft: 8 }} light >
          <span style={{ fontSize: 24 }}> Vote </span>
          <div>{p === null ? '-' : getUserVoteStatusDisplay(p)}</div>
          <div style={{ margin: '16px 0', display: 'flex', alignItems: 'center', flexDirection: 'column'}}>
            <RadioButtonGroup
              name='proposal-vote'
              legendText='Do you support this proposal?'
              onChange={handleVoteChange}
              valueSelected={voteChoice}
              disabled={p === null ? true : getIsVotingDisabled(p)}
            >
              <RadioButton labelText='Yes' value={Vote.YES} id='proposal-vote-yes' />
              <RadioButton labelText='No' value={Vote.NO} id='proposal-vote-no' />
            </RadioButtonGroup>
            <CreateTransactionButton
              title='Cast Vote'
              disabled={p === null ? true : getIsVotingDisabled(p) || voteChoice === Vote.NO_VOTE}
              txArgs={{
                type: TransactionType.VoteTcpProposal,
                TcpGovernorAlpha: contracts === null ? '' : contracts.TcpGovernorAlpha,
                proposalID: p === null ? 0 : p.proposal.id,
                support: voteChoice === Vote.YES,
              }}
              style={{ marginTop: 8, width: '50%' }}
            />
          </div>
        </Tile>
      </div>
    </div>
  )

}

export default ProposalDisplay
