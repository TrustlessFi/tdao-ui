import { Switch, Route } from 'react-router-dom'
import TDaoPositionIncreaseLockTime from './TDaoPositionIncreaseLockTime'
import ExistingTDaoPositions from './ExistingTDaoPositions'
import DeleteTDaoPosition from './DeleteTDaoPosition'
import CreateTcpTDaoPosition from './CreateTcpTDaoPosition'

export enum PositionUpdateOptions {
  IncreaseLockTime = 'Increase Lock Time',
  Delete = 'Delete',
}

const Positions = () => (
  <Switch>
    <Route exact path={['/', '/positions']}>
      <ExistingTDaoPositions />
    </Route>
    <Route path='/positions/new'>
      <CreateTcpTDaoPosition />
    </Route>
    <Route path='/positions/delete/:positionID'>
      <DeleteTDaoPosition />
    </Route>
    <Route path='/positions/:positionID'>
      <TDaoPositionIncreaseLockTime />
    </Route>
  </Switch>
)

export default Positions
