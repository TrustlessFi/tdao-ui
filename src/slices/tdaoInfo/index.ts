import { Contract } from 'ethers'
import { createAsyncThunk, createSlice, AsyncThunk } from '@reduxjs/toolkit'
import { sliceState, initialState } from '../'
import { getGenericReducerBuilder } from '../'
import getContract, { getMulticallContract } from '../../utils/getContract'
import {
  executeMulticalls,
  rc,
  getMulticall,
  contractFunctionSelector,
  getDuplicateContractMulticall,
  getDuplicateFuncMulticall
} from '@trustlessfi/multicall'
import { zeroAddress } from '../../utils'
import getProvider from '../../utils/getProvider';
import erc20Artifact from '@trustlessfi/artifacts/dist/@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json'
import { PromiseType } from '@trustlessfi/utils'
import { FetchNode, fetchNodeTypes } from '../waitFor'


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
      tokenID: number
      address: string
      name: string
      symbol: string
      decimals: number
      rs: {
        cumulativeVirtualCount: string
        totalRewards: string
      }
    }
  }
}

export interface TDaoInfoState extends sliceState<tdaoInfo> {}

type dep<Dep extends keyof fetchNodeTypes> = Dep

/*
export const getTDaoInfo:
{
  dependencies: dep<'TDao' | 'TrustlessMulticall'>,
  actual: AsyncThunk<tdaoInfo, Pick<fetchNodeTypes, dep<'TDao' | 'TrustlessMulticall'>>, {}>
} = {
  dependencies: 'TDao',
  actual: createAsyncThunk(
  'tdaoInfo/getTdaoInfo',
*/

export const getTDaoInfo = createAsyncThunk(
  'tdaoInfo/getTDaoInfo',
  async (args: { TDao: string, TrustlessMulticall: string }): Promise<tdaoInfo> => {
    const tdao = getContract(args.TDao, TDaoRootContract.TDao) as TDao
    const trustlessMulticall = getMulticallContract(args.TrustlessMulticall)
    const provider = getProvider()

    const { tdaoInfo } = await executeMulticalls(trustlessMulticall, {
      tdaoInfo: getMulticall(
        tdao,
        {
          lastPeriodGlobalInflationUpdated: rc.BigNumberToNumber,
          countUnderlyingProtocolTokens: rc.BigNumberToNumber,
          startPeriod: rc.BigNumberToNumber,
          periodLength: rc.BigNumberToNumber,
          firstPeriod: rc.BigNumberToNumber,
          currentPeriod: rc.BigNumberToNumber,
          allTokens: (result: any) => result as PromiseType<ReturnType<TDao['allTokens']>>,
        }
      ),
    })

    const tokenContract = new Contract(zeroAddress, erc20Artifact.abi, provider)

    const tokens = tdaoInfo.allTokens

    const getRewardsStatusID = (id: number) => id + 'rewardsStatus'

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
        rewardsStatus: getDuplicateFuncMulticall(
          tdao,
          'getRewardsStatus',
          (result: any) => result as PromiseType<ReturnType<TDao['getRewardsStatus']>>,
          Object.fromEntries(tokens.map((_address, id) => [getRewardsStatusID(id), [id]]))
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
        Object.fromEntries(tokens.map((address, tokenID) => {
          return [tokenID, {
            tokenID,
            address,
            symbol: tokenInfo.symbol[contractFunctionSelector(address, 'symbol')],
            name: tokenInfo.name[contractFunctionSelector(address, 'name')],
            decimals: tokenInfo.decimals[contractFunctionSelector(address, 'decimals')],
            rs: {
              cumulativeVirtualCount:
                tokenInfo.rewardsStatus[getRewardsStatusID(tokenID)].cumulativeVirtualCount.toString(),
              totalRewards:
                tokenInfo.rewardsStatus[getRewardsStatusID(tokenID)].totalRewards.toString(),
            }
          }]
        }))
    }
  }
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
