import { sliceState } from '../'
import { Contract } from 'ethers'
import { initialState, getGenericReducerBuilder } from '../'
import { tdaoInfo } from '../tdaoInfo'
import { unscale, uint255Max, zeroAddress } from '../../utils'
import erc20Artifact from '@trustlessfi/artifacts/dist/@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json'
import { TDaoRootContract, ContractsInfo } from '../contracts'
import { getMulticallContract} from '../../utils/getContract'
import {
  executeMulticalls,
  rc,
  getCustomMulticall,
  getFullSelector,
  getMulticall,
} from '@trustlessfi/multicall'
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import getProvider from '../../utils/getProvider'
import { ERC20 } from '@trustlessfi/typechain'

export interface tokenInfo {
  address: string,
  name: string,
  symbol: string,
  decimals: number,
}

type balances = {
}

export interface approval {
  allowance: string
  approving: boolean
  approved: boolean
}

interface approvals {
  [TDaoRootContract.TDao]: approval
}

type tokenBalances = {
  [key in string]:  {
    token: tokenInfo
    userBalance: number
    approval: approvals
    balances: balances
  }
}

export interface balancesInfo {
  userEthBalance: number
  tokens: tokenBalances
}

export interface balanceState extends sliceState<balancesInfo> {}

export interface balanceArgs {
  userAddress: string,
  trustlessMulticall: string,
  tdao: string,
  contracts: ContractsInfo
  tdaoInfo: tdaoInfo
}

export const getBalances = createAsyncThunk(
  'balances/getBalances',
  async (
    args: balanceArgs,
  ): Promise<balancesInfo> => {
    const provider = getProvider()
    const multicall = getMulticallContract(args.trustlessMulticall)
    const tokenContract = new Contract(zeroAddress, erc20Artifact.abi, provider) as ERC20
    const userAddress = args.userAddress

    const tokenAddresses = [args.contracts.TDaoToken]
    Object.values(args.tdaoInfo.underlyingProtocolTokens).map(token => {
      if (!tokenAddresses.includes(token.address)) tokenAddresses.push(token.address)
    })

    const {
      userEthBalance,
      userBalance,
      tdaoApprovals,
    } = await executeMulticalls(
      multicall,
      {
        userEthBalance: getMulticall(
          multicall,
          { getEthBalance: rc.BigNumber },
          { getEthBalance: [args.userAddress] },
        ),
        userBalance: getCustomMulticall(
          tokenContract,
          Object.fromEntries(
            tokenAddresses.map(address => [getFullSelector(tokenContract, address, 'balanceOf', [userAddress]), rc.BigNumber]
          )
        )),
        tdaoApprovals: getCustomMulticall(
          tokenContract,
          Object.fromEntries(
            tokenAddresses.map(address => [getFullSelector(tokenContract, address, 'allowance', [userAddress, args.tdao]), rc.BigNumber]
          )
        )),
        /*
        allSymbols: getDuplicateContractMulticall(
          tokenContract,
          Object.fromEntries(tokenAddresses.map(address => [contractFunctionSelector(address as string, 'symbol'), rc.String])),
        ),
        allNames: getDuplicateContractMulticall(
          tokenContract,
          Object.fromEntries(tokenAddresses.map(address => [contractFunctionSelector(address as string, 'name'), rc.String])),
        ),
        allDecimals: getDuplicateContractMulticall(
          tokenContract,
          Object.fromEntries(tokenAddresses.map(address => [contractFunctionSelector(address as string, 'decimals'), rc.Number])),
        ),
        */
        /*
        accountingBalance: getCustomMulticall(
          tokenContract,
          Object.fromEntries(
            tokenAddresses.map(address => [getFullSelector(tokenContract, address, 'balanceOf', [args.contracts.Accounting]), rc.BigNumber]
          )
        ))
        */
      }
    )

    const getApprovalFor = (pc: TDaoRootContract.TDao, tokenAddress: string) => {
      const value =
        tdaoApprovals[getFullSelector(tokenContract, tokenAddress, 'allowance', [userAddress, args.tdao])]

      return {
        allowance: value.toString(),
        approving: false,
        approved: value.gt(uint255Max),
      }
    }

    type poolTokensMetadata = {
      symbol: string
      name: string
      decimals: number
    }

    const tokenMetadataMap: {[key in string]: poolTokensMetadata} = {}

    Object.values(args.tdaoInfo.underlyingProtocolTokens).map(token => {
      tokenMetadataMap[token.address] = {
        name: token.name,
        symbol: token.symbol,
        decimals: token.decimals,
      }
    })

    tokenMetadataMap[args.contracts.TDaoToken] = {
      name: 'TDao Token',
      symbol: 'TDao',
      decimals: 18,
    }
    tokenMetadataMap[args.contracts.Tcp] = {
      name: 'Trustless Currency Protocol',
      symbol: 'Tcp',
      decimals: 18,
    }

    return {
      userEthBalance: unscale(userEthBalance.getEthBalance),
      tokens: Object.fromEntries(tokenAddresses.map(address => {
        const decimals = tokenMetadataMap[address].decimals

        return [address, {
          token: {
            address,
            name: tokenMetadataMap[address].name,
            symbol: tokenMetadataMap[address].symbol,
            decimals,
          },
          userBalance: unscale(userBalance[getFullSelector(tokenContract, address, 'balanceOf', [userAddress])], decimals),
          approval: {
            [TDaoRootContract.TDao]: getApprovalFor(TDaoRootContract.TDao, address),
          },
          balances: {
          }
        }]
      }))
    }
  }
)

const name = 'balances'

export const balancesSlice = createSlice({
  name,
  initialState: initialState as balanceState,
  reducers: {
    clearBalances: (state) => {
      state.data.value = null
    },
  },
  extraReducers: (builder) => {
    builder = getGenericReducerBuilder(builder, getBalances)
  },
})

export const { clearBalances } = balancesSlice.actions

export default balancesSlice.reducer
