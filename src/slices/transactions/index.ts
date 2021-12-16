import { Contract } from 'ethers'
import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit'
import { getLocalStorage, assertUnreachable } from '../../utils'
import { waitingForMetamask, metamaskComplete } from '../wallet'
import getProvider from '../../utils/getProvider'
import { addNotification } from '../notifications'
import { clearPositions } from '../positions'
import { clearLiquidityPositions } from '../liquidityPositions'
import { clearBalances } from '../balances'
import { clearPoolCurrentData } from '../poolCurrentData'
import { clearTDaoPositions } from '../tdaoPositions'
import { clearTcpAllocationInfo } from '../tcpAllocation'
import { clearProposals } from '../proposals'
import { ethers, ContractTransaction, BigNumber } from 'ethers'
import { ProtocolContract, TDaoRootContract } from '../contracts'
import erc20Artifact from '@trustlessfi/artifacts/dist/@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json'

import { Market, Rewards, TcpGovernorAlpha, TDao, TcpAllocation } from '@trustlessfi/typechain'
import getContract, { getMulticallContract } from '../../utils/getContract'
import { scale, SLIPPAGE_TOLERANCE, timeMS } from '../../utils'
import { UIID } from '../../constants'
import { getDefaultTransactionTimeout, mnt, parseMetamaskError, extractRevertReasonString } from '../../utils'
import { zeroAddress, bnf, uint256Max } from '../../utils/'
import { ChainID } from '@trustlessfi/addresses'
import { ERC20 } from '@trustlessfi/typechain'
import { numDisplay } from '../../utils'

export enum TransactionType {
  CreatePosition,
  UpdatePosition,
  Lend,
  Withdraw,
  ApproveHue,
  ApproveLendHue,
  CreateLiquidityPosition,
  IncreaseLiquidityPosition,
  DecreaseLiquidityPosition,
  ClaimAllPositionRewards,
  ApprovePoolToken,
  VoteProposal,
  UpdateTDaoPositionLockDuration,
  DeleteTDaoPosition,
  ClaimAllTDaoPositionRewards,
  CreateTDaoAllocationPosition,
  CreateTDaoPosition,
}

export enum TransactionStatus {
  Pending,
  Success,
  Failure,
}

export interface txCreatePositionArgs {
  type: TransactionType.CreatePosition
  collateralCount: number,
  debtCount: number,
  Market: string,
}

export interface txUpdatePositionArgs {
  type: TransactionType.UpdatePosition
  positionID: number,
  collateralIncrease: number,
  debtIncrease: number,
  Market: string,
}

export interface txLendArgs {
  type: TransactionType.Lend
  count: number,
  Market: string,
}

export interface txWithdrawArgs {
  type: TransactionType.Withdraw
  count: number,
  Market: string,
}

export interface txCreateLiquidityPositionArgs {
  chainID: ChainID
  type: TransactionType.CreateLiquidityPosition
  token0: string
  token0Decimals: number
  token0IsWeth: boolean
  token1: string
  token1Decimals: number
  token1IsWeth: boolean
  fee: number
  tickLower: number
  tickUpper: number
  amount0Desired: number
  amount0Min: number
  amount1Desired: number
  amount1Min: number
  trustlessMulticall: string
  Rewards: string
}

export interface txIncreaseLiquidityPositionArgs {
  chainID: ChainID
  type: TransactionType.IncreaseLiquidityPosition
  positionID: number
  amount0Change: number
  amount1Change: number
  Rewards: string
  trustlessMulticall: string
}

export interface txDecreaseLiquidityPositionArgs {
  chainID: ChainID
  type: TransactionType.DecreaseLiquidityPosition
  positionID: number
  amount0Min: number
  amount1Min: number
  liquidity: number
  Rewards: string
  trustlessMulticall: string
}

export interface txClaimPositionRewards {
  type: TransactionType.ClaimAllPositionRewards
  positionIDs: number[]
  Market: string
}

export interface txApprovePoolToken {
  type: TransactionType.ApprovePoolToken
  tokenAddress: string
  Rewards: string
  poolAddress: string,
  symbol: string
}

export interface txApproveHue {
  type: TransactionType.ApproveHue
  Hue: string
  spenderAddress: string
}

export interface txApproveLendHue {
  type: TransactionType.ApproveLendHue
  LendHue: string
  spenderAddress: string
}

export interface txVoteProposal {
  type: TransactionType.VoteProposal
  TcpGovernorAlpha: string
  proposalID: number
  support: boolean
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

export type TransactionArgs =
  txCreatePositionArgs |
  txUpdatePositionArgs |
  txLendArgs |
  txWithdrawArgs |
  txCreateLiquidityPositionArgs |
  txIncreaseLiquidityPositionArgs |
  txDecreaseLiquidityPositionArgs |
  txClaimPositionRewards |
  txApprovePoolToken |
  txApproveHue |
  txApproveLendHue |
  txVoteProposal |
  txUpdateTDaoPositionLockDuration |
  txDeleteTDaoPosition |
  txClaimAllTDaoPositionRewards |
  txCreateTDaoAllocationPosition |
  txCreateTDaoPosition

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
    case TransactionType.CreatePosition:
      if (args.debtCount === 0) return 'Create Position without debt'
      return 'Create Position with ' + numDisplay(args.debtCount) + ' Hue debt'
    case TransactionType.UpdatePosition:
      return 'Update position ' + args.positionID
    case TransactionType.Lend:
      return 'Lend ' + args.count + ' Hue'
    case TransactionType.Withdraw:
      return 'Withdraw ' + args.count + ' Hue'
    case TransactionType.ApproveHue:
      return 'Approve Hue'
    case TransactionType.ApproveLendHue:
      return 'Approve Withdraw'
    case TransactionType.CreateLiquidityPosition:
      return 'Create Liquidity Position'
    case TransactionType.IncreaseLiquidityPosition:
      return 'Increase Liquidity Position ' + args.positionID
    case TransactionType.DecreaseLiquidityPosition:
      return 'Decrease Liquidity Position ' + args.positionID
    case TransactionType.ClaimAllPositionRewards:
      return 'Claim All Rewards'
    case TransactionType.ApprovePoolToken:
      return 'Approve ' + args.symbol
    case TransactionType.VoteProposal:
      return 'Vote Proposal ' + args.proposalID
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

    default:
      assertUnreachable(type)
  }
  return ''
}

export const getTxShortName = (type: TransactionType) => {
  switch(type) {
    case TransactionType.CreatePosition:
      return 'Create Position'
    case TransactionType.UpdatePosition:
      return 'Update position'
    case TransactionType.Lend:
      return 'Lend Hue'
    case TransactionType.Withdraw:
      return 'Withdraw Hue'
    case TransactionType.ApproveHue:
      return 'Approve Hue'
    case TransactionType.ApproveLendHue:
      return 'Approve Withdraw'
    case TransactionType.CreateLiquidityPosition:
      return 'Create Liquidity Position'
    case TransactionType.IncreaseLiquidityPosition:
      return 'Increase Liquidity Position'
    case TransactionType.DecreaseLiquidityPosition:
      return 'Decrease Liquidity Position'
    case TransactionType.ClaimAllPositionRewards:
      return 'Claim All Rewards'
    case TransactionType.ApprovePoolToken:
      return 'Approve Token'
    case TransactionType.VoteProposal:
      return 'Vote Proposal'
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
    default:
      assertUnreachable(type)
  }
  return ''
}

export const getTxErrorName = (type: TransactionType) => getTxShortName(type) + ' Failed'

const getDeadline = async (chainID: ChainID, multicallAddress: string) => {
  const trustlessMulticall = getMulticallContract(multicallAddress)
  const transactionTimeout = getDefaultTransactionTimeout(chainID)

  const blockTime = await trustlessMulticall.getCurrentBlockTimestamp()

  return BigNumber.from(blockTime).add(transactionTimeout)
}

const executeTransaction = async (
  args: TransactionArgs,
  provider: ethers.providers.Web3Provider,
): Promise<ContractTransaction> => {
  const getMarket = (address: string) =>
    getContract(address, ProtocolContract.Market)
      .connect(provider.getSigner()) as Market

  const getRewards = (address: string) =>
    getContract(address, ProtocolContract.Rewards)
      .connect(provider.getSigner()) as Rewards

  const getTcpGovernorAlpha = (address: string) =>
    getContract(address, ProtocolContract.TcpGovernorAlpha)
      .connect(provider.getSigner()) as TcpGovernorAlpha

  const getTDao = (address: string) =>
    getContract(address, TDaoRootContract.TDao)
      .connect(provider.getSigner()) as TDao

  const getTcpAllocation = (address: string) =>
    getContract(address, ProtocolContract.TcpAllocation)
      .connect(provider.getSigner()) as TcpAllocation

  const type = args.type

  let deadline
  let rewards

  switch(type) {
    case TransactionType.CreatePosition:
      return await getMarket(args.Market).createPosition(scale(args.debtCount), UIID, {
        value: scale(args.collateralCount)
      })

    case TransactionType.UpdatePosition:
      return await getMarket(args.Market).adjustPosition(
        args.positionID,
        mnt(args.debtIncrease),
        args.collateralIncrease < 0 ? mnt(Math.abs(args.collateralIncrease)) : 0,
        UIID,
        { value: (args.collateralIncrease > 0 ? mnt(args.collateralIncrease) : 0) }
      )
    case TransactionType.Lend:
      return await getMarket(args.Market).lend(scale(args.count))

    case TransactionType.Withdraw:
      return await getMarket(args.Market).unlend(scale(args.count))

    case TransactionType.CreateLiquidityPosition:
      rewards = getRewards(args.Rewards)

      const amount0Desired = bnf(mnt(args.amount0Desired, args.token0Decimals))
      const amount1Desired = bnf(mnt(args.amount1Desired, args.token1Decimals))

      const ethCount = (args.token0IsWeth ? amount0Desired : bnf(0)).add(args.token1IsWeth ? amount1Desired : bnf(0))

      deadline = await getDeadline(args.chainID, args.trustlessMulticall)

      return await rewards.createLiquidityPosition({
        token0: args.token0,
        token1: args.token1,
        fee: args.fee,
        tickLower: args.tickLower,
        tickUpper: args.tickUpper,
        amount0Desired,
        amount0Min: bnf(mnt(args.amount0Min, args.token0Decimals)),
        amount1Desired,
        amount1Min: bnf(mnt(args.amount1Min, args.token1Decimals)),
        recipient: zeroAddress,
        deadline
      },
      UIID,
      {value: ethCount}
    )

    case TransactionType.IncreaseLiquidityPosition:
      rewards = getRewards(args.Rewards)

      deadline = await getDeadline(args.chainID, args.trustlessMulticall)

      return await rewards.increaseLiquidityPosition({
        tokenId: args.positionID,
        amount0Desired: scale(args.amount0Change),
        amount0Min: scale(args.amount0Change * (1 - SLIPPAGE_TOLERANCE)),
        amount1Desired: scale(args.amount1Change),
        amount1Min: scale(args.amount1Change * (2 - SLIPPAGE_TOLERANCE)),
        deadline,
      }, UIID, {
      })

    case TransactionType.DecreaseLiquidityPosition:
      rewards = getRewards(args.Rewards)

      deadline = await getDeadline(args.chainID, args.trustlessMulticall)

      return await rewards.decreaseLiquidityPosition({
        amount0Min: scale(args.amount0Min),
        amount1Min: scale(args.amount1Min),
        tokenId: args.positionID,
        liquidity: scale(args.liquidity),
        deadline,
      }, UIID)

    case TransactionType.ClaimAllPositionRewards:
      return await getMarket(args.Market).claimAllRewards(args.positionIDs, UIID)

    case TransactionType.ApprovePoolToken:
      const tokenContract = new Contract(args.tokenAddress, erc20Artifact.abi, provider) as ERC20

      return await tokenContract.connect(provider.getSigner()).approve(args.Rewards, uint256Max)

    case TransactionType.ApproveHue:
      const hue = new Contract(args.Hue, erc20Artifact.abi, provider) as ERC20
      return await hue.connect(provider.getSigner()).approve(args.spenderAddress, uint256Max)

    case TransactionType.ApproveLendHue:
      const lendHue = new Contract(args.LendHue, erc20Artifact.abi, provider) as ERC20
      return await lendHue.connect(provider.getSigner()).approve(args.spenderAddress, uint256Max)

    case TransactionType.VoteProposal:
      return await getTcpGovernorAlpha(args.TcpGovernorAlpha).castVote(
        args.proposalID,
        args.support
      )

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
        case TransactionType.CreatePosition:
        case TransactionType.UpdatePosition:
          dispatch(clearPositions())
          dispatch(clearBalances())
          break
        case TransactionType.Lend:
        case TransactionType.Withdraw:
          dispatch(clearBalances())
          break
        case TransactionType.CreateLiquidityPosition:
          dispatch(clearLiquidityPositions())
          break
        case TransactionType.IncreaseLiquidityPosition:
        case TransactionType.DecreaseLiquidityPosition:
          break
        case TransactionType.ClaimAllPositionRewards:
          dispatch(clearPositions())
          break
        case TransactionType.ApprovePoolToken:
          dispatch(clearPoolCurrentData(args.poolAddress))
          break
        case TransactionType.ApproveHue:
          dispatch(clearBalances())
          break
        case TransactionType.ApproveLendHue:
          dispatch(clearBalances())
          break
        case TransactionType.VoteProposal:
          dispatch(clearProposals())
          break
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
