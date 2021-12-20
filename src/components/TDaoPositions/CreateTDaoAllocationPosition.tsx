import { useState } from "react"
import LargeText from '../library/LargeText'
import { useAppDispatch, useAppSelector as selector } from '../../app/hooks'
import {
  waitForBalances,
  waitForContracts,
} from '../../slices/waitFor'
import { numDisplay }  from '../../utils/'
import PositionMetadata from '../library/PositionMetadata'
import SpacedList from '../library/SpacedList'
import ErrorMessage, { reason } from '../library/ErrorMessage'
import { TransactionType } from '../../slices/transactions'
import CreateTransactionButton from '../library/CreateTransactionButton'
import TwoColumnDisplay from '../library/TwoColumnDisplay'
import {
  waitForTDaoInfo,
  waitForTcpAllocationInfo,
} from '../../slices/waitFor'
import {
  NumberInput,
  Dropdown,
  OnChangeData,
} from 'carbon-components-react'
import Breadcrumbs from '../library/Breadcrumbs'
import InputPicker from '../library/InputPicker'
import { TokenAllocationOptions, getMultiplierForMonths } from './'
import {
  invert, onNumChange, last, range, notNullString, bnf, mnt,
  years, scale, unscale, getDateTimeStringMS,
  days, monthsToDays, getDateStringMS,
} from '../../utils'
import ParagraphDivider from '../library/ParagraphDivider'

const CreateTDaoAllocationPosition = () => {
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

  const tcpToAllocate =
    tcpAllocationInfo === null  || tcpAllocationInfo.totalAllocation < tcpAllocationInfo.tokensAllocated
      ? 0
      : tcpAllocationInfo.totalAllocation - tcpAllocationInfo.tokensAllocated

  const timeNow = tcpAllocationInfo === null ? 0 : tcpAllocationInfo.blockTime

  const newUnlockTime = timeNow + days(monthsToDays(lockDurationMonths))
  const unlockDateString = getDateStringMS(newUnlockTime * 1000)

  const multiplier = getMultiplierForMonths(lockDurationMonths)

  const isLockDurationExceeded = () => {
    if (tcpAllocationInfo === null) return true
    const ta = tcpAllocationInfo
    console.log({ta})




    const currentMinUnlockDuration = unscale(
      bnf(ta.minimumAverageTokensAllocatedxLockYears).mul(mnt(1)).div(mnt(ta.totalAllocation))
    )

    const currentUnlockDuration = unscale(
      bnf(ta.cumulativeTokensAllocatedxLockYears).mul(mnt(1)).div(mnt(ta.tokensAllocated))
    )











    const yearsE18 = bnf(mnt(1)).mul(
      Math.floor((timeNow + years(parseFloat(multiplier))) - ta.startTime)
    ).div(years(1))

    console.log({yearsE18: yearsE18.toString()})

    const newCumulativeLockYears =
      bnf(ta.cumulativeTokensAllocatedxLockYears).add(yearsE18.mul(mnt(count)).div(mnt(1)))

    const newTokensAllocated = mnt(ta.tokensAllocated + count)

    const newUnlockDuration = unscale(
      bnf(newCumulativeLockYears).mul(mnt(1)).div(newTokensAllocated)
    )

    console.log({currentMinUnlockDuration, currentUnlockDuration, newUnlockDuration})

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

  // const secondsToMonths = (seconds: number) => Math.round((seconds / years(1)) * 12)

  /*
  const durationString = (durationFromNow: number): string => {
    const duration = Math.abs(durationFromNow)

    const diff = secondsToMonths(duration)
    const result = diff + ' months'
    return (
      durationFromNow >= 0
      ? result + ' from now'
      : result + ' ago')
  }
  */

  const columnOne = (
    <SpacedList>
      <>Block time {tcpAllocationInfo === null ? '' : getDateTimeStringMS(tcpAllocationInfo.blockTime * 1000)}</>
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
        max={tcpAllocationInfo === null ? 0 : tcpAllocationInfo.totalAllocation - tcpAllocationInfo.tokensAllocated}
        step={1e-3}
        size="lg"
        onChange={onNumChange((value: number) => setCount(value))}
        value={isNaN(count) ? "" : count }
        style={{}}
      />
      <PositionMetadata items={metadataItems} />
      <CreateTransactionButton
        style={{}}
        disabled={isFailing}
        txArgs={{
          type: TransactionType.CreateTDaoAllocationPosition,
          tcpAllocation: contracts === null ? '' : contracts.TcpAllocation,
          count,
          lockDurationMonths,
          userAddress: notNullString(userAddress),
        }}
      />
      <ErrorMessage reasons={failureReasons} />
    </SpacedList>
  )

  const columnTwo =
    <LargeText>
      You have {numDisplay(tcpToAllocate)} Tcp to allocate.
      <ParagraphDivider />
      Tcp token allocations must be locked for an average of at least 1 year from the time they were granted.
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
