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
import PositionNumberInput from '../library/PositionNumberInput'
import ErrorMessage, { reason } from '../library/ErrorMessage'
import { TransactionType } from '../../slices/transactions'
import CreateTransactionButton from '../utils/CreateTransactionButton'
import TwoColumnDisplay from '../utils/TwoColumnDisplay'

const CreateTDaoPosition = () => {
  const dispatch = useAppDispatch()

  const balances = waitForBalances(selector, dispatch)

  return <>Todo create tdao position</>
}

export default CreateTDaoPosition
