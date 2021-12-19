import { useParams } from 'react-router';
import { RadioButtonGroup, RadioButton, Tile, RadioButtonValue } from 'carbon-components-react'
import { FunctionComponent, useState, useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { waitForTcpProposals } from '../../slices/waitFor'
import { Proposal, ProposalState } from '../../slices/proposals'
import { TransactionType } from '../../slices/transactions'
import { waitForContracts } from '../../slices/waitFor'
import { numDisplay } from '../../utils'
import ProgressBar from '../library/ProgressBar'
import LargeText from '../utils/LargeText'
import CreateTransactionButton from '../utils/CreateTransactionButton'
import { InlineAppTag } from './GovernanceSubcomponents'
import ProposalActions from './ProposalActions'
import Breadcrumbs from '../library/Breadcrumbs'
import TwoColumnDisplay from '../utils/TwoColumnDisplay'
import SpacedList from '../library/SpacedList'
import InputPicker from '../library/InputPicker'

enum Vote {
  '-' = '-',
  YES = 'YES',
  NO = 'NO',
}

const getUserVoteStatusDisplay = (proposal: Proposal): string => {
  const { proposal: p } = proposal
  const { hasVoted } = proposal.receipt
  const hasNoVotingPower = proposal.votingPower === 0
  const proposalActive = p.state === ProposalState.Active

  return (
    hasVoted
    ? ''
    : (
        proposalActive
        ? (
            hasNoVotingPower
            ? 'You must self delegate to vote in the next proposal.'
            : `You are voting with ${numDisplay(proposal.votingPower)} Tcp.`
          )
        : 'You cannot vote as this proposal is not active.'
    )
  )
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

  const dataNull = tcpProposals === null

  const p = tcpProposals === null ? null : tcpProposals.proposals[proposalID]

  const getVote = (proposal: Proposal): Vote =>
    proposal.receipt.hasVoted
    ? (proposal.receipt.support ? Vote.YES : Vote.NO)
    : Vote['-']

  const [ voteChoice, setVoteChoice ] = useState<Vote>(Vote['-'])

  useEffect(() => { if (p !== null) setVoteChoice(getVote(p)) }, [p])


  const forVotes = p === null ? 0 : (p.proposal.forVotes + (voteChoice === Vote.YES ? p.votingPower : 0))
  const againstVotes = p === null ? 0 :  (p.proposal.againstVotes + (voteChoice === Vote.NO ? p.votingPower : 0))
  const totalVotes = p === null ? 0 : forVotes + againstVotes
  const voteForPercentage = numDisplay(Math.floor(p === null || totalVotes === 0 ? 0 : (forVotes / totalVotes) * 100))
  const quorum = tcpProposals === null ? 0 : tcpProposals.quorum

  const handleVoteChange = (newSelection: RadioButtonValue): void => setVoteChoice(newSelection as Vote)

  const infoColumnOne =
    <SpacedList>
      <>
        <LargeText>{p === null ? '-' : p.proposal.title}</LargeText>
        <InlineAppTag proposalState={p === null ? ProposalState.Pending : p.proposal.state} />
      </>
      {
        p === null
        ? '-'
        : <a
            href={`https://gateway.ipfs.io/ipfs/${p.proposal.ipfsHash}`}
            target='_blank'
            rel='noopener noreferrer'
            style={{}}>
            View full dscription
          </a>
      }
      {/* TODO: Add ability to copy proposer's address */}
      <div style={{ marginTop: 16}}> Created by: {p === null ? '-' : p.proposal.proposer}</div>
    </SpacedList>

  const infoColumnTwo =
    <>
      <LargeText>Operations:</LargeText>
      {
        p === null
        ? null
        : <ProposalActions proposal={p} showRaw={false} />
      }
    </>

  const voteColumnOne =
    <SpacedList>
      <LargeText>Your Vote</LargeText>
      <div>{p === null ? '-' : getUserVoteStatusDisplay(p)}</div>
        <InputPicker
          options={Vote}
          onChange={handleVoteChange}
          initialValue={Vote['-']}
          label="Allocation options"
          style={{}}
        />
        <CreateTransactionButton
          title='Cast Vote'
          disabled={p === null ? true : getIsVotingDisabled(p) || voteChoice === Vote['-']}
          txArgs={{
            type: TransactionType.VoteTcpProposal,
            TcpGovernorAlpha: contracts === null ? '' : contracts.TcpGovernorAlpha,
            proposalID: p === null ? 0 : p.proposal.id,
            support: voteChoice === Vote.YES,
          }}
        />
    </SpacedList>

  const voteColumnTwo =
    <>
      <LargeText>Vote Status</LargeText>
      <ProgressBar
        label={`Yes: ${voteForPercentage}%`}
        amount={forVotes}
        max={totalVotes}
        rightLabel={`${numDisplay(forVotes)} / ${numDisplay(totalVotes)}`}
      />
      <ProgressBar
        label={p !== null && forVotes > quorum ? 'Quorum Reached' : 'Quorum Not Reached'}
        amount={forVotes}
        max={quorum}
        rightLabel={`${p === null ? '-' : numDisplay(forVotes)} / ${numDisplay(quorum)}`}
      />
    </>

  return (
    <>
      <Breadcrumbs crumbs={[{ text: 'Tcp', href: '/tcp' }, 'Proposal', proposalID.toString()]} />
      <TwoColumnDisplay
        style={{marginTop: 32}}
        columnOne={infoColumnOne}
        columnTwo={infoColumnTwo}
        loading={dataNull}
        verticalAlignMiddle={false}
      />
      <TwoColumnDisplay
        style={{marginTop: 32}}
        columnOne={voteColumnOne}
        columnTwo={voteColumnTwo}
        loading={dataNull}
      />
    </>
  )
}

export default ProposalDisplay
