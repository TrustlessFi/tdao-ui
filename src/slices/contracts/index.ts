import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { sliceState, initialState } from "../"
import { Governor, TDao } from "@trustlessfi/typechain"
import { getLocalStorage } from "../../utils"
import { getGenericReducerBuilder } from "../index"
import { getMulticallContract } from "../../utils/getContract"
import { executeMulticalls, getMulticall, rc } from "@trustlessfi/multicall"
import getContract from "../../utils/getContract"

// TODO add TCP Allocation
export enum ProtocolContract {
  Accounting = "Accounting",
  Auctions = "Auctions",
  EnforcedDecentralization = "EnforcedDecentralization",
  Hue = "Hue",
  HuePositionNFT = "HuePositionNFT",
  LendHue = "LendHue",
  Liquidations = "Liquidations",
  Market = "Market",
  Prices = "Prices",
  ProtocolLock = "ProtocolLock",
  Rates = "Rates",
  Rewards = "Rewards",
  Settlement = "Settlement",
  Tcp = "Tcp",
  TcpGovernorAlpha = "TcpGovernorAlpha",
  TcpTimelock = "TcpTimelock",
  TcpAllocation = "TcpAllocation",
}

export enum RootContract {
  Governor = "Governor",
  ProtocolDataAggregator = "ProtocolDataAggregator",
  GenesisAllocation = "GenesisAllocation",
  TrustlessMulticall = "TrustlessMulticall",
}

export enum TDaoContract {
  TDaoToken = 'TDaoToken',
  TDaoPositionNFT = 'TDaoPositionNFT',
  TDaoGovernorAlpha = 'TDaoGovernorAlpha',
  TDaoTimelock = 'TDaoTimelock',
  TDaoVotingRewardsSafe = 'TDaoVotingRewardsSafe',
}

export enum TDaoRootContract {
  TDao = 'TDao',
}

export interface contractsArgs {
  governor: string
  tdao: string
  trustlessMulticall: string
}

export const getContracts = createAsyncThunk(
  "contracts/getContracts",
  async (args: contractsArgs): Promise<ContractsInfo> => {
    const trustlessMulticall = getMulticallContract(args.trustlessMulticall)
    const governor = getContract(args.governor, RootContract.Governor) as Governor
    const tdao = getContract(args.tdao, TDaoRootContract.TDao) as TDao

    const { tcpContracts, tdaoContracts } = await executeMulticalls(
      trustlessMulticall,
      {
        tcpContracts: getMulticall(
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
        tdaoContracts: getMulticall(
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
  }
)

export type ContractsInfo = { [key in ProtocolContract | TDaoContract]: string }

export interface ContractsState extends sliceState<ContractsInfo> {}

const name = "contracts"

export const contractsSlice = createSlice({
  name,
  initialState: getLocalStorage(name, initialState) as ContractsState,
  reducers: {},
  extraReducers: (builder) => {
    builder = getGenericReducerBuilder(builder, getContracts)
  },
})

export default contractsSlice.reducer
