import { CSSProperties, ReactNode } from "react"
import { Tile } from "carbon-components-react"
import ErrorBoundary from './ErrorBoundary'
import LargeText from '../utils/LargeText'
import Center from '../library/Center'
import { numDisplay } from '../../utils'
import { TDaoPosition } from '../../slices/tdaoPositions'

const TDaoPositionDisplay = ({
  position,
  width,
  onClick,
  displayRewards,
}: {
  position: TDaoPosition
  width: number
  onClick: (positionID: string) => void
  displayRewards: boolean
} ) => {

  return (
    <div style={{width}}>
      <img
        src={`data:image/svg+xml;base64,${Buffer.from(position.svg, 'binary').toString('base64')}`}
        width={width}
        alt={`TDao Position ID ${position.nftTokenID}`}
        onClick={() => onClick(position.nftTokenID)}
      />
      {
        displayRewards
        ? <Center style={{left: '0 auto', paddingTop: 8}}>
            <LargeText>
              Approximate Rewards: {numDisplay(position.approximateRewards)} TDao
            </LargeText>
          </Center>
        : null
      }
    </div>
  )
}

TDaoPositionDisplay.defaultProps = {
  width: 500,
  onClick: (positionID: string) => {},
  displayRewards: true
}




export default TDaoPositionDisplay
