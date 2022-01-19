import { useState } from "react"
import { useParams } from 'react-router';
import {
  waitForTDaoPositions,
  waitForTDaoInfo,
} from '../../slices/waitFor'
import {
  Dropdown,
  OnChangeData,
} from 'carbon-components-react'
import { TransactionType } from '../../slices/transactions'
import CreateTransactionButton from '../library/CreateTransactionButton'
import { useAppDispatch, useAppSelector as selector } from '../../app/hooks'
import TDaoPositionDisplay from '../library/TDaoPositionDisplay'
import Breadcrumbs from '../library/Breadcrumbs'
import InputPicker from '../library/InputPicker'
import { PositionUpdateOptions, getMultiplierForMonths } from './'
import { days, monthsToDays, timeS, getDateStringMS, invert, last } from '../../utils'
import TwoColumnDisplay from '../library/TwoColumnDisplay'
import LargeText from '../library/LargeText'
import ParagraphDivider from '../library/ParagraphDivider'
import SpacedList from '../library/SpacedList'

interface MatchParams {
  positionID: string
}

const TDaoPositionIncreaseLockTime = () => {
  const params: MatchParams = useParams()
  const dispatch = useAppDispatch()

  const positionID = Number(params.positionID)

  const positions = waitForTDaoPositions(selector, dispatch)
  const tdaoInfo = waitForTDaoInfo(selector, dispatch)
  const tdao =  selector((state) => state.chainID.tdao)

  const dataNull =
    positions === null ||
    tdaoInfo === null ||
    tdao === null

  const [ newDurationMonths, setNewDurationMonths ] = useState(48)

  const position = positions === null ? null : positions[positionID]

  let monthSelector = null

  const extensionOptions: number[] = []

  if (position !== null && tdaoInfo !== null) {
    for (
      let months = position.durationMonths + tdaoInfo.monthIncrements;
      months <= tdaoInfo.maxMonths;
      months += tdaoInfo.monthIncrements) {
      extensionOptions.push(months)
    }
    if (extensionOptions.length !== 0) {

      const extensionOptionsMap = Object.fromEntries(extensionOptions.map(op => [op, op + ' months']))

      monthSelector =
        <Dropdown
          ariaLabel="Dropdown"
          id="month_selector"
          items={Object.values(extensionOptionsMap)}
          onChange={(data: OnChangeData<string>) => {
            const selectedItem = data.selectedItem
            if (selectedItem) setNewDurationMonths(parseInt(invert(extensionOptionsMap)[selectedItem]))
          }}
          size="lg"
          initialSelectedItem={last(Object.values(extensionOptionsMap))}
          label="Month Selector"
          style={{width: 300}}
        />
    }
  }

  const isFailing = extensionOptions.length === 0

  const columnOne =
    <SpacedList>
      <InputPicker
        options={PositionUpdateOptions}
        initialValue={PositionUpdateOptions.IncreaseLockTime}
        navigation={{
          [PositionUpdateOptions.Delete]: `/positions/delete/${positionID}`
        }}
        width={300}
        label="TDao position update options"
        style={{}}
      />
      {monthSelector}
      <CreateTransactionButton
        disabled={isFailing}
        txArgs={{
          type: TransactionType.UpdateTDaoPositionLockDuration,
          durationMonths: newDurationMonths,
          positionID,
          tdao: tdao === null ? '' : tdao,
        }}
      />
    </SpacedList>

  const newUnlockTime = timeS() + days(monthsToDays(newDurationMonths))
  const unlockDateString = getDateStringMS(newUnlockTime * 1000)

  const columnTwo =
    extensionOptions.length === 0
    ? <LargeText>
        You are have the maximum lock time for {positionID} of 48 months.
        <ParagraphDivider />
        The multiplier on your underlying tokens is the maximum: 4x.
      </LargeText>
    : <LargeText>
        You are increasing the lock time for position {positionID} from {position === null ? '-' : position.durationMonths} months
        to {newDurationMonths} months. Your position will now be eligible for unlock
        on approximately {unlockDateString}.
        <ParagraphDivider />
        The multiplier on your underlying tokens will increase
        from {position === null ? '-' : getMultiplierForMonths(position.durationMonths)}x to
        {' '}{getMultiplierForMonths(newDurationMonths)}x.
      </LargeText>

  return (
    <>
      <Breadcrumbs crumbs={[{ text: 'Positions', href: '/positions' }, positionID.toString()]} />
      {position === null ? null : <TDaoPositionDisplay position={position} width={800} displayRewards={false} />}
      <TwoColumnDisplay
        columnOne={columnOne}
        columnTwo={columnTwo}
        loading={dataNull}
      />
    </>
  )

}

export default TDaoPositionIncreaseLockTime
