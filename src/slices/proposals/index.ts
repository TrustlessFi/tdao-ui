import { sliceState } from '../'
import { ContractsInfo } from '../contracts'
import { GovernorAlpha, ProtocolToken } from '@trustlessfi/typechain'
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
  ProposalState.Defeated,
  ProposalState.Succeeded,
  ProposalState.Queued,
  ProposalState.Executed,
  ProposalState.Canceled,
  ProposalState.Expired,
]

export const proposalStateToStateID = (state: ProposalState) => stateList.indexOf(state)

export const proposalStateIDToState = (id: number) => {
  enforce(0 <= id && id < stateList.length, 'Invalid state id')
  return stateList[id]
}

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
}

export interface proposalsInfo {
  quorum: number,
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
  governorAlpha: GovernorAlpha,
  votingToken: ProtocolToken,
  trustlessMulticall: string
): Promise<proposalsInfo> => {
  const multicall = getMulticallContract(trustlessMulticall)

  const result = await governorAlpha.getProposalInfo(1, userAddress)
  console.log({result})

  const { proposals, votingTokenDecimals, } = await executeMulticalls(
    multicall,
    {
      proposals: oneContractManyFunctionMC(
        governorAlpha,
        {
          getProposalInfo: (result: any) => result as PromiseType<ReturnType<GovernorAlpha['getProposalInfo']>>,
          quorumVotes: rc.BigNumber,
        },
        { getProposalInfo: [1, userAddress] },
      ),
      votingTokenDecimals: oneContractManyFunctionMC(votingToken, { decimals: rc.Number }),
    }
  )

  console.log({proposals})

  const decimals = votingTokenDecimals.decimals
  const proposal = proposals.getProposalInfo

  return {
    quorum: unscale(proposals.quorumVotes, decimals),
    proposals: {1:
        {
          proposal: {
            id: proposal.id,
            title: proposal.title,
            ipfsHash: proposal.ipfsHash,
            proposer: proposal.proposer,
            eta: proposal.eta,
            targets: proposal.targets,
            signatures: proposal.signatures,
            calldatas: proposal.calldatas,
            startBlock: proposal.startBlock,
            endBlock: proposal.endBlock,
            forVotes: unscale(proposal.forVotes, decimals),
            againstVotes: unscale(proposal.againstVotes, decimals),
            canceled: proposal.canceled,
            executed: proposal.executed,
            state: proposalStateIDToState(proposal.state),
          },
          receipt: {
            hasVoted: proposal.hasVoted,
            support: proposal.support,
            rewardReceived: proposal.rewardReceived,
            votes: unscale(proposal.votes, decimals),
          },
          votingPower: unscale(proposal.votingPower, decimals),
        }

    }
    /*
    proposals: Object.fromEntries(proposals.getProposalInfo.map(proposal =>
      [
        proposal.id,
        {
          proposal: {
            id: proposal.id,
            title: proposal.title,
            ipfsHash: proposal.ipfsHash,
            proposer: proposal.proposer,
            eta: proposal.eta,
            targets: proposal.targets,
            signatures: proposal.signatures,
            calldatas: proposal.calldatas,
            startBlock: proposal.startBlock,
            endBlock: proposal.endBlock,
            forVotes: unscale(proposal.forVotes, decimals),
            againstVotes: unscale(proposal.againstVotes, decimals),
            canceled: proposal.canceled,
            executed: proposal.executed,
            state: proposalStateIDToState(proposal.state),
          },
          receipt: {
            hasVoted: proposal.hasVoted,
            support: proposal.support,
            rewardReceived: proposal.rewardReceived,
            votes: unscale(proposal.votes, decimals),
          },
          votingPower: unscale(proposal.votingPower, decimals),
        }
      ]
    ))
    */
  }
}
