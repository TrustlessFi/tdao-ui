import { useParams } from 'react-router';
import { RadioButtonValue } from 'carbon-components-react'
import { FunctionComponent, useState, useEffect } from 'react'
import { useAppDispatch, useAppSelector as selector } from '../../app/hooks'
import { ProposalState } from '../../slices/proposals'
import { TransactionType } from '../../slices/transactions'
import waitFor from '../../slices/waitFor'
import { ProposalVoterInfo } from '../../slices/proposalsVoterInfo'
import { numDisplay } from '../../utils'
import ProgressBar from '../library/ProgressBar'
import LargeText from '../library/LargeText'
import CreateTransactionButton from '../library/CreateTransactionButton'
import { InlineAppTag } from './GovernanceSubcomponents'
import ProposalActions from './ProposalActions'
import Breadcrumbs from '../library/Breadcrumbs'
import TwoColumnDisplay from '../library/TwoColumnDisplay'
import ConnectWalletButton from '../library/ConnectWalletButton'
import VoteDelegationPanel from './VoteDelegationPanel'
import SpacedList from '../library/SpacedList'
import InputPicker from '../library/InputPicker'
import { Launch16 } from '@carbon/icons-react';
import { abbreviateAddress } from '../../utils'
import { getEtherscanAddressLink } from '../library/ExplorerLink'

enum Vote {
  '-' = '-',
  Yes = 'Yes',
  No = 'No',
}

const ProposalDisplay: FunctionComponent = () => {
  const dispatch = useAppDispatch()
  const params: { proposalID: string } = useParams()

  const proposalID = Number(params.proposalID)

  const {
    contracts,
    tcpProposals,
    tcpProposalsVoterInfo,
    chainID,
    userAddress,
  } = waitFor([
    'contracts',
    'tcpProposals',
    'tcpProposalsVoterInfo',
    'chainID',
    'userAddress',
  ], selector, dispatch)

  const [ voteChoice, setVoteChoice ] = useState<Vote>(Vote['-'])

  const dataNull =
    tcpProposals === null ||
    contracts === null

  const p = tcpProposals === null ? null : tcpProposals.proposals[proposalID]
  const vi = tcpProposalsVoterInfo === null ? null : tcpProposalsVoterInfo[proposalID]

  const getVote = (vi: ProposalVoterInfo): Vote =>
    vi.receipt.hasVoted
    ? (vi.receipt.support ? Vote.Yes : Vote.No)
    : Vote['-']


  useEffect(() => { if (vi !== null) setVoteChoice(getVote(vi)) }, [vi])

  const forVotes = p === null ? 0 : (p.forVotes + (vi === null ? 0 : (voteChoice === Vote.Yes ? vi.votingPower : 0)))
  const againstVotes = p === null ? 0 : (p.againstVotes + (vi === null ? 0 : (voteChoice === Vote.No ? vi.votingPower : 0)))
  const totalVotes = p === null ? 0 : forVotes + againstVotes
  const voteForPercentage = numDisplay(Math.floor(p === null || totalVotes === 0 ? 0 : (forVotes / totalVotes) * 100))
  const quorum = tcpProposals === null ? 0 : tcpProposals.quorum

  const handleVoteChange = (newSelection: RadioButtonValue): void => setVoteChoice(newSelection as Vote)

  const infoColumnOne =
    <SpacedList spacing={16}>
      <>
        <LargeText>{p === null ? '-' : p.title}</LargeText>
        <InlineAppTag proposalState={p === null ? ProposalState.Pending : p.state} />
      </>
      {
        p === null
        ? '-'
        :  <a
            href={`https://gateway.ipfs.io/ipfs/${p.ipfsHash}`}
            target='_blank'
            rel='noopener noreferrer'
            style={{}}>
            Full description
            <Launch16 />
          </a>
      }
      {/* TODO: Add ability to copy proposer's address */}
      <>
        Created by{' '}
        {
          p === null || chainID === null ? '-' :
          <a
            href={getEtherscanAddressLink(p.proposer, chainID)}
            target='_blank'
            rel='noopener noreferrer'
            style={{}}>
            {abbreviateAddress(p.proposer)}
            <Launch16 />
          </a>
        }
      </>
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

  const hasVoted = vi !== null && vi.receipt.hasVoted
  const isActiveProposal = p !== null && p.state === ProposalState.Active
  const hasVotingPower = vi !== null && vi.votingPower > 0
  const previousVote = vi === null ? Vote['-'] : (vi.receipt.support ? Vote.Yes : Vote.No)


  const voteColumnOne =
    <SpacedList>
      {
        userAddress === null
        ? <ConnectWalletButton size='sm' />
        : (hasVoted
          ? `You voted ${previousVote}.`
          : (
            isActiveProposal
            ? (
              hasVotingPower
              ? <SpacedList>
                  <InputPicker
                    options={Vote}
                    onChange={handleVoteChange}
                    initialValue={Vote['-']}
                    label="Allocation options"
                    style={{display: 'block'}}
                  />
                  <CreateTransactionButton
                    title='Cast Vote'
                    disabled={voteChoice === Vote['-']}
                    txArgs={{
                      type: TransactionType.VoteTcpProposal,
                      TcpGovernorAlpha: contracts === null ? '' : contracts.TcpGovernorAlpha,
                      proposalID: p === null ? 0 : p.id,
                      support: voteChoice === Vote.Yes,
                    }}
                  />
                </SpacedList>
              : 'You have no voting power on this proposal.'
              )
            : 'Voting is closed.'
          )
        )
      }
    </SpacedList>

  const voteColumnTwo =
    <SpacedList spacing={16}>
      <LargeText>Vote Count: </LargeText>
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
    </SpacedList>

  return (
    <>
      <Breadcrumbs crumbs={[{ text: 'Tcp', href: '/tcp' }, 'Proposal', proposalID.toString()]} />
      <VoteDelegationPanel underlyingTokenAddress={contracts === null ? null : contracts.Tcp} />
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
