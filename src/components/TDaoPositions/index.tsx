import { Switch, Route } from 'react-router-dom'
import TDaoPositionIncreaseLockTime from './TDaoPositionIncreaseLockTime'
import ExistingTDaoPositions from './ExistingTDaoPositions'
import DeleteTDaoPosition from './DeleteTDaoPosition'
import CreateTDaoAllocationPosition from './CreateTDaoAllocationPosition'
import CreateTDaoPosition from './CreateTDaoPosition'
import ClaimUnderlyingTokens from './ClaimUnderlyingTokens'
import { roundToXDecimals } from '../../utils'

export enum PositionUpdateOptions {
  IncreaseLockTime = 'Increase Lock Time',
  Delete = 'Delete',
}

export enum TokenAllocationOptions {
  LockTokens = 'Lock Tokens',
  ClaimTokens = 'Claim Tokens',
}

export const getMultiplierForMonths = (months: number) => {
  const multiplier = roundToXDecimals(months / 12, 2)
  return multiplier
}

const Positions = () => (
  <Switch>
    <Route exact path={['/', '/positions']}>
      <ExistingTDaoPositions />
    </Route>
    <Route path='/positions/allocate/lock/tcp'>
      <CreateTDaoAllocationPosition />
    </Route>
    <Route path='/positions/allocate/claim/tcp'>
      <ClaimUnderlyingTokens />
    </Route>
    <Route path='/positions/create/tcp'>
      <CreateTDaoPosition />
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
