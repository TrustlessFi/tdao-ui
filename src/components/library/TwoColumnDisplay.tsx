import { ReactNode, FunctionComponent, CSSProperties } from "react"
import Breadcrumbs, { BreadcrumbItemType } from '../library/Breadcrumbs'
import RelativeLoading from '../library/RelativeLoading'
import { Row, Col } from 'react-flexbox-grid'
import useWindowWidth  from '../../hooks/useWindowWidth'

const TwoColumnDisplay: FunctionComponent<{
  columnOne: ReactNode
  columnTwo: ReactNode
  loading: boolean
  crumbs?: BreadcrumbItemType[]
  verticalAlignMiddle?: boolean
  style?: CSSProperties
}> = ({ columnOne, columnTwo, loading, crumbs, verticalAlignMiddle = true, style }) => {
  const isSmallViewport = useWindowWidth()

  const meat =
    <>
      <Col xs={4}>
        {columnOne}
      </Col>
      <Col xs={8}>
        {columnTwo}
      </Col>
    </>

  return (
    <div style={{position: 'relative', ...style}}>
      <Breadcrumbs crumbs={crumbs} />
      <RelativeLoading show={loading} />
      {
        isSmallViewport
        ? columnOne
        : (verticalAlignMiddle
            ? <Row middle='xs'>{meat}</Row>
            : <Row>{meat}</Row>
          )
      }
    </div>
  )
}

export default TwoColumnDisplay
