import * as ethers from 'ethers'
import { fetchJSON } from '../../utils'
import { ChainID } from "@trustlessfi/addresses"
import { thunkArgs, RootState } from '../fetchNodes'
import { createChainDataSlice, CacheDuration } from '../'

const chainIDToRoundData: {[chainID in ChainID]: string} = {
  [ChainID.Rinkeby]: 'https://gist.githubusercontent.com/TrustlessOfficial/2d9d275d05ae66cff0be17091d5abe74/raw',
  [ChainID.Hardhat]: 'https://gist.githubusercontent.com/TrustlessOfficial/7c58aee4e69cbd512d5a0e8afe172d1c/raw',
}

interface auth { r: string; s: string; v: number }

const authFromSignature = (signature: string): auth => {
  const { r, s, v } = ethers.utils.splitSignature(signature)
  return { r, s, v }
}

interface Round {
  roundID: string
  count: number
  signatures: {
    [userAddress: string]: {
      tokenCount: string
      signature: string
    }
  }
}

interface roundIDtoURI {
  roundIDtoURI: {
    [roundID: string]: {
      fleekURI: string
      ipfsHash: string
    }
  }
}

export interface UserGenesisAllocation {
  auth: auth
  count: string
  roundID: string
}

export interface genesisAllocationsInfo {
  [roundID: string]: {
    roundID: string
    count: number
    userToAllocation: { [userAddress: string]: UserGenesisAllocation }
  }
}

export interface currentChainInfo {
  blockNumber: number
  blockTimestamp: number
  chainID: number
}

const genesisAllocationsSlice = createChainDataSlice({
  name: 'genesisAllocations',
  dependencies: ['chainID'],
  stateSelector: (state: RootState) => state.genesisAllocations,
  cacheDuration: CacheDuration.NONE,
  thunkFunction:
    async (args: thunkArgs<'chainID'>) => {
    // fetch urls for all rounds
    const rounds = (await fetchJSON<roundIDtoURI>(chainIDToRoundData[args.chainID]))

    // fetch all round files
    const allRounds = await Promise.all(
      Object.values(rounds.roundIDtoURI).map(
        uri => fetchJSON<Round>(uri.fleekURI)
      )
    )

    return (
      Object.fromEntries(allRounds.map(round => [
        round.roundID,
        {
          roundID: round.roundID,
          count: round.count,
          userToAllocation: Object.fromEntries(Object.entries(round.signatures).map(
            ([userAddress, { tokenCount, signature }]) => [
              userAddress,
              {
                roundID: round.roundID,
                count: tokenCount,
                auth: authFromSignature(signature)
              }
            ]
          ))
        }
      ]))
    )
    }
})

export default genesisAllocationsSlice
