import { Switch, Route } from 'react-router-dom'
import TDaoPositionIncreaseLockTime from './TDaoPositionIncreaseLockTime'
import ExistingTDaoPositions from './ExistingTDaoPositions'
import DeleteTDaoPosition from './DeleteTDaoPosition'
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
    <Route path='/positions/new/tcp'>
      <CreateTDaoPosition />
    </Route>
    <Route path='/positions/claim/tcp'>
      <ClaimUnderlyingTokens />
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
