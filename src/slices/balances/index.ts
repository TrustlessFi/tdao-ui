import { Contract, BigNumber } from 'ethers'
import { unscale, uint255Max, zeroAddress, unique } from '../../utils'
import erc20Artifact from '@trustlessfi/artifacts/dist/@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json'
import { getMulticallContract} from '../../utils/getContract'
import {
  executeMulticalls,
  rc,
  oneContractManyFunctionMC,
  manyContractOneFunctionMC,
} from '@trustlessfi/multicall'
import getProvider from '../../utils/getProvider'
import { ERC20 } from '@trustlessfi/typechain'
import { thunkArgs, RootState } from '../fetchNodes'
import { createChainDataSlice } from '../'
import { TDaoRootContract } from '../contracts/ProtocolContract'

export interface balances {
  userEthBalance: number
  tokens: {
    [tokenAddress: string]:  {
      token: {
        address: string,
        name: string,
        symbol: string,
        decimals: number,
      }
      userBalance: number
      approval: {
        [key in TDaoRootContract.TDao]: {
          allowance: string
          approving: boolean
          approved: boolean
        }
      }
      balances: {
        // [ProtocolContract.Accounting]: number
      }
    }
  }
}


const balancesSlice = createChainDataSlice({
  name: 'balances',
  dependencies: ['userAddress', 'rootContracts', 'contracts', 'tdao'],
  stateSelector: (state: RootState) => state.balances,
  reducers: {
    clearBalances: (state) => {
      state.value = null
    },
  },
  thunkFunction:
    async (args: thunkArgs<'userAddress' | 'rootContracts' | 'contracts' | 'tdao'>) => {
    const provider = getProvider()
    const multicall = getMulticallContract(args.rootContracts.trustlessMulticall)
    const tokenContract = new Contract(zeroAddress, erc20Artifact.abi, provider) as ERC20
    const userAddress = args.userAddress

    const tokenAddresses = unique(
      Object.values(args.tdao.underlyingProtocolTokens)
        .map(token => token.address)
          .concat([args.contracts.TDaoToken]))

    const {
      userEthBalance,
      userBalance,
      tdaoApprovals,
    } = await executeMulticalls(
      multicall,
      {
        userEthBalance: oneContractManyFunctionMC(
          multicall,
          { getEthBalance: rc.BigNumber },
          { getEthBalance: [args.userAddress] },
        ),
        userBalance: manyContractOneFunctionMC(
          tokenContract,
          Object.fromEntries(tokenAddresses.map(address => [address, [userAddress]])),
          'balanceOf',
          rc.BigNumber,
        ),
        tdaoApprovals: manyContractOneFunctionMC(
          tokenContract,
          Object.fromEntries(tokenAddresses.map(address => [address, [userAddress, args.rootContracts.tdao]])),
          'allowance',
          rc.BigNumber,
        ),
      }
    )

    const getApprovalFor = (value: BigNumber) => ({
      allowance: value.toString(),
      approving: false,
      approved: value.gt(uint255Max),
    })

    type poolTokensMetadata = {
      symbol: string
      name: string
      decimals: number
    }

    const tokenMetadataMap: {[key in string]: poolTokensMetadata} =
      Object.fromEntries(Object.values(args.tdao.underlyingProtocolTokens).map(token =>
        [
          token.address,
          {
            name: token.name,
            symbol: token.symbol,
            decimals: token.decimals,
          }
        ]
      )
    )

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
          userBalance: unscale(userBalance[address], decimals),
          approval: {
            [TDaoRootContract.TDao]: getApprovalFor(tdaoApprovals[address]),
          },
          balances: {
          }
        }]
      }))
    }
    }
})

export const { clearBalances } = balancesSlice.slice.actions

export default balancesSlice
