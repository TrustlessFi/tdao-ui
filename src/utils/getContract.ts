// Copyright (c) 2020. All Rights Reserved
// SPDX-License-Identifier: UNLICENSED

import { ContractInterface, Contract } from 'ethers'
import { Web3Provider } from '@ethersproject/providers'
import { abi, contractArtifact } from './'

import getProvider from './getProvider'
import {
  ProtocolContract,
  RootContract,
  TDaoRootContract,
  TDaoContract
} from '../slices/contracts/ProtocolContract'

// ==================== Typechain =========================
import {
  Accounting,
  Auctions,
  EnforcedDecentralization,
  Governor,
  TcpGovernorAlpha,
  GenesisAllocation,
  LendHue,
  Liquidations,
  Market,
  TrustlessMulticall,
  TrustlessMulticallViewOnly,
  Prices,
  ProtocolDataAggregator,
  ProtocolLock,
  Tcp,
  Rates,
  Rewards,
  Settlement,
  TcpTimelock,
  Hue,
  HuePositionNFT,
  TDao,
  TDaoToken,
  TDaoPositionNFT,
  TDaoGovernorAlpha,
  TDaoTimelock,
  TDaoVotingRewardsSafe,
  TcpAllocation,

} from '@trustlessfi/typechain'

// ================ ARTIFACTS =======================
import accountingArtifact from '@trustlessfi/artifacts/dist/contracts/core/storage/Accounting.sol/Accounting.json'
import auctionsArtifact from '@trustlessfi/artifacts/dist/contracts/core/logic/Auctions.sol/Auctions.json'
import enforcedDecentralizationArtifact from '@trustlessfi/artifacts/dist/contracts/core/governance/EnforcedDecentralization.sol/EnforcedDecentralization.json'
import governorArtifact from '@trustlessfi/artifacts/dist/contracts/core/governance/Governor.sol/Governor.json'
import hueArtifact from '@trustlessfi/artifacts/dist/contracts/core/tokens/Hue.sol/Hue.json'
import huePositionNFTArtifact from '@trustlessfi/artifacts/dist/contracts/core/tokens/HuePositionNFT.sol/HuePositionNFT.json'
import lendHueArtifact from '@trustlessfi/artifacts/dist/contracts/core/tokens/LendHue.sol/LendHue.json'
import liquidationsArtifact from '@trustlessfi/artifacts/dist/contracts/core/logic/Liquidations.sol/Liquidations.json'
import marketArtifact from '@trustlessfi/artifacts/dist/contracts/core/logic/Market.sol/Market.json'
import pricesArtifact from '@trustlessfi/artifacts/dist/contracts/core/logic/Prices.sol/Prices.json'
import protocolDataAggregatorArtifact from '@trustlessfi/artifacts/dist/contracts/core/auxiliary/ProtocolDataAggregator.sol/ProtocolDataAggregator.json'
import protocolLockArtifact from '@trustlessfi/artifacts/dist/contracts/core/utils/ProtocolLock.sol/ProtocolLock.json'
import ratesArtifact from '@trustlessfi/artifacts/dist/contracts/core/logic/Rates.sol/Rates.json'
import rewardsArtifact from '@trustlessfi/artifacts/dist/contracts/core/logic/Rewards.sol/Rewards.json'
import settlementArtifact from '@trustlessfi/artifacts/dist/contracts/core/logic/Settlement.sol/Settlement.json'
import tcpArtifact from '@trustlessfi/artifacts/dist/contracts/core/governance/Tcp.sol/Tcp.json'
import tcpGovernorAlphaArtifact from '@trustlessfi/artifacts/dist/contracts/core/governance/TcpGovernorAlpha.sol/TcpGovernorAlpha.json'
import trustlessMulticallArtifact from '@trustlessfi/artifacts/dist/contracts/core/auxiliary/multicall/TrustlessMulticall.sol/TrustlessMulticall.json'
import trustlessMulticallViewOnlyArtifact from '@trustlessfi/artifacts/dist/contracts/core/auxiliary/multicall/TrustlessMulticallViewOnly.sol/TrustlessMulticallViewOnly.json'
import tcpTimelockArtifact from '@trustlessfi/artifacts/dist/contracts/core/governance/TcpTimelock.sol/TcpTimelock.json'
import genesisAllocationArtifact from '@trustlessfi/artifacts/dist/contracts/core/auxiliary/allocations/GenesisAllocation.sol/GenesisAllocation.json'
import tcpAllocationArtifact from '@trustlessfi/artifacts/dist/contracts/core/auxiliary/allocations/TcpAllocation.sol/TcpAllocation.json'

import tDaoArtifact from '@trustlessfi/artifacts/dist/contracts/core/TDao/TDao.sol/TDao.json'

import tDaoTokenArtifact from '@trustlessfi/artifacts/dist/contracts/core/TDao/TDaoToken.sol/TDaoToken.json'
import tDaoPositionNFTArtifact from '@trustlessfi/artifacts/dist/contracts/core/TDao/TDaoPositionNFT.sol/TDaoPositionNFT.json'
// import tDaoPositionNFTDescriptorArtifact from '@trustlessfi/artifacts/dist/contracts/core/TDao/TDaoPositionNFTDescriptor.sol/TDaoPositionNFTDescriptor.json'
import tDaoGovernorAlphaArtifact from '@trustlessfi/artifacts/dist/contracts/core/TDao/TDaoGovernorAlpha.sol/TDaoGovernorAlpha.json'
import tDaoTimelockArtifact from '@trustlessfi/artifacts/dist/contracts/core/TDao/TDaoTimelock.sol/TDaoTimelock.json'
import tDaoVotingRewardsSafeArtifact from '@trustlessfi/artifacts/dist/contracts/core/TDao/TDaoTimelock.sol/TDaoTimelock.json'

import { assertUnreachable } from '@trustlessfi/utils'

const artifactLookup: (() => { [key in ProtocolContract | RootContract | TDaoContract | TDaoRootContract]: contractArtifact }) = () => ({
  [ProtocolContract.Accounting]: accountingArtifact,
  [ProtocolContract.Auctions]: auctionsArtifact,
  [ProtocolContract.EnforcedDecentralization]: enforcedDecentralizationArtifact,
  [ProtocolContract.Hue]: hueArtifact,
  [ProtocolContract.HuePositionNFT]: huePositionNFTArtifact,
  [ProtocolContract.LendHue]: lendHueArtifact,
  [ProtocolContract.Liquidations]: liquidationsArtifact,
  [ProtocolContract.Market]: marketArtifact,
  [ProtocolContract.Prices]: pricesArtifact,
  [ProtocolContract.ProtocolLock]: protocolLockArtifact,
  [ProtocolContract.Rates]: ratesArtifact,
  [ProtocolContract.Rewards]: rewardsArtifact,
  [ProtocolContract.Settlement]: settlementArtifact,
  [ProtocolContract.Tcp]: tcpArtifact,
  [ProtocolContract.TcpGovernorAlpha]: tcpGovernorAlphaArtifact,
  [ProtocolContract.TcpTimelock]: tcpTimelockArtifact,
  [ProtocolContract.TcpAllocation]: tcpAllocationArtifact,

  [RootContract.Governor]: governorArtifact,
  [RootContract.ProtocolDataAggregator]: protocolDataAggregatorArtifact,
  [RootContract.GenesisAllocation]: genesisAllocationArtifact,
  [RootContract.TrustlessMulticall]: trustlessMulticallArtifact,

  [TDaoRootContract.TDao]: tDaoArtifact,

  [TDaoContract.TDaoToken]: tDaoTokenArtifact,
  [TDaoContract.TDaoPositionNFT]: tDaoPositionNFTArtifact,
  [TDaoContract.TDaoGovernorAlpha]: tDaoGovernorAlphaArtifact,
  [TDaoContract.TDaoTimelock]: tDaoTimelockArtifact,
  [TDaoContract.TDaoVotingRewardsSafe]: tDaoVotingRewardsSafeArtifact,
})

export const contract = <T extends Contract>(
  address: string,
  abi: ContractInterface,
  provider?: Web3Provider
): T =>
  new Contract(
    address,
    abi,
    provider === undefined ? getProvider() : provider
  ) as T

export const getMulticallContract = (address: string) =>
  getContract(
    address,
    RootContract.TrustlessMulticall,
    true
  ) as unknown as TrustlessMulticallViewOnly

const getContract = (
  address: string,
  theContract: ProtocolContract | RootContract | TDaoContract | TDaoRootContract,
  multicallViewOnly = false
) => {
  const getAbi = (): abi => {
    if (theContract === RootContract.TrustlessMulticall) {
      return multicallViewOnly
        ? trustlessMulticallViewOnlyArtifact.abi
        : trustlessMulticallArtifact.abi
    } else {
      return artifactLookup()[theContract].abi
    }
  }

  const contract = new Contract(address, getAbi(), getProvider())

  switch (theContract) {
    case ProtocolContract.Accounting:
      return contract as Accounting
    case ProtocolContract.Auctions:
      return contract as Auctions
    case ProtocolContract.EnforcedDecentralization:
      return contract as EnforcedDecentralization
    case ProtocolContract.Hue:
      return contract as Hue
    case ProtocolContract.HuePositionNFT:
      return contract as HuePositionNFT
    case ProtocolContract.LendHue:
      return contract as LendHue
    case ProtocolContract.Liquidations:
      return contract as Liquidations
    case ProtocolContract.Market:
      return contract as Market
    case ProtocolContract.Prices:
      return contract as Prices
    case ProtocolContract.ProtocolLock:
      return contract as ProtocolLock
    case ProtocolContract.Rates:
      return contract as Rates
    case ProtocolContract.Rewards:
      return contract as Rewards
    case ProtocolContract.Settlement:
      return contract as Settlement
    case ProtocolContract.Tcp:
      return contract as Tcp
    case ProtocolContract.TcpGovernorAlpha:
      return contract as TcpGovernorAlpha
    case ProtocolContract.TcpTimelock:
      return contract as TcpTimelock
    case ProtocolContract.TcpAllocation:
      return contract as TcpAllocation

    case RootContract.Governor:
      return contract as Governor
    case RootContract.ProtocolDataAggregator:
      return contract as ProtocolDataAggregator
    case RootContract.GenesisAllocation:
      return contract as GenesisAllocation
    case RootContract.TrustlessMulticall:
      return contract as TrustlessMulticall

    case TDaoRootContract.TDao:
      return contract as TDao

    case TDaoContract.TDaoToken:
      return contract as TDaoToken
    case TDaoContract.TDaoPositionNFT:
      return contract as TDaoPositionNFT
    case TDaoContract.TDaoGovernorAlpha:
      return contract as TDaoGovernorAlpha
    case TDaoContract.TDaoTimelock:
      return contract as TDaoTimelock
    case TDaoContract.TDaoVotingRewardsSafe:
      return contract as TDaoVotingRewardsSafe

    default:
      assertUnreachable(theContract)
  }
}

export default getContract
