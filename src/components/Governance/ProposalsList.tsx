import { useHistory } from 'react-router-dom'
import { useAppSelector } from '../../app/hooks'
import { waitForTcpProposals } from '../../slices/waitFor'
import AppTile from '../library/AppTile'
import AppLoading from '../library/AppLoading'
import Center from '../library/Center'
import { useDispatch } from 'react-redux'
import { useAppSelector as selector } from '../../app/hooks'
import CreateTransactionButton from '../library/CreateTransactionButton'
import ProgressBar from '../library/ProgressBar'
import { TransactionType } from '../../slices/transactions'
import { waitForContracts } from '../../slices/waitFor'
import { notNullString } from '../../utils'
import { FunctionComponent } from 'react'
import { Button, InlineLoading } from 'carbon-components-react'
import { clearUserTransactions, getTxLongName } from '../../slices/transactions'
import SimpleTable, { TableHeaderOnly } from '../library/SimpleTable'
import ConnectWalletButton from '../library/ConnectWalletButton'
import { getDateTimeStringMS } from '../../utils'
import { getEtherscanTxLink, getEtherscanAddressLink } from '../library/ExplorerLink'
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

  const table =
    userAddress === null || tcpProposals === null || Object.values(tcpProposals.proposals).length === 0
    ? (
        <div style={{position: 'relative'}}>
          <TableHeaderOnly headers={['ID', 'Title', 'Stage', 'Status', 'Voting Rewards']} />
          <Center>
            <div style={{margin: 32}}>
              {userAddress === null
                ? <ConnectWalletButton />
                : <Button onClick={() => window.open(getEtherscanAddressLink(userAddress, chainID.chainID!), '_blank')}>
                    View History on Etherscan
                  </Button>
              }
            </div>
          </Center>
        </div>
      )
    : <SimpleTable rows={
        Object.values(tcpProposals.proposals).map(p => ({
        data: {
          'ID': p.proposal.id,
          'Title': p.proposal.title,
          'Stage': <InlineAppTag proposalState={p.proposal.state} />,
          'Status':
              <div style={{ width: '50%', display: 'flex', flexDirection: 'column' }}>
                <ProgressBar label="Sentiment" amount={p.proposal.forVotes} max={p.proposal.forVotes + p.proposal.againstVotes} />
                <ProgressBar label="Quorum Progress" amount={p.proposal.forVotes} max={tcpProposals.quorum} />
              </div>,
          'Voting Rewards': 'Have not voted.'
        },
        onClick: () => history.push(`/tcp/proposal/${p.proposal.id}`),
      }))
    } />

  const tableTitle = `Proposals (${tcpProposals === null ? '-' : Object.values(tcpProposals.proposals).length})`

  return (
    <AppTile title={tableTitle} rightElement={selfDelegateButton}>
      {table}
    </AppTile>
  )


  /*


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
  */
}

export default ProposalsList
