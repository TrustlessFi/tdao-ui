import { PayloadAction } from '@reduxjs/toolkit'
import { createLocalSlice, CacheDuration } from '../'
import { RootState } from '../fetchNodes'

export type selectedTDaoPosition = string

const selectedTDaoPositionSlice = createLocalSlice({
  name: 'selectedTDaoPosition',
  initialState: '',
  stateSelector: (state: RootState) => state.selectedTDaoPosition,
  cacheDuration: CacheDuration.NONE,
  reducers: {
    positionIDSelected: (_state, action: PayloadAction<string>) => action.payload
  },
})

export const { positionIDSelected, } = selectedTDaoPositionSlice.slice.actions

export default selectedTDaoPositionSlice
