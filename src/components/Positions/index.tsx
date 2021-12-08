import { Switch, Route } from 'react-router-dom'
import UpdatePosition from './UpdatePosition'
import CreatePosition from './CreatePosition'
import ExistingPositions from './ExistingPositions'

export enum PositionUpdateOptions {
  IncreaseLockTime = 'Increase Lock Time',
  Withdraw = 'Withdraw',
}

const Positions = () => (
  <Switch>
    <Route exact path={['/', '/positions']}>
      <ExistingPositions />
    </Route>
    <Route path='/positions/new'>
      <CreatePosition />
    </Route>
    <Route path='/positions/:positionID'>
      <UpdatePosition />
    </Route>
  </Switch>
)

export default Positions
