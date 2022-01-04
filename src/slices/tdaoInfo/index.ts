import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { sliceState, initialState } from '../'
import { getGenericReducerBuilder } from '../'
import getContract, { getMulticallContract } from '../../utils/getContract'
import {
  executeMulticalls,
  rc,
  oneContractManyFunctionMC,
  manyContractOneFunctionMC,
} from '@trustlessfi/multicall'
import { zeroAddress, addressToERC20 } from '../../utils'
import { PromiseType } from '@trustlessfi/utils'

import { TDao } from '@trustlessfi/typechain'
import { TDaoRootContract } from '../contracts'

export interface tdaoInfo {
  minMonths: number
  maxMonths: number
  monthIncrements: number
  countUnderlyingProtocolTokens: number
  startPeriod: number
  periodLength: number
  firstPeriod: number
  underlyingProtocolTokens: {
    [key in number]: {
      tokenID: number
      address: string
      name: string
      symbol: string
      decimals: number
    }
  }
}

export interface tdaoInfoState extends sliceState<tdaoInfo> {}

export const getTDaoInfo = createAsyncThunk(
  'tdaoInfo/getTDaoInfo',
  async (args: { tdao: string, trustlessMulticall: string }): Promise<tdaoInfo> => {
    const tdao = getContract(args.tdao, TDaoRootContract.TDao) as TDao
    const trustlessMulticall = getMulticallContract(args.trustlessMulticall)
    const tokenContract = addressToERC20(zeroAddress)

    const { tdaoInfo } = await executeMulticalls(trustlessMulticall, {
      tdaoInfo: oneContractManyFunctionMC(
        tdao,
        {
          countUnderlyingProtocolTokens: rc.BigNumberToNumber,
          startPeriod: rc.BigNumberToNumber,
          periodLength: rc.BigNumberToNumber,
          firstPeriod: rc.BigNumberToNumber,
          allTokens: (result: any) => result as PromiseType<ReturnType<TDao['allTokens']>>,
        }
      ),
    })

    const tokenAddresses = tdaoInfo.allTokens

    const { name, symbol, decimals } = await executeMulticalls(
      trustlessMulticall,
      {
        name: manyContractOneFunctionMC(tokenContract, tokenAddresses, 'name', rc.String),
        symbol: manyContractOneFunctionMC(tokenContract, tokenAddresses, 'symbol', rc.String),
        decimals: manyContractOneFunctionMC(tokenContract, tokenAddresses, 'decimals', rc.Number),
      },
    )


    return {
      minMonths: 6,
      maxMonths: 48,
      monthIncrements: 3,
      countUnderlyingProtocolTokens: tdaoInfo.countUnderlyingProtocolTokens,
      startPeriod: tdaoInfo.startPeriod,
      periodLength: tdaoInfo.periodLength,
      firstPeriod: tdaoInfo.firstPeriod,
      underlyingProtocolTokens:
        Object.fromEntries(tokenAddresses.map((address, tokenID) => {
          return [tokenID, {
            tokenID,
            address,
            symbol: symbol[address],
            name: name[address],
            decimals: decimals[address],
          }]
        }))
    }
  }
)

export const tdaoInfoSlice = createSlice({
  name: 'tdaoInfo',
  initialState: initialState as tdaoInfoState,
  reducers: {},
  extraReducers: (builder) => {
    builder = getGenericReducerBuilder(builder, getTDaoInfo)
  },
})

export default tdaoInfoSlice.reducer
