import { useState } from "react"
import { useParams } from 'react-router';
import {
  waitForTdaoPositions,
  waitForTdaoInfo,
} from '../../slices/waitFor'
import { TransactionType } from '../../slices/transactions'
import CreateTransactionButton from '../utils/CreateTransactionButton'
import { useAppDispatch, useAppSelector as selector } from '../../app/hooks'
import TDaoPositionDisplay from '../library/TDaoPositionDisplay'
import Breadcrumbs from '../library/Breadcrumbs'
import InputPicker from '../library/InputPicker'
import { PositionUpdateOptions } from './'
import TwoColumnDisplay from '../utils/TwoColumnDisplay'
import LargeText from '../utils/LargeText'
import ParagraphDivider from '../utils/ParagraphDivider'

interface MatchParams {
  positionID: string
}

const DeletePosition = () => {
  const params: MatchParams = useParams()
  const dispatch = useAppDispatch()

  const positionID = params.positionID

  const positions = waitForTdaoPositions(selector, dispatch)
  const tdaoInfo = waitForTdaoInfo(selector, dispatch)
  const tdao =  selector((state) => state.chainID.tdao)

  console.log({positions, tdaoInfo})

  const dataNull =
    positions === null ||
    tdaoInfo === null ||
    tdao === null

  const position = positions === null ? null : positions[positionID]

  const columnOne =
    <>
      <InputPicker
        options={PositionUpdateOptions}
        initialValue={PositionUpdateOptions.Delete}
        navigation={{
          [PositionUpdateOptions.IncreaseLockTime]: `/positions/${positionID}`
        }}
        width={300}
        label="TDao position update options"
        style={{}}
      />
      <CreateTransactionButton
        style={{marginTop: 8}}
        disabled={position === null || !position.canBeUnlocked }
        title={"Delete position " + positionID}
        txArgs={{
          type: TransactionType.UnlockTDaoPosition,
          positionID,
          tdao: tdao === null ? '' : tdao,
        }}
      />
    </>

  const columnTwo =
    position?.canBeUnlocked
    ? <LargeText>
        You will unlock {position === null ? '-' : position.count} tokens from position {positionID}.
        <ParagraphDivider />
        All unclaimed TDao rewards will be claimed, but this position will be deleted forever and
        will never accrue additional TDao rewards.
      </LargeText>
    : <LargeText>
        Position {positionID} can not be deleted because the lock duration is not complete.
      </LargeText>

  return (
    <>
      <Breadcrumbs crumbs={[{ text: 'Positions', href: '/positions' }, positionID.toString(), 'delete']} />
      {position === null ? null : <TDaoPositionDisplay position={position} width={800} />}
      <TwoColumnDisplay
        columnOne={columnOne}
        columnTwo={columnTwo}
        loading={dataNull}
      />
    </>
  )

}

export default DeletePosition
