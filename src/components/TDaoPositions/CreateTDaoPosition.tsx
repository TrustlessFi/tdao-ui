import { useState } from "react"
import LargeText from '../utils/LargeText'
import Bold from '../utils/Bold'
import { useAppDispatch, useAppSelector as selector } from '../../app/hooks'
import {
  waitForBalances,
  waitForMarket,
  waitForRates,
  waitForPrices,
  waitForLiquidations,
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
  waitForTcpAllocationInfo,
} from '../../slices/waitFor'
import {
  TextAreaSkeleton,
  Button,
  NumberInput,
  Dropdown,
  OnChangeData,
} from 'carbon-components-react'
import TDaoPositionDisplay from '../library/TDaoPositionDisplay'
import Breadcrumbs from '../library/Breadcrumbs'
import InputPicker from '../library/InputPicker'
import { TokenAllocationOptions } from './'
import { invert, onNumChange, last, range, notNullNumber, notNullString } from '../../utils'
import ParagraphDivider from '../utils/ParagraphDivider'

const CreateTDaoPosition = () => {
  const dispatch = useAppDispatch()

  const balances = waitForBalances(selector, dispatch)
  const tdaoInfo = waitForTDaoInfo(selector, dispatch)
  const tcpAllocationInfo = waitForTcpAllocationInfo(selector, dispatch)
  const userAddress = selector(state => state.wallet.address)
  const tdao = selector(state => state.chainID.tdao)

  const [ newDurationMonths, setNewDurationMonths ] = useState(48)
  const [ count, setCount ] = useState(0)

  const dataNull =
    balances === null ||
    tdaoInfo === null ||
    userAddress === null ||
    tdao === null ||
    tcpAllocationInfo === null

  const extensionOptionsMap = Object.fromEntries(
    (tdaoInfo === null
      ? [48]
      : range(tdaoInfo.minMonths, tdaoInfo.maxMonths, tdaoInfo.monthIncrements)
    ).map(op => [op, op + ' months']))

  const monthSelector =
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

  const isFailing = true

  const columnOne =
    <SpacedList>
      <InputPicker
        options={TokenAllocationOptions}
        initialValue={TokenAllocationOptions.LockTokens}
        navigation={{
          [TokenAllocationOptions.ClaimTokens]: `/positions/claim/tcp`
        }}
        width={300}
        label="Allocation options"
        style={{}}
      />
      {monthSelector}
      <NumberInput
        hideSteppers
        id="Tcp Allocation Count Input"
        invalidText=""
        min={0}
        max={tcpAllocationInfo === null ? 0 : tcpAllocationInfo.totalAllocation - tcpAllocationInfo.tokensAllocated}
        step={1e-3}
        size="lg"
        onChange={onNumChange((value: number) => setCount(value))}
        value={isNaN(count) ? "" : count }
        style={{}}
      />
      <CreateTransactionButton
        style={{}}
        disabled={isFailing}
        txArgs={{
          type: TransactionType.CreateTDaoPosition,
          tdao: notNullString(tdao),
          tokenID: 0, // TODO make dynamic
          count,
          decimals: 18, // TODO make dynamic
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
      <Breadcrumbs crumbs={[{ text: 'Positions', href: '/positions' }, 'new', 'tcp' ]} />
      <TwoColumnDisplay
        columnOne={columnOne}
        columnTwo={columnTwo}
        loading={dataNull}
      />
    </>
  )
}

export default CreateTDaoPosition
