import { GovernorAlphaWithVotingRewards, ProtocolToken } from '@trustlessfi/typechain'
import { enforce, PromiseType, unscale } from "../../utils"
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
}

export interface proposalsInfo {
  quorum: number
  inflationPercentage: number
  proposals: {[proposalID: number]: Proposal}
}

export const fetchProposals = async (
  governorAlpha: GovernorAlphaWithVotingRewards,
  votingToken: ProtocolToken,
  trustlessMulticall: string,
  inflationPercentage: number,
): Promise<proposalsInfo> => {
  const multicall = getMulticallContract(trustlessMulticall)

  const {
    proposals,
    votingTokenDecimals,
  } = await executeMulticalls(
    multicall,
    {
      proposals: oneContractManyFunctionMC(
        governorAlpha,
        {
          getProposals: (result: any) => result as PromiseType<ReturnType<GovernorAlphaWithVotingRewards['getProposals']>>,
          quorumVotes: rc.BigNumber,
        }
      ),
      votingTokenDecimals: oneContractManyFunctionMC(votingToken, { decimals: rc.Number }),
    }
  )

  const decimals = votingTokenDecimals.decimals

  return {
    quorum: unscale(proposals.quorumVotes, decimals),
    inflationPercentage,
    proposals: Object.fromEntries(proposals.getProposals.map(proposal =>
      [
        proposal.id,
        {
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
      ]
    ))
  }
}
