import { useState } from "react"
import LargeText from '../utils/LargeText'
import Bold from '../utils/Bold'
import { useAppDispatch, useAppSelector as selector } from '../../app/hooks'
import {
  waitForBalances,
  waitForContracts,
} from '../../slices/waitFor'
import { numDisplay }  from '../../utils/'
import PositionMetadata2 from '../library/PositionMetadata2'
import SpacedList from '../library/SpacedList'
import PositionNumberInput from '../library/PositionNumberInput'
import ErrorMessage, { reason } from '../library/ErrorMessage'
import { TransactionType } from '../../slices/transactions'
import CreateTransactionButton from '../utils/CreateTransactionButton'
import TwoColumnDisplay from '../utils/TwoColumnDisplay'
import { useParams } from 'react-router';
import {
  waitForTDaoPositions,
  waitForTDaoInfo,
} from '../../slices/waitFor'
import {
  TextAreaSkeleton,
  Button,
  Dropdown,
  OnChangeData,
} from 'carbon-components-react'
import TDaoPositionDisplay from '../library/TDaoPositionDisplay'
import Breadcrumbs from '../library/Breadcrumbs'
import InputPicker from '../library/InputPicker'
import { TokenAllocationOptions } from './'
import { days, monthsToDays, timeS, getDateStringMS, invert, roundToXDecimals, last, range, notNullString } from '../../utils'
import ParagraphDivider from '../utils/ParagraphDivider'

const ClaimUnderlyingTokens = () => {
  const dispatch = useAppDispatch()

  const balances = waitForBalances(selector, dispatch)
  const tdaoInfo = waitForTDaoInfo(selector, dispatch)
  const userAddress = selector(state => state.wallet.address)
  const tdao = selector(state => state.chainID.tdao)

  const [ newDurationMonths, setNewDurationMonths ] = useState(48)
  const [ count, setCount ] = useState(0)

  const dataNull =
    balances === null ||
    tdaoInfo === null ||
    userAddress === null ||
    tdao === null

  const extensionOptionsMap = Object.fromEntries(
    (tdaoInfo === null
      ? [48]
      : range(tdaoInfo.minMonths, tdaoInfo.maxMonths, tdaoInfo.monthIncrements)
    ).map(op => [op, op + ' months']))

  const isFailing = true

  const columnOne =
    <SpacedList>
      <InputPicker
        options={TokenAllocationOptions}
        initialValue={TokenAllocationOptions.ClaimTokens}
        navigation={{
          [TokenAllocationOptions.LockTokens]: '/positions/allocate/lock/tcp'
        }}
        width={300}
        label="Allocation options"
        style={{}}
      />
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
        style={{width: 300, marginTop: 8}}
      />
      <CreateTransactionButton
        style={{}}
        disabled={isFailing}
        txArgs={{
          type: TransactionType.CreateTDaoPosition,
          tdao: notNullString(tdao),
          tokenID: 0, // TODO make dynamic
          count: 0,
          decimals: 0,
          lockDurationMonths: newDurationMonths,
          userAddress: notNullString(userAddress),
          tokenSymbol: 'Tcp' // TODO make dynamic
        }}
      />
    </SpacedList>

  const columnTwo =
    <LargeText>
      strings and such
      <ParagraphDivider />
      wooooo
    </LargeText>

  return (
    <>
      <Breadcrumbs crumbs={[{ text: 'Positions', href: '/positions' }, 'claim', 'tcp' ]} />
      <TwoColumnDisplay
        columnOne={columnOne}
        columnTwo={columnTwo}
        loading={dataNull}
      />
    </>
  )
}

export default ClaimUnderlyingTokens
