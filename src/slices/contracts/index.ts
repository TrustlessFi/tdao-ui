import { Governor, TDao } from "@trustlessfi/typechain"
import { getMulticallContract } from "../../utils/getContract"
import { executeMulticalls, rc, oneContractManyFunctionMC } from "@trustlessfi/multicall"
import getContract from "../../utils/getContract"
import { ProtocolContract, RootContract, TDaoContract, TDaoRootContract } from './ProtocolContract'

import { thunkArgs, RootState } from '../fetchNodes'
import { createChainDataSlice, CacheDuration } from '../'

export type contractsInfo = { [key in ProtocolContract | TDaoContract]: string }

const contractsSlice = createChainDataSlice({
  name: 'contracts',
  dependencies: ['rootContracts'],
  stateSelector: (state: RootState) => state.contracts,
  cacheDuration: CacheDuration.LONG,
  thunkFunction:
    async (args: thunkArgs<'rootContracts' >) => {
      const trustlessMulticall = getMulticallContract(args.rootContracts.trustlessMulticall)
      const governor = getContract(args.rootContracts.governor, RootContract.Governor) as Governor
      const tdao = getContract(args.rootContracts.tdao, TDaoRootContract.TDao) as TDao

      const { tcpContracts, tdaoContracts } = await executeMulticalls(
        trustlessMulticall,
        {
          tcpContracts: oneContractManyFunctionMC(
            governor,
            {
              accounting: rc.String,
              auctions: rc.String,
              tcp: rc.String,
              hue: rc.String,
              huePositionNFT: rc.String,
              enforcedDecentralization: rc.String,
              lendHue: rc.String,
              liquidations: rc.String,
              market: rc.String,
              prices: rc.String,
              protocolLock: rc.String,
              rates: rc.String,
              rewards: rc.String,
              settlement: rc.String,
              timelock: rc.String,
              governorAlpha: rc.String,
              tcpAllocation: rc.String,
            }
          ),
          tdaoContracts: oneContractManyFunctionMC(
            tdao,
            {
              timelock: rc.String,
              tDaoGovernorAlpha: rc.String,
              tDaoToken: rc.String,
              tDaoPositionNFT: rc.String,
              votingRewardsSafe: rc.String,
            }
          ),
        }
      )

      return {
        [ProtocolContract.Accounting]: tcpContracts.accounting,
        [ProtocolContract.Auctions]: tcpContracts.auctions,
        [ProtocolContract.EnforcedDecentralization]: tcpContracts.enforcedDecentralization,
        [ProtocolContract.Hue]: tcpContracts.hue,
        [ProtocolContract.HuePositionNFT]: tcpContracts.huePositionNFT,
        [ProtocolContract.LendHue]: tcpContracts.lendHue,
        [ProtocolContract.Liquidations]: tcpContracts.liquidations,
        [ProtocolContract.Market]: tcpContracts.market,
        [ProtocolContract.Prices]: tcpContracts.prices,
        [ProtocolContract.ProtocolLock]: tcpContracts.protocolLock,
        [ProtocolContract.Rates]: tcpContracts.rates,
        [ProtocolContract.Rewards]: tcpContracts.rewards,
        [ProtocolContract.Settlement]: tcpContracts.settlement,
        [ProtocolContract.Tcp]: tcpContracts.tcp,
        [ProtocolContract.TcpGovernorAlpha]: tcpContracts.governorAlpha,
        [ProtocolContract.TcpTimelock]: tcpContracts.timelock,
        [ProtocolContract.TcpAllocation]: tcpContracts.tcpAllocation,

        [TDaoContract.TDaoToken]: tdaoContracts.tDaoToken,
        [TDaoContract.TDaoPositionNFT]: tdaoContracts.tDaoPositionNFT,
        [TDaoContract.TDaoGovernorAlpha]: tdaoContracts.tDaoGovernorAlpha,
        [TDaoContract.TDaoTimelock]: tdaoContracts.timelock,
        [TDaoContract.TDaoVotingRewardsSafe]: tdaoContracts.votingRewardsSafe,
      }
    },
})

export default contractsSlice
