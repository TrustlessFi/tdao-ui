import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import * as ethers from 'ethers'
import { initialState, sliceState, getGenericReducerBuilder } from '../'
import { fetchJSON } from '../../utils'
import { ChainID } from "@trustlessfi/addresses"

const chainIDToRoundData: {[chainID in ChainID]: string} = {
  [ChainID.Rinkeby]: 'https://gist.githubusercontent.com/TrustlessOfficial/2d9d275d05ae66cff0be17091d5abe74/raw',
  [ChainID.Hardhat]: 'https://gist.githubusercontent.com/TrustlessOfficial/7c58aee4e69cbd512d5a0e8afe172d1c/raw',
}

interface auth { r: string; s: string; v: number }

export interface Allocation {
  auth: auth
  count: string
  roundID: string
}

export interface genesisAllocationsInfo {
  [roundID: string]: {
    roundID: string
    count: number
    userToAllocation: {
      [userAddress: string]: Allocation
    }
  }
}

type genesisAllocationsState = sliceState<genesisAllocationsInfo>

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

const fetchRounds = async (chainID: ChainID) => {
  // fetch urls for all rounds
  const rounds = (await fetchJSON<roundIDtoURI>(chainIDToRoundData[chainID]))

  // fetch all round files
  return await Promise.all(
    Object.values(rounds.roundIDtoURI).map(
      uri => fetchJSON<Round>(uri.fleekURI)
    )
  )
}

const authFromSignature = (signature: string): auth => {
  const { r, s, v } = ethers.utils.splitSignature(signature)
  return { r, s, v }
}

export const getGenesisAllocations = createAsyncThunk(
  'genesisAllocations/getGenesisAllocations',
  async (args: {chainID: ChainID}): Promise<genesisAllocationsInfo> => {
    const allRounds = await fetchRounds(args.chainID)
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
)

export const genesisAllocationsSlice = createSlice({
  name: 'genesisAllocations',
  initialState: initialState as genesisAllocationsState,
  reducers: {},
  extraReducers: (builder) => {
    builder = getGenericReducerBuilder(builder, getGenesisAllocations)
  },
})

export default genesisAllocationsSlice.reducer
