import { addressToProtocolToken } from '../../../utils/'
import getContract from '../../../utils/getContract'
import { fetchProposals } from '../'
import { TcpGovernorAlpha } from '@trustlessfi/typechain'
import { ProtocolContract } from '../../contracts/ProtocolContract'
import { thunkArgs, RootState } from '../../fetchNodes'
import { CacheDuration, createChainDataSlice } from '../../'

export interface currentChainInfo {
  blockNumber: number
  blockTimestamp: number
  chainID: number
}

const tcpProposalsSlice = createChainDataSlice({
  name: 'tcpProposals',
  dependencies: ['rootContracts', 'contracts'],
  stateSelector: (state: RootState) => state.tcpProposals,
  cacheDuration: CacheDuration.NONE,
  thunkFunction:
    async (args: thunkArgs<'rootContracts' | 'contracts'>) => {
      return await fetchProposals(
        getContract(args.contracts.TcpGovernorAlpha, ProtocolContract.TcpGovernorAlpha) as TcpGovernorAlpha,
        addressToProtocolToken(args.contracts.Tcp),
        args.rootContracts.trustlessMulticall,
        0.005,
      )
    }
})

export default tcpProposalsSlice
