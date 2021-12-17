import { FunctionComponent } from 'react'
import { ProposalState } from '../../slices/proposals'
import { AppTag } from '../library/AppTag'

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

export const InlineAppTag: FunctionComponent<{ proposalState: ProposalState }> = ({ proposalState }) => (
  <div style={{ display: 'inline' }}>
    <AppTag
      name={proposalState}
      // TODO map to more colors
      color={proposalState === ProposalState.Active ? 'blue' : 'gray'}
      selected
    />
  </div>
)
