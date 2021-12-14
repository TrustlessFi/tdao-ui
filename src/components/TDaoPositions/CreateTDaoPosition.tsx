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
import { TokenAllocationOptions, getMultiplierForMonths } from './'
import {
  invert, onNumChange, last, range, notNullNumber, notNullString,
  days, monthsToDays, timeS, getDateStringMS,
} from '../../utils'
import ParagraphDivider from '../utils/ParagraphDivider'

const CreateTDaoPosition = () => {
  const dispatch = useAppDispatch()

  const balances = waitForBalances(selector, dispatch)
  const contracts = waitForContracts(selector, dispatch)
  const tdaoInfo = waitForTDaoInfo(selector, dispatch)
  const tcpAllocationInfo = waitForTcpAllocationInfo(selector, dispatch)
  const userAddress = selector(state => state.wallet.address)
  const tdao = selector(state => state.chainID.tdao)

  const [ lockDurationMonths, setLockDurationMonths ] = useState(48)
  const [ count, setCount ] = useState(0)

  const dataNull =
    balances === null ||
    tdaoInfo === null ||
    userAddress === null ||
    tdao === null ||
    tcpAllocationInfo === null ||
    contracts === null

  const monthsToMonthsAndYears = (months: number): string => {
    const _months = months % 12
    const _years = (months - _months) / 12

    if (_months === 0) return _years + (_years === 1 ? ' year' : ' years')
    if (_years === 0) return `${_months} months`
    return `${_years} years ${_months} months`
  }

  const extensionOptionsMap = Object.fromEntries(
    (tdaoInfo === null
      ? [48]
      : range(tdaoInfo.minMonths, tdaoInfo.maxMonths, tdaoInfo.monthIncrements)
    ).map(op => [op, monthsToMonthsAndYears(op)]))

  const getTcpBalance = () =>
    balances === null || contracts === null
    ? 0
    : balances.tokens[contracts.Tcp].userBalance

  const failures: { [key in string]: reason } = dataNull ? {} : {
    notEnoughTcp: {
      message: 'Not enough Tcp.',
      failing: balances === null || contracts === null ? false : count > getTcpBalance(),
    },
    noop: {
      message: 'Must lock Tcp',
      failing: isNaN(count) || count == 0,
      silent: true,
    },
    lockDurationTooShort: {
      message: 'Lock duration is too short.',
      failing: true,
    },
  }

  const newUnlockTime = timeS() + days(monthsToDays(lockDurationMonths))
  const unlockDateString = getDateStringMS(newUnlockTime * 1000)

  const multiplier = getMultiplierForMonths(lockDurationMonths)

  const metadataItems = [
    {
      title: 'New Tcp balance',
      value: dataNull ? '-' : numDisplay(balances.tokens[contracts.Tcp].userBalance - count),
      failing: dataNull ? false : failures.notEnoughTcp.failing,
    },{
      title: 'Multiplier',
      value: multiplier + 'x',
    },{
      title: 'Lock Duration',
      value: monthsToMonthsAndYears(lockDurationMonths),
    },{
      title: 'Unlock Date',
      value: unlockDateString,
    },
  ]

  const failureReasons: reason[] = Object.values(failures)
  const isFailing = failureReasons.filter(reason => reason.failing).length > 0


  const columnOne =
    <SpacedList>
      <InputPicker
        options={TokenAllocationOptions}
        initialValue={TokenAllocationOptions.LockTokens}
        navigation={{
          [TokenAllocationOptions.ClaimTokens]: `/positions/claim/tcp`
        }}
        label="Allocation options"
        style={{}}
      />
      <Dropdown
        ariaLabel="Dropdown"
        id="month_selector"
        items={Object.values(extensionOptionsMap)}
        onChange={(data: OnChangeData<string>) => {
          const selectedItem = data.selectedItem
          if (selectedItem) setLockDurationMonths(parseInt(invert(extensionOptionsMap)[selectedItem]))
        }}
        size="lg"
        initialSelectedItem={last(Object.values(extensionOptionsMap))}
        label="Month Selector"
        style={{marginTop: 8}}
      />
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
      <PositionMetadata2 items={metadataItems} />
      <CreateTransactionButton
        style={{}}
        disabled={isFailing}
        txArgs={{
          type: TransactionType.CreateTDaoPosition,
          tdao: notNullString(tdao),
          tokenID: 0, // TODO make dynamic
          count,
          decimals: 18, // TODO make dynamic
          lockDurationMonths,
          userAddress: notNullString(userAddress),
          tokenSymbol: 'Tcp' // TODO make dynamic
        }}
      />
      <ErrorMessage reasons={failureReasons} />
    </SpacedList>


  const columnTwo =
    <LargeText>
      You have {numDisplay(getTcpBalance())} Tcp.
      <ParagraphDivider />
      All Tcp tokens must be claimed after an average of 1 year from the time the tokens were granted.
      <ParagraphDivider />
      The current average unlock time is 9 months from now, and the minimum average unlock time must
      exceed 6 months.
      <ParagraphDivider />
      You want to lock {numDisplay(count)} Tcp tokens for {extensionOptionsMap[lockDurationMonths]} months,
      changing the average unlock time to 11 months from now.
      <ParagraphDivider />
      This position will have a TDao multiplier of {multiplier}x, meaning your locked Tcp tokens will
      accrue TDao rewards as if you had locked {numDisplay(count * parseInt(multiplier))} Tcp for 1 year.
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
