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
  waitForCurrentChainInfo,
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
  invert, onNumChange, last, range, notNullString,
  days, monthsToDays, getDateStringMS, first,
} from '../../utils'
import ParagraphDivider from '../library/ParagraphDivider'

const CreateTDaoAllocationPosition = () => {
  const dispatch = useAppDispatch()

  const balances = waitForBalances(selector, dispatch)
  const contracts = waitForContracts(selector, dispatch)
  const tdaoInfo = waitForTDaoInfo(selector, dispatch)
  const currentChainInfo = waitForCurrentChainInfo(selector, dispatch)
  const userAddress = selector(state => state.wallet.address)
  const tdao = selector(state => state.chainID.tdao)

  const [ lockDurationMonths, setLockDurationMonths ] = useState(48)
  const [ count, setCount ] = useState(0)

  const dataNull =
    balances === null ||
    tdaoInfo === null ||
    userAddress === null ||
    tdao === null ||
    currentChainInfo === null ||
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

  const tcpToLock =
    contracts === null || balances === null
      ? 0
      : balances.tokens[contracts.Tcp].userBalance

  const timeNow = currentChainInfo === null ? 0 : currentChainInfo.blockTimestamp

  const newUnlockTime = timeNow + days(monthsToDays(lockDurationMonths))
  const unlockDateString = getDateStringMS(newUnlockTime * 1000)

  const multiplier = getMultiplierForMonths(lockDurationMonths)

  const failures: { [key in string]: reason } = dataNull ? {} : {
    notEnoughTcp: {
      message: 'Not enough Tcp.',
      failing: balances === null || contracts === null ? false : count > tcpToLock,
    },
    noop: {
      message: 'Must lock Tcp',
      failing: isNaN(count) || count === 0,
      silent: true,
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
        id="Tcp Count Input"
        invalidText=""
        min={0}
        max={tcpToLock}
        step={1e-3}
        size="lg"
        onChange={onNumChange((value: number) => setCount(value))}
        value={isNaN(count) ? "" : count }
        style={{}}
      />
      <PositionMetadata items={metadataItems} />
      {
        balances === null || contracts === null || !balances.tokens[contracts.Tcp].approval.TDao.approved
        ? <CreateTransactionButton
            shouldOpenTxTab={false}
            style={{}}
            title="Approve Tcp"
            disabled={isFailing || balances === null || contracts === null}
            txArgs={{
              type: TransactionType.ApproveToken,
              tokenAddress: balances === null || contracts === null ? '' : balances.tokens[contracts.Tcp].token.address,
              tokenSymbol: balances === null || contracts === null ? '' : balances.tokens[contracts.Tcp].token.symbol,
              spenderAddress: notNullString(tdao),
              spenderName: 'TDao'
            }}
          />
        : <CreateTransactionButton
            style={{}}
            disabled={isFailing || dataNull}
            title="Create Position"
            txArgs={{
              type: TransactionType.CreateTDaoPosition,
              tdao: notNullString(tdao),
              tokenID:
                tdaoInfo === null || contracts === null
                ? 0
                : first(Object.values(tdaoInfo.underlyingProtocolTokens).filter(u => u.address === contracts.Tcp)).tokenID,
              count,
              decimals: 18,
              lockDurationMonths,
              userAddress: notNullString(userAddress),
              tokenSymbol: 'Tcp'
            }}
          />
      }
      <ErrorMessage reasons={failureReasons} />
    </SpacedList>
  )

  const columnTwo =
    <LargeText>
      You have {numDisplay(tcpToLock)} Tcp to lock.
      <ParagraphDivider />
      This position will have a TDao multiplier of {multiplier}x, meaning your locked Tcp tokens will
      accrue TDao rewards as if you had locked {numDisplay(count * parseFloat(multiplier))} Tcp.
    </LargeText>

  return (
    <>
      <Breadcrumbs crumbs={[{ text: 'Positions', href: '/positions' }, 'Create', 'Tcp' ]} />
      <TwoColumnDisplay
        columnOne={columnOne}
        columnTwo={columnTwo}
        loading={dataNull}
      />
    </>
  )
}

export default CreateTDaoAllocationPosition
