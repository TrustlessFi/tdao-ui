import { useHistory } from 'react-router-dom'
import { useAppSelector } from '../../app/hooks'
import { waitForTcpProposals } from '../../slices/waitFor'
import AppTile from '../library/AppTile'
import AppLoading from '../library/AppLoading'
import Center from '../library/Center'
import { ListItem, UnorderedList } from 'carbon-components-react'
import { useDispatch } from 'react-redux'
import { useAppSelector as selector } from '../../app/hooks'
import CreateTransactionButton from '../utils/CreateTransactionButton'
import { TransactionType } from '../../slices/transactions'
import { waitForContracts } from '../../slices/waitFor'
import { notNullString } from '../../utils'
import { FunctionComponent } from 'react'
import { ClickableTile } from 'carbon-components-react'
import ProgressBar from '../library/ProgressBar'
import { InlineAppTag, ProposalDescription } from './GovernanceSubcomponents'

const ProposalsList: FunctionComponent = () => {
  const dispatch = useDispatch()
  const history = useHistory()

  const tcpProposals = waitForTcpProposals(useAppSelector, dispatch)
  const contracts = waitForContracts(selector, dispatch)
  const userAddress = selector(state => state.wallet.address)

  const dataNull =
    tcpProposals === null ||
    contracts === null ||
    userAddress === null

  if (dataNull) {
    return (
      <AppLoading
        description="Proposals loading"
        small
        withOverlay={false}
      />
    )
  }

  console.log({tcpProposals})

  if (Object.values(tcpProposals.proposals).length === 0) {
    return (
      <Center>There are no Tcp governance proposals.</Center>
    )
  }

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

  return (
    <AppTile title="Proposals" className="proposals" rightElement={selfDelegateButton} >
      <UnorderedList>
        {Object.values(tcpProposals.proposals).map(p =>
          <ListItem key={p.proposal.id}>
            <ClickableTile
              style={{ display: 'flex', justifyContent: 'space-between' }}
              onClick={() => history.push(`/tcp/proposal/${p.proposal.id}`)}>
              <div>
                Proposal {p.proposal.id}: {p.proposal.title}
                <InlineAppTag proposalState={p.proposal.state} />
              </div>
              <div style={{ width: '25%', display: 'flex', flexDirection: 'column' }}>
                <ProgressBar label="Sentiment" amount={p.proposal.forVotes} max={p.proposal.forVotes + p.proposal.againstVotes} />
                <ProgressBar label="Quorum Progress" amount={p.proposal.forVotes} max={tcpProposals.quorum} />
              </div>
            </ClickableTile>
          </ListItem>
        )}
      </UnorderedList>
    </AppTile>
  )
}

export default ProposalsList
