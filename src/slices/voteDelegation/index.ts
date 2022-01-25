import { Contract } from 'ethers'
import { getMulticallContract } from '../../utils/getContract'
import {
  executeMulticalls,
  rc,
  manyContractOneFunctionMC,
} from '@trustlessfi/multicall'
import { zeroAddress } from '../../utils'
import getProvider from '../../utils/getProvider';
import protocolTokenArtifact from '@trustlessfi/artifacts/dist/contracts/core/tokens/ProtocolToken.sol/ProtocolToken.json'
import { thunkArgs, RootState } from '../fetchNodes'
import { createChainDataSlice, CacheDuration } from '../'
import { ProtocolToken } from '@trustlessfi/typechain'

export type voteDelegationInfo = {
  [tokenAddress in string]: string
}

const voteDelegationSlice = createChainDataSlice({
  name: 'voteDelegation',
  dependencies: ['rootContracts', 'contracts', 'userAddress', 'tdao'],
  stateSelector: (state: RootState) => state.voteDelegation,
  cacheDuration: CacheDuration.NONE,
  reducers: {
    clearVoteDelegation: (state) => {
      state.value = null
    },
  },
  thunkFunction:
    async (args: thunkArgs<'rootContracts' | 'contracts' | 'userAddress' | 'tdao' >) => {
      const provider = getProvider()
      const trustlessMulticall = getMulticallContract(args.rootContracts.trustlessMulticall)

      const protocolTokenContract = new Contract(zeroAddress, protocolTokenArtifact.abi, provider) as ProtocolToken

      const tokenAddresses =
        Object.values(args.tdao.underlyingProtocolTokens)
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
})

export const { clearVoteDelegation } = voteDelegationSlice.slice.actions

export default voteDelegationSlice
