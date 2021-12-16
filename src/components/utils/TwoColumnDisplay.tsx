import { ReactNode } from "react"
import Breadcrumbs, { BreadcrumbItemType } from '../library/Breadcrumbs'
import RelativeLoading from '../library/RelativeLoading'
import { Row, Col } from 'react-flexbox-grid'
import useWindowWidth  from '../../hooks/useWindowWidth'

const TwoColumnDisplay = ({
  columnOne,
  columnTwo,
  loading,
  crumbs,
}:{
  columnOne: ReactNode
  columnTwo: ReactNode
  loading: boolean
  crumbs?:  BreadcrumbItemType[]
}) => {
  const isSmallViewport = useWindowWidth()

  return (
    <div style={{position: 'relative'}}>
      <Breadcrumbs crumbs={crumbs} />
      <RelativeLoading show={loading} />
      {
        isSmallViewport
        ? columnOne
        : <Row middle='xs'>
            <Col xs={4}>
              {columnOne}
            </Col>
            <Col xs={8}>
              {columnTwo}
            </Col>
          </Row>
      }
    </div>
  )
}

export default TwoColumnDisplay
