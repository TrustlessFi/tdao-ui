import { useState } from "react"
import LargeText from '../library/LargeText'
import { useAppDispatch, useAppSelector as selector } from '../../app/hooks'
import waitFor from '../../slices/waitFor'
import { numDisplay }  from '../../utils/'
import PositionMetadata from '../library/PositionMetadata'
import SpacedList from '../library/SpacedList'
import ErrorMessage, { reason } from '../library/ErrorMessage'
import { TransactionType } from '../../slices/transactions'
import CreateTransactionButton from '../library/CreateTransactionButton'
import TwoColumnDisplay from '../library/TwoColumnDisplay'
import {
  NumberInput,
  Dropdown,
  OnChangeData,
  Button,
} from 'carbon-components-react'
import Breadcrumbs from '../library/Breadcrumbs'
import InputPicker from '../library/InputPicker'
import { TokenAllocationOptions, getMultiplierForMonths } from './'
import {
  invert, onNumChange, last, range, notNullString, bnf, mnt,
  years, scale, getDateTimeStringMS,
  days, monthsToDays, getDateStringMS,
} from '../../utils'
import ParagraphDivider from '../library/ParagraphDivider'

const CreateTDaoAllocationPosition = () => {
  const dispatch = useAppDispatch()

  const {
    balances,
    contracts,
    tdao,
    tcpAllocation,
    currentChainInfo,
    userAddress,
  } = waitFor([
    'balances',
    'contracts',
    'tdao',
    'tcpAllocation',
    'currentChainInfo',
    'userAddress',
  ], selector, dispatch)

  // console.log({balances, contracts, tdaoInfo, tcpAllocationInfo, currentChainInfo, userAddress, tdao})

  const [ lockDurationMonths, setLockDurationMonths ] = useState(48)
  const [ count, setCount ] = useState(0)

  const dataNull =
    balances === null ||
    userAddress === null ||
    tdao === null ||
    tcpAllocation === null ||
    contracts === null

  const monthsToMonthsAndYears = (months: number): string => {
    const _months = months % 12
    const _years = (months - _months) / 12

    if (_months === 0) return _years + (_years === 1 ? ' year' : ' years')
    if (_years === 0) return `${_months} months`
    return `${_years} years ${_months} months`
  }

  const extensionOptionsMap = Object.fromEntries(
    (tdao === null
      ? [48]
      : range(tdao.minMonths, tdao.maxMonths, tdao.monthIncrements)
    ).map(op => [op, monthsToMonthsAndYears(op)]))

  const tcpToAllocate =
    tcpAllocation === null  || tcpAllocation.totalAllocation < tcpAllocation.tokensAllocated
      ? 0
      : tcpAllocation.totalAllocation - tcpAllocation.tokensAllocated

  const timeNow = currentChainInfo === null ? 0 : currentChainInfo.blockTimestamp

  const newUnlockTime = timeNow + days(monthsToDays(lockDurationMonths))
  const unlockDateString = getDateStringMS(newUnlockTime * 1000)

  const multiplier = getMultiplierForMonths(lockDurationMonths)

  const isLockDurationExceeded = () => {
    if (tcpAllocation === null) return true
    const ta = tcpAllocation
    // console.log({ta})

    /*
    const currentMinUnlockDuration = unscale(
      bnf(ta.minimumAverageTokensAllocatedxLockYears).mul(mnt(1)).div(mnt(ta.totalAllocation))
    )

    const currentUnlockDuration = unscale(
      bnf(ta.cumulativeTokensAllocatedxLockYears).mul(mnt(1)).div(mnt(ta.tokensAllocated))
    )
    */

    const yearsE18 = bnf(mnt(1)).mul(
      Math.floor((timeNow + years(parseFloat(multiplier))) - ta.startTime)
    ).div(years(1))

    // console.log({yearsE18: yearsE18.toString()})

    const newCumulativeLockYears =
      bnf(ta.cumulativeTokensAllocatedxLockYears).add(yearsE18.mul(mnt(count)).div(mnt(1)))

    const newTokensAllocated = mnt(ta.tokensAllocated + count)

    /*
    const newUnlockDuration = unscale(
      bnf(newCumulativeLockYears).mul(mnt(1)).div(newTokensAllocated)
    )
    */

    // console.log({currentMinUnlockDuration, currentUnlockDuration, newUnlockDuration})

    return (
      newCumulativeLockYears.mul(scale(ta.totalAllocation)).gt(
        bnf(ta.minimumAverageTokensAllocatedxLockYears).mul(newTokensAllocated)
      )
    )
  }

  const failures: { [key in string]: reason } = dataNull ? {} : {
    notEnoughTcp: {
      message: 'Not enough Tcp to allocate.',
      failing: balances === null || contracts === null ? false : count > tcpToAllocate,
    },
    noop: {
      message: 'Must lock Tcp',
      failing: isNaN(count) || count === 0,
      silent: true,
    },
    lockDurationTooShort: {
      message: 'Average lock duration is too short.',
      failing: !isLockDurationExceeded(),
    },
  }

  const failureReasons: reason[] = Object.values(failures)
  const isFailing = dataNull || failureReasons.filter(reason => reason.failing).length > 0

  const metadataItems = [
    {
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

  const columnOne = (
    <SpacedList>
      <>Block time {currentChainInfo === null ? '' : getDateTimeStringMS(currentChainInfo.blockTimestamp * 1000)}</>
      <InputPicker
        options={TokenAllocationOptions}
        initialValue={TokenAllocationOptions.LockTokens}
        navigation={{
          [TokenAllocationOptions.ClaimTokens]: '/positions/allocate/claim/tcp'
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
        max={tcpToAllocate}
        step={1e-3}
        size="lg"
        onChange={onNumChange((value: number) => setCount(value))}
        value={isNaN(count) ? "" : count }
        style={{}}
      />
      <Button
        kind='secondary'
        onClick={() => setCount(tcpToAllocate)}
        size='sm'
        style={{padding: '0 8px'}}
      >
        Allocate Max aTcp
      </Button>
      <PositionMetadata items={metadataItems} />
      <CreateTransactionButton
        style={{}}
        disabled={isFailing}
        txArgs={{
          type: TransactionType.CreateTDaoTcpAllocationPosition,
          tcpAllocation: contracts === null ? '' : contracts.TcpAllocation,
          count,
          decimals: 18,
          lockDurationMonths,
          userAddress: notNullString(userAddress),
        }}
      />
      <ErrorMessage reasons={failureReasons} />
    </SpacedList>
  )

  const columnTwo =
    <LargeText>
      You have {numDisplay(tcpToAllocate)} aTcp to allocate.
      <ParagraphDivider />
      aTcp tokens must be locked for an average of at least 1 year from the time they were granted.
      <ParagraphDivider />
      This position will have a TDao multiplier of {multiplier}x, meaning your locked Tcp tokens will
      accrue TDao rewards as if you had locked {numDisplay(count * parseFloat(multiplier))} Tcp.
    </LargeText>

  return (
    <>
      <Breadcrumbs crumbs={[{ text: 'Positions', href: '/positions' }, 'Allocate', 'Lock', 'Tcp' ]} />
      <TwoColumnDisplay
        columnOne={columnOne}
        columnTwo={columnTwo}
        loading={dataNull}
      />
    </>
  )
}

export default CreateTDaoAllocationPosition
