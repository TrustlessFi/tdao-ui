import { useAppSelector as selector, } from '../../app/hooks'
import { Slice } from '@reduxjs/toolkit';
import { RootState } from '../../app/store'
import { minutes, timeS } from '../../utils/'
import { transactionsSlice, TransactionState } from '../../slices/transactions'
import { contractsSlice, ContractsState } from '../../slices/contracts'
import { tdaoInfoSlice, tdaoInfo } from '../../slices/tdaoInfo'
import { notificationsSlice, NotificationState } from '../../slices/notifications'
import { tokensAddedToWalletSlice, tokensAddedToWalletState } from '../../slices/tokensAddedToWallet'

type slicesState =
  TransactionState |
  ContractsState |
  NotificationState |
  tdaoInfo |
  tokensAddedToWalletState |
  null

type persistedSlice = {
  slice: Slice,
  ttl: number,
  getState: (state: RootState) => slicesState
}

type persistedSlices = {
  [key in keyof RootState]?: persistedSlice
}

const NO_EXPIRATION = -1
const SHORT_EXPIRATION = minutes(1)
const LONG_EXPIRATION = minutes(60)

export const slicesToPersist: persistedSlices = {

  // Simple slices
  [contractsSlice.name]: {
    slice: contractsSlice,
    ttl: LONG_EXPIRATION,
    getState: (state: RootState) => state.contracts
  },
  [notificationsSlice.name]: {
    slice: notificationsSlice,
    ttl: SHORT_EXPIRATION,
    getState: (state: RootState) => state.notifications
  },
  [transactionsSlice.name]: {
    slice: transactionsSlice,
    ttl: NO_EXPIRATION,
    getState: (state: RootState) => state.transactions
  },
  [tokensAddedToWalletSlice.name]: {
    slice: tokensAddedToWalletSlice,
    ttl: NO_EXPIRATION,
    getState: (state: RootState) => state.tokensAddedToWallet
  },

  // Slices with loadable state
  [tdaoInfoSlice.name]: {
    slice: tdaoInfoSlice,
    ttl: SHORT_EXPIRATION,
    getState: (state: RootState) => state.tdaoInfo.data.value
  },
}

const LocalStorageManager = () => {
  for (const [key, slice] of Object.entries(slicesToPersist)) {
    const sliceState = selector(slice.getState)
    if (sliceState === null) continue
    const year2120 = 4733539200
    const ttl = slice.ttl
    const expiration = ttl === NO_EXPIRATION ? year2120 : timeS() + ttl
    const stateWithTimestamp = { expiration, sliceState }
    localStorage.setItem(key, JSON.stringify(stateWithTimestamp))
  }
  return <></>
}

const permanentLocalStorage: string[] = [
  transactionsSlice.name,
  notificationsSlice.name,
  tokensAddedToWalletSlice.name,
]

export const clearEphemeralStorage = () => {
  Object.keys(slicesToPersist)
    .filter(sliceName => !permanentLocalStorage.includes(sliceName))
    .map(sliceName => localStorage.removeItem(sliceName))
}

export default LocalStorageManager
