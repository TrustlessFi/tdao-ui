import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { getLocalStorage } from '../../utils'

export enum WalletToken {
  TCP = 'TCP',
  TDao = 'TDao',
}

export type tokensAddedToWalletState = {[token in WalletToken]: {[chainID in number]: boolean}}

const initialState: tokensAddedToWalletState = {
  [WalletToken.TCP]: {},
  [WalletToken.TDao]: {}
}

const name = 'tokensAddedToWallet'

export const tokensAddedToWalletSlice = createSlice({
  name,
  initialState: getLocalStorage(name, initialState) as tokensAddedToWalletState,
  reducers: {
    tokenAddedToWallet: (state, action: PayloadAction<{ walletToken: WalletToken, chainID: number}>) => {
      state[action.payload.walletToken][action.payload.chainID] = true
    },
  }
})

export const { tokenAddedToWallet } = tokensAddedToWalletSlice.actions

export default tokensAddedToWalletSlice.reducer
