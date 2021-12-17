import { sliceState } from '../'
import { ContractsInfo } from '../contracts'
import { GovernorAlpha } from '@trustlessfi/typechain'
import { unscale, zeroAddress, enforce, addressToProtocolToken } from "../../utils"

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
    votes: number
  },
  votingPower: number
  voting: boolean
  voted: boolean
}

export interface proposalsInfo {
  quorum: number,
  proposals: {[key in number]: Proposal}
}

export type proposalsArgs = {
  contracts: ContractsInfo
  userAddress: string
}

export interface ProposalsState extends sliceState<proposalsInfo> {}

export const fetchProposals = async (
  userAddress: string,
  governorAlpha: GovernorAlpha,
): Promise<proposalsInfo> => {
  const votingTokenAddress = await governorAlpha.votingToken()
  const votingToken = addressToProtocolToken(votingTokenAddress)
  const decimals = await votingToken.decimals()
  const haveUserAddress = userAddress !== zeroAddress

  const [rawProposalData, quorumVotes] = await Promise.all([
    governorAlpha.getAllProposals(userAddress),
    governorAlpha.quorumVotes(),
  ])

  console.log({rawProposalData})

  const rawProposals = rawProposalData._proposals
  const states = rawProposalData._proposalStates
  const receipts = rawProposalData._receipts
  const quorum = quorumVotes

  const votingPower =
    haveUserAddress
    ? await Promise.all(rawProposals.map(async (proposal, index) => {
        // can't vote anyways if the proposal is in pending state
        if (states[index] === 0) return 0

        const votingPower = await votingToken.getPriorVotes(userAddress, proposal.startBlock)
        return unscale(votingPower)
      }))
    : new Array(rawProposals.length).fill(0)

  return {
    quorum: unscale(quorum, decimals),
    proposals: Object.fromEntries(rawProposals.map((rawProposal, index) =>
      [
        rawProposal.id,
        {
          proposal: {
            id: rawProposal.id,
            ipfsHash: rawProposal.ipfsHash,
            proposer: rawProposal.proposer,
            eta: rawProposal.eta,
            targets: rawProposal.targets,
            signatures: rawProposal.signatures,
            calldatas: rawProposal.calldatas,
            startBlock: rawProposal.startBlock,
            endBlock: rawProposal.endBlock,
            forVotes: unscale(rawProposal.forVotes, decimals),
            againstVotes: unscale(rawProposal.againstVotes, decimals),
            canceled: rawProposal.canceled,
            executed: rawProposal.executed,
            state: proposalStateIDToState(states[index]),
          },
          receipt: {
            hasVoted: receipts[index].hasVoted,
            support: receipts[index].support,
            votes: unscale(receipts[index].votes, decimals),
          },
          voting: false,
          voted: false,
          votingPower: votingPower[index],
        }
      ]
    ))
  }
}
