import { Contract } from 'ethers'
import { ContractsInfo } from '../contracts'
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { sliceState, initialState } from '../'
import { getGenericReducerBuilder } from '../'
import { getMulticallContract } from '../../utils/getContract'
import {
  executeMulticalls,
  rc,
  manyContractOneFunctionMC,
} from '@trustlessfi/multicall'
import { zeroAddress } from '../../utils'
import getProvider from '../../utils/getProvider';
import protocolTokenArtifact from '@trustlessfi/artifacts/dist/contracts/core/tokens/ProtocolToken.sol/ProtocolToken.json'
import { tdaoInfo } from '../tdaoInfo'

import { ProtocolToken } from '@trustlessfi/typechain'

export type voteDelegationInfo = {
  [key in string]: string
}

export interface voteDelegationState extends sliceState<voteDelegationInfo> {}

interface voteDelegationArgs {
  userAddress: string,
  trustlessMulticall: string
  contracts: ContractsInfo
  tdaoInfo: tdaoInfo
}

export const getVoteDelegation = createAsyncThunk(
  'voteDelegation/getVoteDelegation',
  async (args: voteDelegationArgs): Promise<voteDelegationInfo> => {
    const provider = getProvider()
    const trustlessMulticall = getMulticallContract(args.trustlessMulticall)

    const protocolTokenContract = new Contract(zeroAddress, protocolTokenArtifact.abi, provider) as ProtocolToken

    const tokenAddresses =
      Object.values(args.tdaoInfo.underlyingProtocolTokens)
        .map(token => token.address)
          .concat([args.contracts.TDaoToken])

    const { delegates } = await executeMulticalls(trustlessMulticall, {
      delegates: manyContractOneFunctionMC(
        protocolTokenContract,
        Object.fromEntries(tokenAddresses.map(address => [address, [args.userAddress]])),
        'delegates',
        rc.String,
      )
    })

    return delegates
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
