import { useState } from "react"
import { useParams } from 'react-router';
import {
  waitForTdaoPositions,
  waitForTdaoInfo,
} from '../../slices/waitFor'
import {
  TextAreaSkeleton,
  Button,
} from 'carbon-components-react'
import { useAppDispatch, useAppSelector as selector } from '../../app/hooks'
import TDaoPositionDisplay from '../library/TDaoPositionDisplay'
import Breadcrumbs from '../library/Breadcrumbs'

interface MatchParams {
  positionID: string
}

const UpdatePosition = () => {
  const params: MatchParams = useParams()
  const dispatch = useAppDispatch()

  const positionID = Number(params.positionID)

  const positions = waitForTdaoPositions(selector, dispatch)
  const tdaoInfo = waitForTdaoInfo(selector, dispatch)

  if (
    positions === null ||
    tdaoInfo === null
  ) return <>Loading</>

  const position = positions[positionID]

  console.log({positions, tdaoInfo})


  return (
    <>
      <Breadcrumbs crumbs={[{ text: 'Positions', href: '/positions' }, positionID.toString()]} />
      <TDaoPositionDisplay position={position} width={800} />
    </>
  )

}

export default UpdatePosition
