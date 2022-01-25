import { addressToProtocolToken } from '../../../utils/'
import getContract from '../../../utils/getContract'
import { fetchProposalsVoterInfo } from '../'
import { TcpGovernorAlpha } from '@trustlessfi/typechain'
import { ProtocolContract } from '../../contracts/ProtocolContract'
import { thunkArgs, RootState } from '../../fetchNodes'
import { CacheDuration, createChainDataSlice } from '../../'

const tcpProposalsVoterInfoSlice = createChainDataSlice({
  name: 'tcpProposalsVoterInfo',
  dependencies: ['rootContracts', 'contracts', 'userAddress'],
  stateSelector: (state: RootState) => state.tcpProposalsVoterInfo,
  cacheDuration: CacheDuration.NONE,
  reducers: {
    clearTcpProposalsVoterInfo: (state) => {
      state.value = null
    },
  },
  thunkFunction:
    async (args: thunkArgs<'rootContracts' | 'contracts' | 'userAddress'>) => {
      return await fetchProposalsVoterInfo(
        args.userAddress,
        getContract(args.contracts.TcpGovernorAlpha, ProtocolContract.TcpGovernorAlpha ) as TcpGovernorAlpha,
        addressToProtocolToken(args.contracts.Tcp),
        args.rootContracts.trustlessMulticall,
      )
    }
})

export const { clearTcpProposalsVoterInfo } = tcpProposalsVoterInfoSlice.slice.actions

export default tcpProposalsVoterInfoSlice
