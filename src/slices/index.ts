import { SerializedError, AsyncThunk, Draft } from '@reduxjs/toolkit';
import { ActionReducerMapBuilder } from '@reduxjs/toolkit';

export interface sliceState<T> {
  loading: boolean
  error: SerializedError | null
  value: T | null
}

export const initialState: sliceState<any> = {
  loading: false,
  error: null,
  value: null,
}

export const getInitialStateCopy = <T>(): sliceState<T> => JSON.parse(JSON.stringify(initialState))

export const getStateWithValue = <T>(value: T | null): sliceState<T> => {
  const state = getInitialStateCopy<T>()
  state.value = value
  return state
}

export const getGenericReducerBuilder = <Args extends {}, Value>(
  builder: ActionReducerMapBuilder<sliceState<Value>>,
  thunk: AsyncThunk<Draft<Value>, Args, {}>,
): ActionReducerMapBuilder<any> =>  {
  // TODO replace any with sliceState<Value>
  return builder
    .addCase(thunk.pending, (state) => {
      state.loading = true
    })
    .addCase(thunk.rejected, (state, action) => {
      state.loading = false
      state.error = action.error
    })
    .addCase(thunk.fulfilled, (state, action) => {
      state.loading = false
      state.value = action.payload
    })
}
