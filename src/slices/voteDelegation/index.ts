import { Contract } from 'ethers'
import { ContractsInfo } from '../contracts'
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { sliceState, initialState } from '../'
import { getGenericReducerBuilder } from '../'
import getContract, { getMulticallContract } from '../../utils/getContract'
import {
  executeMulticalls,
  rc,
  manyContractOneFunctionMC,
  oneContractManyFunctionMC,
  idToIdAndArg,
} from '@trustlessfi/multicall'
import { zeroAddress } from '../../utils'
import getProvider from '../../utils/getProvider';
import protocolTokenArtifact from '@trustlessfi/artifacts/dist/contracts/core/tokens/ProtocolToken.sol/ProtocolToken.json'
import { tdaoInfo } from '../tdaoInfo'

import { ProtocolToken } from '@trustlessfi/typechain'
import { TDaoRootContract } from '../contracts'

export type voteDelegationInfo = {
  tdao: string
  underlyingTokens: {[key in string]: string}
}

export interface voteDelegationState extends sliceState<voteDelegationInfo> {}

interface voteDelegationArgs {
  userAddress: string,
  trustlessMulticall: string
  tdao: string
  contracts: ContractsInfo
  tdaoInfo: tdaoInfo
}

export const getVoteDelegation = createAsyncThunk(
  'voteDelegation/getVoteDelegation',
  async (args: voteDelegationArgs): Promise<voteDelegationInfo> => {
    const provider = getProvider()
    const tdao = getContract(args.tdao, TDaoRootContract.TDao) as ProtocolToken
    const trustlessMulticall = getMulticallContract(args.trustlessMulticall)

    const protocolTokenContract = new Contract(zeroAddress, protocolTokenArtifact.abi, provider) as ProtocolToken

    const { tdaoDelegate, underlyingTokenDelegates } = await executeMulticalls(trustlessMulticall, {
      tdaoDelegate: oneContractManyFunctionMC(tdao,
        { delegates: rc.String },
        { delegates: [args.userAddress]}
      ),
      underlyingTokenDelegates: manyContractOneFunctionMC(
        protocolTokenContract,
        idToIdAndArg(Object.values(args.tdaoInfo.underlyingProtocolTokens).map(token => token.address)),
        'delegates',
        rc.String,
      )
    })

    return {
      tdao: tdaoDelegate.delegates,
      underlyingTokens: underlyingTokenDelegates
    }
  }
)

const name = 'voteDelegation'

export const voteDelegationSlice = createSlice({
  name,
  initialState: initialState as voteDelegationState,
  reducers: {
    clearVoteDelegation: (state) => {
      state.data.value = null
    },
  },
  extraReducers: (builder) => {
    builder = getGenericReducerBuilder(builder, getVoteDelegation)
  },
})

export const { clearVoteDelegation } = voteDelegationSlice.actions

export default voteDelegationSlice.reducer
