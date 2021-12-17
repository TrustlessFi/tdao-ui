import { Switch, Route } from 'react-router-dom'
import { FunctionComponent } from 'react'
import ProposalsList from './ProposalsList'
import ProposalDisplay from './ProposalDisplay'

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
