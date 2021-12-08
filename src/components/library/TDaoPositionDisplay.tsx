import { CSSProperties, ReactNode } from "react";
import { Tile } from "carbon-components-react";
import ErrorBoundary from './ErrorBoundary'
import LargeText from '../utils/LargeText';
import { TDaoPosition } from '../../slices/tdaoPositions'

const TDaoPositionDisplay = ({
  position,
  width,
  onClick,
}: {
  position: TDaoPosition
  width: number
  onClick: (positionID: string) => void
} ) => {

  return (
    <img
      src={`data:image/svg+xml;base64,${Buffer.from(position.svg, 'binary').toString('base64')}`}
      width={width}
      style={{paddingRight: 16, paddingBottom: 16}}
      alt={`TDao Position ID ${position.nftTokenID}`}
      onClick={() => onClick(position.nftTokenID)}
    />
  )
}

TDaoPositionDisplay.defaultProps = {
  width: 500,
  onClick: (positionID: string) => {},
}




export default TDaoPositionDisplay
