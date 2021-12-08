import { Contract } from 'ethers'
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { sliceState, initialState } from '../'
import { ContractsInfo } from '../contracts'
import { getGenericReducerBuilder } from '../'
import getContract, { getMulticallContract } from '../../utils/getContract'
import { getDuplicateFuncMulticall, executeMulticalls, rc, getMulticall, contractFunctionSelector, getDuplicateContractMulticall } from '@trustlessfi/multicall'
import { range, zeroAddress } from '../../utils'
import getProvider from '../../utils/getProvider';
import erc20Artifact from '@trustlessfi/artifacts/dist/@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json'


import { TDao } from '@trustlessfi/typechain'
import { TDaoRootContract } from '../contracts'

export interface tdaoInfo {
  lastPeriodGlobalInflationUpdated: number
  minMonths: number
  maxMonths: number
  monthIncrements: number
  countUnderlyingProtocolTokens: number
  startPeriod: number
  periodLength: number
  firstPeriod: number
  currentPeriod: number
  underlyingProtocolTokens: {
    [key in number]: {
      id: number
      address: string
      name: string
      symbol: string
      decimals: number
    }
  }
}

export interface tdaoInfoArgs {
  tdao: string,
  trustlessMulticall: string,
}

export interface TDaoInfoState extends sliceState<tdaoInfo> {}

const fetchTDaoInfo = async (args: tdaoInfoArgs): Promise<tdaoInfo> => {
  const tdao = getContract(args.tdao, TDaoRootContract.TDao) as TDao
  const trustlessMulticall = getMulticallContract(args.trustlessMulticall)
  const provider = getProvider()

  const { tdaoInfo } = await executeMulticalls(trustlessMulticall, {
    tdaoInfo: getMulticall(
      tdao,
      {
        lastPeriodGlobalInflationUpdated: rc.BigNumberToNumber,
        countUnderlyingProtocolTokens: rc.Number,
        startPeriod: rc.BigNumberToNumber,
        periodLength: rc.BigNumberToNumber,
        firstPeriod: rc.BigNumberToNumber,
        currentPeriod: rc.BigNumberToNumber,
      }
    ),
  })

  const tokenIDs = range(1, tdaoInfo.countUnderlyingProtocolTokens + 1)

  const { underlyingTokens } = await executeMulticalls(trustlessMulticall, {
    underlyingTokens: getDuplicateFuncMulticall(
      tdao,
      'idToToken',
      rc.String,
      Object.fromEntries(tokenIDs.map(tokenID => [tokenID.toString(), [tokenID]]))
    ),
  })

  const tokenContract = new Contract(zeroAddress, erc20Artifact.abi, provider)

  const tokens = Object.values(underlyingTokens)

  const tokenInfo = await executeMulticalls(
    trustlessMulticall,
    {
      symbol: getDuplicateContractMulticall(
        tokenContract,
        Object.fromEntries(tokens.map(address => [contractFunctionSelector(address as string, 'symbol'), rc.String])),
      ),
      name: getDuplicateContractMulticall(
        tokenContract,
        Object.fromEntries(tokens.map(address => [contractFunctionSelector(address as string, 'name'), rc.String])),
      ),
      decimals: getDuplicateContractMulticall(
        tokenContract,
        Object.fromEntries(tokens.map(address => [contractFunctionSelector(address as string, 'decimals'), rc.Number])),
      ),
    },
  )
  console.log({tokenInfo})

  return {
    lastPeriodGlobalInflationUpdated: tdaoInfo.lastPeriodGlobalInflationUpdated,
    minMonths: 6,
    maxMonths: 48,
    monthIncrements: 3,
    countUnderlyingProtocolTokens: tdaoInfo.countUnderlyingProtocolTokens,
    startPeriod: tdaoInfo.startPeriod,
    periodLength: tdaoInfo.periodLength,
    firstPeriod: tdaoInfo.firstPeriod,
    currentPeriod: tdaoInfo.currentPeriod,
    underlyingProtocolTokens:
      Object.fromEntries(tokenIDs.map(id => {
        const address = underlyingTokens[id.toString()]
        return [id, {
          id,
          address,
          symbol: tokenInfo.symbol[contractFunctionSelector(address, 'symbol')],
          name: tokenInfo.name[contractFunctionSelector(address, 'name')],
          decimals: tokenInfo.decimals[contractFunctionSelector(address, 'decimals')],
        }]
      }))
  }
}

export const getTDaoInfo = createAsyncThunk(
  'tdaoInfo/getTdaoInfo',
  async (data: tdaoInfoArgs) => await fetchTDaoInfo(data),
)

export const tdaoInfoSlice = createSlice({
  name: 'tdaoInfo',
  initialState: initialState as TDaoInfoState,
  reducers: {},
  extraReducers: (builder) => {
    builder = getGenericReducerBuilder(builder, getTDaoInfo)
  },
})

export default tdaoInfoSlice.reducer
