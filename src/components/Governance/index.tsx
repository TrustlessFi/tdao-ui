import React, { FunctionComponent } from 'react';
import AppTile from '../library/AppTile';
import ProposalsList from './ProposalsList';
import VoteDelegationPanel from './VoteDelegationPanel';

const Governance: FunctionComponent = () => {
  return (
    <>
      <ProposalsList />
    </>
  );
}

export default Governance;
