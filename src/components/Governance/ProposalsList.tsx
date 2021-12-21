import { useHistory } from 'react-router-dom'
import { useAppSelector } from '../../app/hooks'
import { waitForTcpProposals, waitForContracts } from '../../slices/waitFor'
import { Proposal, ProposalState, isVotingCompleteState } from '../../slices/proposals'
import AppTile from '../library/AppTile'
import Center from '../library/Center'
import { useDispatch } from 'react-redux'
import { useAppSelector as selector } from '../../app/hooks'
import CreateTransactionButton from '../library/CreateTransactionButton'
import ProgressBar from '../library/ProgressBar'
import { TransactionType } from '../../slices/transactions'
import { notNullString, numDisplay } from '../../utils'
import { FunctionComponent } from 'react'
import SimpleTable, { TableHeaderOnly } from '../library/SimpleTable'
import ConnectWalletButton from '../library/ConnectWalletButton'
import { InlineAppTag } from './GovernanceSubcomponents'

const ProposalsList: FunctionComponent = () => {
  const dispatch = useDispatch()
  const history = useHistory()

  const tcpProposals = waitForTcpProposals(useAppSelector, dispatch)
  const contracts = waitForContracts(selector, dispatch)
  const userAddress = selector(state => state.wallet.address)
  const chainID = selector(state => state.chainID)

  const dataNull =
    tcpProposals === null ||
    contracts === null ||
    userAddress === null ||
    chainID === null

  const selfDelegateButton =
    <CreateTransactionButton
      style={{marginTop: 8}}
      disabled={dataNull}
      title="Self Delegate Tcp"
      size="sm"
      txArgs={{
        type: TransactionType.SelfDelegateTcp,
        userAddress: notNullString(userAddress),
        tcp: contracts === null ? '' : contracts.Tcp,
      }}
    />


  const tableTitle = `Proposals ${tcpProposals === null ? '' : `(${Object.values(tcpProposals.proposals).length}`})`

  const getVotingRewards = (p: Proposal, inflationPercentage: number) => {
    const totalVotingRewards = p.proposal.initialSupply * inflationPercentage
    const totalVotes = p.proposal.forVotes + p.proposal.againstVotes
    const estimatedRewards = (totalVotingRewards * p.votingPower) / totalVotes

    if (!p.receipt.hasVoted) {
      return estimatedRewards === 0 || totalVotes === 0
        ? 'Have not voted'
        : `Up to ${numDisplay(estimatedRewards)} Tcp after voting`
    } else if (p.proposal.state === ProposalState.Active) {
        return `Up to ${numDisplay(estimatedRewards)} Tcp after voting`
    } else {
        return p.receipt.rewardReceived
          ? `0 Tcp`
          : `${numDisplay(estimatedRewards)} Tcp`
    }
  }

  if (userAddress === null || tcpProposals === null || Object.values(tcpProposals.proposals).length === 0) {
    return (
      <AppTile title={tableTitle} rightElement={selfDelegateButton}>
        <div style={{position: 'relative'}}>
          <TableHeaderOnly headers={['ID', 'Title', 'Stage', 'Status', 'Your Vote', 'Voting Rewards']} />
          <Center>
            <div style={{margin: 32}}>
              {userAddress === null
                ? <ConnectWalletButton />
                : <>There are no proposals</>
              }
            </div>
          </Center>
        </div>
      </AppTile>
    )
  }

  const proposalIDsWithRewards: number[] = []

  const rows =
    Object.values(tcpProposals.proposals)
    .sort((a, b) => b.proposal.id - a.proposal.id)
    .map(p => {
      if (isVotingCompleteState(p.proposal.state) && !p.receipt.rewardReceived && p.receipt.votes > 0) {
        proposalIDsWithRewards.push(p.proposal.id)
      }

      return {
        data: {
          'ID': p.proposal.id,
          'Title': p.proposal.title,
          'Stage': <InlineAppTag proposalState={p.proposal.state} />,
          'Status':
              <div style={{ width: '50%', display: 'flex', flexDirection: 'column' }}>
                <ProgressBar label="Sentiment" amount={p.proposal.forVotes} max={p.proposal.forVotes + p.proposal.againstVotes} />
                <ProgressBar label="Quorum" amount={p.proposal.forVotes} max={tcpProposals.quorum} />
              </div>,
          'Your Vote': p.receipt.hasVoted ? (p.receipt.support ? 'Yes' : 'No') : 'None',
          'Voting Rewards': getVotingRewards(p, tcpProposals.inflationPercentage)
        },
        onClick: () => history.push(`/tcp/proposal/${p.proposal.id}`),
      }
    }
  )

  const claimAllRewardsButton =
    <CreateTransactionButton
      style={{marginTop: 8}}
      disabled={proposalIDsWithRewards.length === 0}
      title="Claim voting rewards"
      size="sm"
      txArgs={{
        type: TransactionType.ClaimTcpVotingRewards,
        governorAlpha: contracts === null ? '' : contracts.TcpGovernorAlpha,
        proposalIDs: proposalIDsWithRewards,
      }}
    />

  return (
      <AppTile title={tableTitle} rightElement={claimAllRewardsButton}>
        <SimpleTable rows={rows} />
      </AppTile>
  )
}

export default ProposalsList
