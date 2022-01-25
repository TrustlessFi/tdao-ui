import { sliceState } from '../'
import { contractsInfo } from '../contracts'
import { GovernorAlphaWithVotingRewards, ProtocolToken } from '@trustlessfi/typechain'
import { unscale, PromiseType } from "../../utils"
import { getMulticallContract} from '../../utils/getContract'
import {
  executeMulticalls,
  rc,
  oneContractManyFunctionMC,
} from '@trustlessfi/multicall'

export interface ProposalVoterInfo {
  id: number
  receipt: {
    hasVoted: boolean
    support: boolean
    rewardReceived: boolean
    votes: number
  }
  votingPower: number
  votingRewards: number
}

export interface proposalsVoterInfo {
  [proposalID: number]: ProposalVoterInfo
}

export const fetchProposalsVoterInfo = async (
  userAddress: string,
  governorAlpha: GovernorAlphaWithVotingRewards,
  votingToken: ProtocolToken,
  trustlessMulticall: string,
): Promise<proposalsVoterInfo> => {
  const multicall = getMulticallContract(trustlessMulticall)

  const { proposals, votingTokenDecimals, } = await executeMulticalls(
    multicall,
    {
      proposals: oneContractManyFunctionMC(
        governorAlpha,
        {
          getProposalsVoterInfo:
            (result: any) => result as PromiseType<ReturnType<GovernorAlphaWithVotingRewards['getProposalsVoterInfo']>>,
        },
        { getProposalsVoterInfo: [userAddress] },
      ),
      votingTokenDecimals: oneContractManyFunctionMC(votingToken, { decimals: rc.Number }),
    }
  )

  const decimals = votingTokenDecimals.decimals

  return Object.fromEntries(proposals.getProposalsVoterInfo.map(proposal =>
    [
      proposal.id,
      {
        id: proposal.id,
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
