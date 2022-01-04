import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { v4 as getUid } from 'uuid'
import { getLocalStorage, timeMS } from '../../utils'
import { TransactionStatus, TransactionType } from '../transactions'
import { ChainID } from '@trustlessfi/addresses'

export interface notificationArgs {
  hash?: string
  status: TransactionStatus
  userAddress: string
  type: TransactionType
  chainID: ChainID
  message?: string
}

export interface notificationsInfo extends notificationArgs {
  startTimeMS: number,
  uid: string,
}

export type notificationsState = {[key in string]: notificationsInfo}

const initialState: notificationsState = {}

const name = 'notifications'

export const notificationsSlice = createSlice({
  name,
  initialState: getLocalStorage(name, initialState) as notificationsState,
  reducers: {
    addNotification: (state, action: PayloadAction<notificationArgs>) => {
      const args = action.payload
      const uid = getUid()
      state[uid] = { ...args, startTimeMS: timeMS(), uid }
    },
    notificationClosed: (state, action: PayloadAction<string>) => {
      const uid = action.payload
      return Object.fromEntries(Object.values(state).filter(notif => notif.uid !== uid).map(notif => [notif.uid, notif]))
    },
  }
})

export const { addNotification, notificationClosed } = notificationsSlice.actions

export default notificationsSlice.reducer
