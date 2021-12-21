import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit'
import { getLocalStorage, assertUnreachable } from '../../utils'
import { waitingForMetamask, metamaskComplete } from '../wallet'
import getProvider from '../../utils/getProvider'
import { addNotification } from '../notifications'
import { clearBalances } from '../balances'
import { clearTcpAllocationInfo } from '../tcpAllocation'
import { clearTcpProposals } from '../proposals/tcpProposals'
import { clearTDaoPositions } from '../tdaoPositions'
import { ethers, ContractTransaction } from 'ethers'
import { ProtocolContract, TDaoRootContract } from '../contracts'

import {
  TcpGovernorAlpha, TDao, TcpAllocation, Tcp,
  GovernorAlphaWithVotingRewards,
} from '@trustlessfi/typechain'
import getContract from '../../utils/getContract'
import { scale, timeMS } from '../../utils'
import { parseMetamaskError, extractRevertReasonString } from '../../utils'
import { ChainID } from '@trustlessfi/addresses'
import { numDisplay } from '../../utils'

export enum TransactionType {
  UpdateTDaoPositionLockDuration,
  DeleteTDaoPosition,
  ClaimAllTDaoPositionRewards,
  CreateTDaoAllocationPosition,
  CreateTDaoPosition,

  VoteTcpProposal,
  ClaimTcpVotingRewards,
  SelfDelegateTcp,
}

export enum TransactionStatus {
  Pending,
  Success,
  Failure,
}

export interface txUpdateTDaoPositionLockDuration {
  type: TransactionType.UpdateTDaoPositionLockDuration
  tdao: string
  positionID: number
  durationMonths: number
}

export interface txDeleteTDaoPosition {
  type: TransactionType.DeleteTDaoPosition
  tdao: string
  positionID: string
}

export interface txClaimAllTDaoPositionRewards {
  type: TransactionType.ClaimAllTDaoPositionRewards
  tdao: string
  positionIDs: string[]
}

export interface txCreateTDaoAllocationPosition {
  type: TransactionType.CreateTDaoAllocationPosition
  tcpAllocation: string
  userAddress: string
  count: number
  lockDurationMonths: number
}

export interface txCreateTDaoPosition {
  type: TransactionType.CreateTDaoPosition
  tdao: string
  tokenID: number
  count: number
  decimals: number
  lockDurationMonths: number
  userAddress: string
  tokenSymbol: string
}

export interface txVoteTcpProposal {
  type: TransactionType.VoteTcpProposal
  TcpGovernorAlpha: string
  proposalID: number
  support: boolean
}

export interface txClaimVotingRewards {
  type: TransactionType.ClaimTcpVotingRewards
  governorAlpha: string
  proposalIDs: number[]
}

export interface txSelfDelegateTcp {
  type: TransactionType.SelfDelegateTcp
  tcp: string
  userAddress: string
}

export type TransactionArgs =
  txVoteTcpProposal |
  txClaimVotingRewards |
  txUpdateTDaoPositionLockDuration |
  txDeleteTDaoPosition |
  txClaimAllTDaoPositionRewards |
  txCreateTDaoAllocationPosition |
  txCreateTDaoPosition |
  txSelfDelegateTcp

export interface TransactionData {
  args: TransactionArgs
  openTxTab: () => void
  userAddress: string
  chainID: ChainID
}

export type TransactionInfo = {
  hash: string
  nonce: number
  userAddress: string
  type: TransactionType
  status: TransactionStatus
  startTimeMS: number
  chainID: ChainID
  args: TransactionArgs
}

export type TransactionState = {[key in string]: TransactionInfo}

export const getTxLongName = (args: TransactionArgs) => {
  const type = args.type
  switch(type) {
    case TransactionType.UpdateTDaoPositionLockDuration:
      return `Increase position ${args.positionID} lock duration to ${args.durationMonths} months`
    case TransactionType.DeleteTDaoPosition:
      return `Delete position ${args.positionID}`
    case TransactionType.ClaimAllTDaoPositionRewards:
      return `Claim Rewards for TDao positions ${args.positionIDs.join(', ')}`
    case TransactionType.CreateTDaoAllocationPosition:
      return `Create TDao allocation position with ${numDisplay(args.count)} Tcp`
    case TransactionType.CreateTDaoPosition:
      return `Create TDao position with ${numDisplay(args.count)} ${args.tokenSymbol}`
    case TransactionType.VoteTcpProposal:
      return `Vote on ${args.support ? 'Yes' : 'No'} Tcp proposal ${args.proposalID}`
    case TransactionType.ClaimTcpVotingRewards:
      return `Claim Tcp voting rewards`
    case TransactionType.SelfDelegateTcp:
      return `Self delegate Tcp votes`

    default:
      assertUnreachable(type)
  }
  return ''
}

export const getTxShortName = (type: TransactionType) => {
  switch(type) {
    case TransactionType.UpdateTDaoPositionLockDuration:
      return 'Increase Position Lock Duration'
    case TransactionType.DeleteTDaoPosition:
      return 'Delete Position'
    case TransactionType.ClaimAllTDaoPositionRewards:
      return `Claim Rewards for TDao positions`
    case TransactionType.CreateTDaoAllocationPosition:
      return `Create TDao allocation position`
    case TransactionType.CreateTDaoPosition:
      return `Create TDao position`
    case TransactionType.VoteTcpProposal:
      return 'Vote on Tcp proposal'
    case TransactionType.ClaimTcpVotingRewards:
      return `Claim Tcp voting rewards`
    case TransactionType.SelfDelegateTcp:
      return `Self delegate Tcp votes`
    default:
      assertUnreachable(type)
  }
  return ''
}

export const getTxErrorName = (type: TransactionType) => getTxShortName(type) + ' Failed'

const executeTransaction = async (
  args: TransactionArgs,
  provider: ethers.providers.Web3Provider,
): Promise<ContractTransaction> => {
  const getTcpGovernorAlpha = (address: string) =>
    getContract(address, ProtocolContract.TcpGovernorAlpha)
      .connect(provider.getSigner()) as TcpGovernorAlpha

  const getGovernorAlphaWithVotingRewards = (address: string) =>
    getContract(address, ProtocolContract.TcpGovernorAlpha)
      .connect(provider.getSigner()) as GovernorAlphaWithVotingRewards

  const getTDao = (address: string) =>
    getContract(address, TDaoRootContract.TDao)
      .connect(provider.getSigner()) as TDao

  const getTcpAllocation = (address: string) =>
    getContract(address, ProtocolContract.TcpAllocation)
      .connect(provider.getSigner()) as TcpAllocation

  const getTcp = (address: string) =>
    getContract(address, ProtocolContract.Tcp)
      .connect(provider.getSigner()) as Tcp

  const type = args.type

  switch(type) {

    case TransactionType.UpdateTDaoPositionLockDuration:
      return await getTDao(args.tdao).increaseLockDuration(args.positionID, args.durationMonths)

    case TransactionType.DeleteTDaoPosition:
      return await getTDao(args.tdao).unlockTokens(args.positionID)

    case TransactionType.ClaimAllTDaoPositionRewards:
      return await getTDao(args.tdao).getRewards(args.positionIDs)

    case TransactionType.CreateTDaoAllocationPosition:
      return await getTcpAllocation(args.tcpAllocation).lockTokensIntoDao(
        args.userAddress,
        scale(args.count),
        args.lockDurationMonths,
      )

    case TransactionType.CreateTDaoPosition:
      return await getTDao(args.tdao).lockTokens(
        args.tokenID,
        scale(args.count, args.decimals),
        args.lockDurationMonths,
        args.userAddress
      )

    case TransactionType.VoteTcpProposal:
      return await getTcpGovernorAlpha(args.TcpGovernorAlpha).castVote(
        args.proposalID,
        args.support
      )

    case TransactionType.ClaimTcpVotingRewards:
      return await getGovernorAlphaWithVotingRewards(args.governorAlpha).claimVotingRewards(
        args.proposalIDs
      )

    case TransactionType.SelfDelegateTcp:
      return await getTcp(args.tcp).delegate(args.userAddress)

    default:
      assertUnreachable(type)
  }
  throw new Error('Shoudnt get here')
}

export const waitForTransaction = createAsyncThunk(
  'transactions/waitForTransaction',
  async (data: TransactionData, {dispatch}): Promise<void> => {
    const args = data.args
    const userAddress = data.userAddress

    const provider = getProvider()

    let tx: ContractTransaction
    try {
      dispatch(waitingForMetamask())
      tx = await executeTransaction(args, provider)
    } catch (e) {
      const errorMessages = parseMetamaskError(e)
      console.error("failureMessages: " + errorMessages.join(', '))

      const reasonString =
        errorMessages.length > 0
        ? extractRevertReasonString(errorMessages[0])
        : null

      dispatch(addNotification({
        type: args.type,
        userAddress,
        status: TransactionStatus.Failure,
        chainID: data.chainID,
        message: reasonString ? reasonString : errorMessages.join(', ')
      }))
      dispatch(metamaskComplete())
      return
    }

    dispatch(transactionCreated({
      hash: tx.hash,
      nonce: tx.nonce,
      userAddress,
      startTimeMS: timeMS(),
      type: args.type,
      status: TransactionStatus.Pending,
      chainID: data.chainID,
      args: data.args,
    }))
    data.openTxTab()

    const receipt = await provider.waitForTransaction(tx.hash)
    dispatch(metamaskComplete())

    const succeeded = receipt.status === 1
    if (succeeded) {
      dispatch(transactionSucceeded(tx.hash))
    } else {
      dispatch(addNotification({
        type: args.type,
        userAddress,
        status: TransactionStatus.Failure,
        hash: tx.hash,
        chainID: data.chainID,
      }))
      dispatch(transactionFailed(tx.hash))
    }

    // Kick off side-effects to reload relevant data
    if (succeeded) {
      const type = args.type

      switch (type) {
        case TransactionType.UpdateTDaoPositionLockDuration:
        case TransactionType.DeleteTDaoPosition:
        case TransactionType.ClaimAllTDaoPositionRewards:
          dispatch(clearTDaoPositions())
          break
        case TransactionType.CreateTDaoAllocationPosition:
          dispatch(clearTDaoPositions())
          dispatch(clearTcpAllocationInfo())
          break
        case TransactionType.CreateTDaoPosition:
          dispatch(clearBalances())
          dispatch(clearTDaoPositions())
          break
        case TransactionType.VoteTcpProposal:
        case TransactionType.ClaimTcpVotingRewards:
          dispatch(clearTcpProposals())
          break
        case TransactionType.SelfDelegateTcp:
          // TODO
          break
      default:
        assertUnreachable(type)
      }
    }
  })

const name = 'transactions'

export const transactionsSlice = createSlice({
  name,
  initialState: getLocalStorage(name, {}) as TransactionState,
  reducers: {
    clearUserTransactions: (state, action: PayloadAction<string>) => {
      const userAddress = action.payload
      return Object.fromEntries(
               Object.values(state)
                 .filter(tx => tx.userAddress !== userAddress)
                   .map(tx => [tx.hash, tx]))
    },
    transactionCreated: (state, action: PayloadAction<TransactionInfo>) => {
      const txInfo = action.payload
      state[txInfo.hash] = txInfo
    },
    transactionSucceeded: (state, action: PayloadAction<string>) => {
      const hash = action.payload
      if (state.hasOwnProperty(hash)) {
        state[hash].status = TransactionStatus.Success
      }
    },
    transactionFailed: (state, action: PayloadAction<string>) => {
      const hash = action.payload
      if (state.hasOwnProperty(hash)) {
        state[hash].status = TransactionStatus.Failure
      }
    },
  },
})

export const {
  clearUserTransactions,
  transactionCreated,
  transactionSucceeded,
  transactionFailed,
} = transactionsSlice.actions

export default transactionsSlice.reducer
