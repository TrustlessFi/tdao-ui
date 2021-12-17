import { Switch, Route } from 'react-router-dom'
import React, { FunctionComponent } from 'react'
import AppTile from '../library/AppTile'
import ProposalsList from './ProposalsList'
import ProposalDisplay from './ProposalDisplay'
import VoteDelegationPanel from './VoteDelegationPanel'

const Governance: FunctionComponent = () => {
  return (
    <Switch>
      <Route exact path={['/tcp']}>
        <ProposalsList />
      </Route>
      <Route path='/tcp/proposal/:proposalID'>
        <ProposalDisplay />
      </Route>
    </Switch>
  )
}

export default Governance
