import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { getLocalStorage } from '../../utils'

export enum WalletToken {
  TCP = 'TCP',
  TDao = 'TDao',
}

export type tokensAddedToWalletState = {
  [token in WalletToken]: {
    [chainID in number]: {
      [address in string]: boolean
    }
  }
}

const initialState: tokensAddedToWalletState = {
  [WalletToken.TCP]: {},
  [WalletToken.TDao]: {},
}

interface walletTokenID {
  walletToken: WalletToken
  address: string
  chainID: number
}

const name = 'tokensAddedToWallet'

export const tokensAddedToWalletSlice = createSlice({
  name,
  initialState: getLocalStorage(name, initialState) as tokensAddedToWalletState,
  reducers: {
    tokenAddedToWallet: (state, action: PayloadAction<walletTokenID>) => {
      state[action.payload.walletToken][action.payload.chainID][action.payload.address] = true
    },
  }
})

export const { tokenAddedToWallet } = tokensAddedToWalletSlice.actions

export default tokensAddedToWalletSlice.reducer
