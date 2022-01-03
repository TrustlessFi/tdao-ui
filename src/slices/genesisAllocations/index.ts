import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import * as ethers from 'ethers'
import { initialState, sliceState, getGenericReducerBuilder } from '../'
import { ROUND_ID_TO_URI } from '../../constants'

export interface Allocation {
  auth: { r: string; s: string; v: number }
  roundID: string
  count: string
}

interface Allocations {
  [userAddress: string]: Allocation[]
}

export interface genesisAllocationsInfo {
  allocations: Allocations,
  roundIDs: string[]
}

type genesisAllocationsState = sliceState<genesisAllocationsInfo>

interface Round {
  roundID: string,
  signatures: {
    [userAddress: string]: {
      tokenCount: string,
      signature: string
    }
  }
}

interface roundIDtoURI {
  roundIDtoURI: {
    [key: string]: {
      fleekURI: string
      ipfsHash: string
    }
  }
}

const fetchJSON = async <T>(url: string) => {
  return await fetch(url).then(response => {
    // parse if found
    if (response.ok) return response.json()
    // return null if missing
    throw new Error(`Request to ${url} failed with status code ${response.status}`)
  }) as T
}

const fetchRounds = async () => {
  const roundIDToURI = (await fetchJSON<roundIDtoURI>(ROUND_ID_TO_URI)).roundIDtoURI

  return await Promise.all(
    Object.values(roundIDToURI).map(
      uri => fetchJSON<Round>(uri.fleekURI)
    )
  )
}

export const getGenesisAllocations = createAsyncThunk(
  'genesisAllocations/getGenesisAllocations',
  async (_: {}): Promise<genesisAllocationsInfo> => {
    const rounds = await fetchRounds()
    const roundIDs = rounds.map(round => round.roundID)

    const allocations: Allocations = {}
    for (const round of rounds) {
      const { roundID } = round
      for (const [address, {tokenCount, signature}] of Object.entries(round.signatures)) {
        const { r, s, v } = ethers.utils.splitSignature(signature)
        allocations[address] = allocations[address] || []
        allocations[address].push({
          roundID,
          count: tokenCount,
          auth: { r, s, v },
        })
      }
    }

    return { allocations, roundIDs }
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
