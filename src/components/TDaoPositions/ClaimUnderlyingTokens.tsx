import { useState } from "react"
import LargeText from '../library/LargeText'
import { useAppDispatch, useAppSelector as selector } from '../../app/hooks'
import waitFor from '../../slices/waitFor'
import SpacedList from '../library/SpacedList'
import { TransactionType } from '../../slices/transactions'
import CreateTransactionButton from '../library/CreateTransactionButton'
import TwoColumnDisplay from '../library/TwoColumnDisplay'
import {
  NumberInput,
} from 'carbon-components-react'
import Breadcrumbs from '../library/Breadcrumbs'
import InputPicker from '../library/InputPicker'
import { TokenAllocationOptions } from './'
import { notNullString, onNumChange, numDisplay } from '../../utils'
import ParagraphDivider from '../library/ParagraphDivider'

const ClaimUnderlyingTokens = () => {
  const dispatch = useAppDispatch()

  const {
    contracts,
    userAddress,
    tcpAllocation,
  } = waitFor([
    'contracts',
    'userAddress',
    'tcpAllocation',
  ], selector, dispatch)

  const [ count, setCount ] = useState(0)

  const dataNull =
    contracts === null ||
    userAddress === null ||
    tcpAllocation === null

  const tcpToAllocate =
    tcpAllocation === null  || tcpAllocation.totalAllocation < tcpAllocation.tokensAllocated
      ? 0
      : tcpAllocation.totalAllocation - tcpAllocation.tokensAllocated


  const isFailing = dataNull

  const columnOne =
    <SpacedList>
        <InputPicker
          options={TokenAllocationOptions}
          initialValue={TokenAllocationOptions.ClaimTokens}
          navigation={{
            [TokenAllocationOptions.LockTokens]: '/positions/allocate/lock/tcp'
          }}
          label="Allocation options"
          style={{minWidth: 180}}
        />
      <NumberInput
        hideSteppers
        id="Tcp Allocation Count Input"
        invalidText=""
        min={0}
        max={tcpAllocation === null ? 0 : tcpAllocation.totalAllocation - tcpAllocation.tokensAllocated}
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
          type: TransactionType.ClaimTcpTokenAllocationImmediately,
          tcpAllocation: contracts === null ? '' : contracts.TcpAllocation,
          count,
          decimals: 18,
          userAddress: notNullString(userAddress),
        }}
      />
    </SpacedList>

  const columnTwo =
    <LargeText>
      You have {numDisplay(tcpToAllocate)} aTcp to allocate.
      <ParagraphDivider />
      Tcp token allocations must be claimed after waiting at least 1 year on average.
      <ParagraphDivider />
      If you would like to lock Tcp on chain and earn TDao instead, select Lock Tokens from the dropdown.
    </LargeText>

  return (
    <>
      <Breadcrumbs crumbs={[{ text: 'Positions', href: '/positions' }, 'Claim', 'Tcp' ]} />
      <TwoColumnDisplay
        columnOne={columnOne}
        columnTwo={columnTwo}
        loading={dataNull}
      />
    </>
  )
}

export default ClaimUnderlyingTokens
