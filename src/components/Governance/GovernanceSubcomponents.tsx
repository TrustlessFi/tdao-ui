import { FunctionComponent } from 'react'
import { ProposalState } from '../../slices/proposals'
import { assertUnreachable } from '../../utils'
import { AppTag } from '../library/AppTag'
import { Tag, TagTypeName } from 'carbon-components-react';

export const ProposalDescription: FunctionComponent<{
  ipfsHash: string,
  fontSize?: number,
}> = ({ ipfsHash, fontSize = 14 }) => {
  // TODO switch to title, and always show the ipfs hash if it exists.
  return ipfsHash.length === 0
  ? <span style={{ fontSize }}>Description TBD</span>
  : <a
      href={`https://gateway.ipfs.io/ipfs/${ipfsHash}`}
      target='_blank'
      rel='noopener noreferrer'
      style={{ fontSize }}>
      Proposal Description
    </a>
}

const proposalStateToColor = (state: ProposalState): TagTypeName => {
  switch (state) {
    case ProposalState.Active:
      return 'blue'
    case ProposalState.Canceled:
      return 'red'
    case ProposalState.Succeeded:
      return 'green'
    case ProposalState.Queued:
      return 'teal'
    case ProposalState.Executed:
      return 'teal'
    case ProposalState.Pending:
    case ProposalState.Expired:
    case ProposalState.Defeated:
      return 'gray'
    default:
      assertUnreachable(state)
  }
  return 'gray'
}

const proposalStateToSelected = (state: ProposalState): boolean => {
  switch (state) {
    case ProposalState.Active:
    case ProposalState.Succeeded:
    case ProposalState.Queued:
    case ProposalState.Pending:
      return true
    case ProposalState.Canceled:
    case ProposalState.Defeated:
    case ProposalState.Executed:
    case ProposalState.Expired:
      return false
    default:
      assertUnreachable(state)
  }
  return false
}

export const InlineAppTag: FunctionComponent<{ proposalState: ProposalState }> = ({ proposalState }) => (
  <div style={{ display: 'inline' }}>
    <AppTag
      name={proposalState}
      color={proposalStateToColor(proposalState)}
      selected={proposalStateToSelected(proposalState)}
    />
  </div>
)
