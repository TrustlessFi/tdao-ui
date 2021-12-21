import { sliceState } from '../'
import { ContractsInfo } from '../contracts'
import { GovernorAlphaWithVotingRewards, ProtocolToken } from '@trustlessfi/typechain'
import { unscale, enforce, PromiseType } from "../../utils"
import { getMulticallContract} from '../../utils/getContract'
import {
  executeMulticalls,
  rc,
  oneContractManyFunctionMC,
} from '@trustlessfi/multicall'

export enum ProposalState {
  Pending = 'Pending',
  Active = 'Active',
  Canceled = 'Canceled',
  Defeated = 'Defeated',
  Succeeded = 'Succeeded',
  Queued = 'Queued',
  Expired = 'Expired',
  Executed = 'Executed',
}

export const stateList = [
  ProposalState.Pending,
  ProposalState.Active,
  ProposalState.Canceled,
  ProposalState.Defeated,
  ProposalState.Succeeded,
  ProposalState.Queued,
  ProposalState.Executed,
  ProposalState.Expired,
]

export const proposalStateToStateID = (state: ProposalState) => stateList.indexOf(state)

export const proposalStateIDToState = (id: number) => {
  enforce(0 <= id && id < stateList.length, 'Invalid state id')
  return stateList[id]
}

export const isVotingCompleteState = (state: ProposalState) =>
  state === ProposalState.Succeeded
  || state === ProposalState.Defeated
  || state === ProposalState.Queued
  || state === ProposalState.Executed

export interface Proposal {
  proposal: {
    id: number
    title: string
    ipfsHash: string
    proposer: string
    eta: number
    targets: string[]
    signatures: string[]
    calldatas: string[]
    startBlock: number
    endBlock: number
    forVotes: number
    againstVotes: number
    initialSupply: number
    canceled: boolean
    executed: boolean
    state: ProposalState,
  },
  receipt: {
    hasVoted: boolean
    support: boolean
    rewardReceived: boolean
    votes: number
  },
  votingPower: number
  votingRewards: number
}

export interface proposalsInfo {
  quorum: number
  inflationPercentage: number
  proposals: {[key in number]: Proposal}
}

export type proposalsArgs = {
  contracts: ContractsInfo
  userAddress: string
  trustlessMulticall: string,
}

export interface ProposalsState extends sliceState<proposalsInfo> {}

export const fetchProposals = async (
  userAddress: string,
  governorAlpha: GovernorAlphaWithVotingRewards,
  votingToken: ProtocolToken,
  trustlessMulticall: string,
  inflationPercentage: number,
): Promise<proposalsInfo> => {
  const multicall = getMulticallContract(trustlessMulticall)

  const { proposals, votingTokenDecimals, } = await executeMulticalls(
    multicall,
    {
      proposals: oneContractManyFunctionMC(
        governorAlpha,
        {
          getProposalsInfo: (result: any) => result as PromiseType<ReturnType<GovernorAlphaWithVotingRewards['getProposalsInfo']>>,
          quorumVotes: rc.BigNumber,
        },
        { getProposalsInfo: [userAddress] },
      ),
      votingTokenDecimals: oneContractManyFunctionMC(votingToken, { decimals: rc.Number }),
    }
  )

  const decimals = votingTokenDecimals.decimals

  return {
    quorum: unscale(proposals.quorumVotes, decimals),
    inflationPercentage,
    proposals: Object.fromEntries(proposals.getProposalsInfo.map(proposal =>
      [
        proposal.id,
        {
          proposal: {
            targets: proposal.targets,
            signatures: proposal.signatures,
            calldatas: proposal.calldatas,
            title: proposal.title,
            ipfsHash: proposal.ipfsHash,
            proposer: proposal.proposer,
            eta: proposal.eta,
            id: proposal.id,
            startBlock: proposal.startBlock,
            endBlock: proposal.endBlock,
            canceled: proposal.canceled,
            executed: proposal.executed,
            forVotes: unscale(proposal.forVotes, decimals),
            againstVotes: unscale(proposal.againstVotes, decimals),
            initialSupply: unscale(proposal.initialSupply, decimals),
            state: proposalStateIDToState(proposal.state),
          },
          receipt: {
            hasVoted: proposal.receipt.hasVoted,
            support: proposal.receipt.support,
            rewardReceived: proposal.receipt.rewardReceived,
            votes: unscale(proposal.receipt.votes, decimals),
          },
          votingPower: unscale(proposal.votingPower, decimals),
          votingRewards: unscale(proposal.votingRewards, decimals)
        },
      ]
    ))
  }
}
