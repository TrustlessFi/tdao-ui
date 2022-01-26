import { PayloadAction, createAsyncThunk, ThunkDispatch, AnyAction } from '@reduxjs/toolkit'
import { assertUnreachable } from '../../utils'
import { waitingForMetamask, metamaskComplete } from '../wallet'
import getProvider from '../../utils/getProvider'
import { addNotification } from '../notifications'
import { clearBalances } from '../balances'
import { clearTcpAllocationInfo } from '../tcpAllocation'
import { clearTcpProposalsVoterInfo } from '../proposalsVoterInfo/tcpProposals'
import { clearClaimedAllocationRounds } from '../claimedAllocationRounds'
import { clearTDaoPositions } from '../tdaoPositions'
import { clearVoteDelegation } from '../voteDelegation'
import { ethers, ContractTransaction } from 'ethers'
import getContract from '../../utils/getContract'
import { scale, timeMS } from '../../utils'
import { ChainID } from '@trustlessfi/addresses'
import { numDisplay } from '../../utils'
import { createLocalSlice, CacheDuration } from '../'
import { RootState } from '../fetchNodes'
import { ProtocolContract, TDaoRootContract, RootContract } from '../contracts/ProtocolContract'
import { UserGenesisAllocation } from '../genesisAllocations'

import {
  TcpGovernorAlpha, TDao, TcpAllocation, Tcp,
  GovernorAlphaWithVotingRewards, GenesisAllocation
} from '@trustlessfi/typechain'
import { addressToERC20, uint256Max, parseMetamaskError, extractRevertReasonString } from '../../utils'

export enum WalletToken {
  TCP = 'TCP',
  TDao = 'TDao',
}

export enum TransactionType {
  UpdateTDaoPositionLockDuration,
  DeleteTDaoPosition,
  ClaimAllTDaoPositionRewards,
  CreateTDaoTcpAllocationPosition,
  ClaimTcpTokenAllocationImmediately,
  CreateTDaoPosition,

  VoteTcpProposal,
  ClaimTcpVotingRewards,
  SelfDelegateTcp,
  ApproveToken,

  ClaimGenesisAllocations,
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

export interface txCreateTDaoTcpAllocationPosition {
  type: TransactionType.CreateTDaoTcpAllocationPosition
  tcpAllocation: string
  userAddress: string
  count: number
  decimals: number
  lockDurationMonths: number
}

export interface txClaimTcpTokenAllocationImmediately {
  type: TransactionType.ClaimTcpTokenAllocationImmediately
  tcpAllocation: string
  userAddress: string
  decimals: number
  count: number
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
}

export interface txApproveToken {
  type: TransactionType.ApproveToken
  tokenAddress: string
  spenderAddress: string
  tokenSymbol: string
  spenderName: string
}

export interface txClaimGenesisAllocations {
  type: TransactionType.ClaimGenesisAllocations
  genesisAllocation: string
  allocations: UserGenesisAllocation[]
  roundIDs: string[]
}

export type TransactionArgs =
  txVoteTcpProposal |
  txClaimVotingRewards |
  txUpdateTDaoPositionLockDuration |
  txDeleteTDaoPosition |
  txClaimAllTDaoPositionRewards |
  txCreateTDaoTcpAllocationPosition |
  txClaimTcpTokenAllocationImmediately |
  txCreateTDaoPosition |
  txSelfDelegateTcp |
  txApproveToken |
  txClaimGenesisAllocations

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

export type transactionState = {[key in string]: TransactionInfo}

export const getTxLongName = (args: TransactionArgs) => {
  const type = args.type
  switch(type) {
    case TransactionType.UpdateTDaoPositionLockDuration:
      return `Increase position ${args.positionID} lock duration to ${args.durationMonths} months`
    case TransactionType.DeleteTDaoPosition:
      return `Delete position ${args.positionID}`
    case TransactionType.ClaimAllTDaoPositionRewards:
      return `Claim Rewards for TDao positions ${args.positionIDs.join(', ')}`
    case TransactionType.CreateTDaoTcpAllocationPosition:
      return `Create TDao allocation position with ${numDisplay(args.count)} Tcp`
    case TransactionType.ClaimTcpTokenAllocationImmediately:
      return `Claim ${numDisplay(args.count)} Tcp Tokens`
    case TransactionType.CreateTDaoPosition:
      return `Create TDao position with ${numDisplay(args.count)} ${args.tokenSymbol}`
    case TransactionType.VoteTcpProposal:
      return `Vote on ${args.support ? 'Yes' : 'No'} Tcp proposal ${args.proposalID}`
    case TransactionType.ClaimTcpVotingRewards:
      return `Claim Tcp voting rewards`
    case TransactionType.SelfDelegateTcp:
      return `Self delegate Tcp votes`
    case TransactionType.ApproveToken:
      return `Approve ${args.spenderName} to spend ${args.tokenSymbol}`
    case TransactionType.ClaimGenesisAllocations:
      return `Claim Genesis Tcp Tokens for rounds ${args.roundIDs.join(', ')}`

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
    case TransactionType.CreateTDaoTcpAllocationPosition:
      return `Create TDao allocation position`
    case TransactionType.ClaimTcpTokenAllocationImmediately:
      return `Claim Tcp Tokens`
    case TransactionType.CreateTDaoPosition:
      return `Create TDao position`
    case TransactionType.VoteTcpProposal:
      return 'Vote on Tcp proposal'
    case TransactionType.ClaimTcpVotingRewards:
      return `Claim Tcp voting rewards`
    case TransactionType.SelfDelegateTcp:
      return `Self delegate Tcp votes`
    case TransactionType.ApproveToken:
      return `Approve Token`
    case TransactionType.ClaimGenesisAllocations:
      return `Claim Genesis Tcp Tokens`
    default:
      assertUnreachable(type)
  }
  return ''
}

export const getTxErrorName = (type: TransactionType) => getTxShortName(type) + ' Failed'

export const getTokenAssociatedWithTx = (type: TransactionType): WalletToken | null => {
  switch(type) {
    case TransactionType.ClaimTcpTokenAllocationImmediately:
    case TransactionType.DeleteTDaoPosition:
    case TransactionType.ClaimTcpVotingRewards:
    case TransactionType.CreateTDaoTcpAllocationPosition:
    case TransactionType.CreateTDaoPosition:
      return WalletToken.TCP
    case TransactionType.ClaimAllTDaoPositionRewards:
      return WalletToken.TDao
    case TransactionType.VoteTcpProposal:
    case TransactionType.SelfDelegateTcp:
    case TransactionType.ApproveToken:
    case TransactionType.ClaimGenesisAllocations:
    case TransactionType.UpdateTDaoPositionLockDuration:
      return null
    default:
      assertUnreachable(type)
  }
  return null
}

const executeTransaction = async (
  args: TransactionArgs,
  provider: ethers.providers.Web3Provider,
): Promise<ContractTransaction> => {
  const signer = provider.getSigner()

  const getTcpGovernorAlpha = (address: string) =>
    getContract(address, ProtocolContract.TcpGovernorAlpha)
      .connect(signer) as TcpGovernorAlpha

  const getGovernorAlphaWithVotingRewards = (address: string) =>
    getContract(address, ProtocolContract.TcpGovernorAlpha)
      .connect(signer) as GovernorAlphaWithVotingRewards

  const getTDao = (address: string) =>
    getContract(address, TDaoRootContract.TDao)
      .connect(signer) as TDao

  const getTcpAllocation = (address: string) =>
    getContract(address, ProtocolContract.TcpAllocation)
      .connect(signer) as TcpAllocation

  const getTcp = (address: string) =>
    getContract(address, ProtocolContract.Tcp)
      .connect(signer) as Tcp

  const getGenesisAllocation = (address: string) =>
    getContract(address, RootContract.GenesisAllocation)
      .connect(signer) as GenesisAllocation

  const type = args.type

  switch(type) {

    case TransactionType.UpdateTDaoPositionLockDuration:
      return await getTDao(args.tdao).increaseLockDuration(args.positionID, args.durationMonths)

    case TransactionType.DeleteTDaoPosition:
      return await getTDao(args.tdao).unlockTokens(args.positionID)

    case TransactionType.ClaimAllTDaoPositionRewards:
      return await getTDao(args.tdao).getRewards(args.positionIDs)

    case TransactionType.CreateTDaoTcpAllocationPosition:
      return await getTcpAllocation(args.tcpAllocation).lockTokensIntoDao(
        args.userAddress,
        scale(args.count, args.decimals),
        args.lockDurationMonths,
      )

    case TransactionType.ClaimTcpTokenAllocationImmediately:
      return await getTcpAllocation(args.tcpAllocation).getTokens(
        args.userAddress,
        scale(args.count, args.decimals),
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
      // TODO pass in user address instead
      const userAddress = await signer.getAddress()
      return await getTcp(args.tcp).delegate(userAddress)

    case TransactionType.ApproveToken:
      return await addressToERC20(args.tokenAddress).approve(args.spenderAddress, uint256Max)

    case TransactionType.ClaimGenesisAllocations:
      return await getGenesisAllocation(args.genesisAllocation).claimAllocations(args.allocations)

    default:
      assertUnreachable(type)
  }
  throw new Error('Shoudnt get here')
}

export const waitForTransaction = async (
  tx: TransactionInfo,
  provider: ethers.providers.Web3Provider,
  dispatch: ThunkDispatch<unknown, unknown, AnyAction>
) => {
    const receipt = await provider.waitForTransaction(tx.hash)

    const succeeded = receipt.status === 1
    if (succeeded) {
      dispatch(transactionSucceeded(tx.hash))
    } else {
      dispatch(addNotification({
        type: tx.type,
        userAddress: tx.userAddress,
        status: TransactionStatus.Failure,
        hash: tx.hash,
        chainID: tx.chainID,
      }))
      dispatch(transactionFailed(tx.hash))
    }

    // Kick off side-effects to reload relevant data
    if (succeeded) {
      const type = tx.type

      switch (type) {
        case TransactionType.UpdateTDaoPositionLockDuration:
          dispatch(clearTDaoPositions())
          break
        case TransactionType.DeleteTDaoPosition:
        case TransactionType.ClaimAllTDaoPositionRewards:
          dispatch(clearTDaoPositions())
          dispatch(clearBalances())
          break
        case TransactionType.CreateTDaoTcpAllocationPosition:
          dispatch(clearTDaoPositions())
          dispatch(clearTcpAllocationInfo())
          break
        case TransactionType.ClaimTcpTokenAllocationImmediately:
          dispatch(clearTcpAllocationInfo())
          dispatch(clearBalances())
          break
        case TransactionType.CreateTDaoPosition:
          dispatch(clearBalances())
          dispatch(clearTDaoPositions())
          break
        case TransactionType.VoteTcpProposal:
        case TransactionType.ClaimTcpVotingRewards:
          dispatch(clearBalances())
          dispatch(clearTcpProposalsVoterInfo())
          break
        case TransactionType.SelfDelegateTcp:
          dispatch(clearVoteDelegation())
          break
        case TransactionType.ApproveToken:
          dispatch(clearBalances())
          break
        case TransactionType.ClaimGenesisAllocations:
          dispatch(clearClaimedAllocationRounds())
          dispatch(clearTcpAllocationInfo())
          break
      default:
        assertUnreachable(type)
      }
    }

    return succeeded
}


export const submitTransaction = createAsyncThunk(
  'transactions/submitTransaction',
  async (data: TransactionData, {dispatch}): Promise<void> => {
    const args = data.args
    const userAddress = data.userAddress

    const provider = getProvider()

    let rawTx: ContractTransaction
    try {
      dispatch(waitingForMetamask())
      rawTx = await executeTransaction(args, provider)
      dispatch(metamaskComplete())
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

    const tx = {
      hash: rawTx.hash,
      nonce: rawTx.nonce,
      userAddress,
      startTimeMS: timeMS(),
      type: args.type,
      status: TransactionStatus.Pending,
      chainID: data.chainID,
      args: data.args,
    }

    dispatch(transactionCreated(tx))

    data.openTxTab()

    await waitForTransaction(tx, provider, dispatch)
  })

const transactionsSlice = createLocalSlice({
  name: 'transactions',
  initialState: {} as transactionState,
  stateSelector: (state: RootState) => state.transactions,
  cacheDuration: CacheDuration.INFINITE,
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
  }
})

export const {
  clearUserTransactions,
  transactionCreated,
  transactionSucceeded,
  transactionFailed,
} = transactionsSlice.slice.actions

export default transactionsSlice
