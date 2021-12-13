import { Switch, Route } from 'react-router-dom'
import IncreaseLockTime from './IncreaseLockTime'
import CreatePosition from './CreatePosition'
import ExistingPositions from './ExistingPositions'
import DeletePosition from './DeletePosition'

export enum PositionUpdateOptions {
  IncreaseLockTime = 'Increase Lock Time',
  Delete = 'Delete',
}

const Positions = () => (
  <Switch>
    <Route exact path={['/', '/positions']}>
      <ExistingPositions />
    </Route>
    <Route path='/positions/new'>
      <CreatePosition />
    </Route>
    <Route path='/positions/delete/:positionID'>
      <DeletePosition />
    </Route>
    <Route path='/positions/:positionID'>
      <IncreaseLockTime />
    </Route>
  </Switch>
)

export default Positions
