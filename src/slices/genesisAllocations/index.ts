import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"
import * as ethers from "ethers"
import { initialState, sliceState, getGenericReducerBuilder } from "../index"

export interface Allocation {
  auth: { r: string; s: string; v: number }
  roundID: number
  count: string
}

interface Allocations {
  [key: string]: Allocation[]
}

export interface genesisAllocationsInfo {
  allocations: Allocations,
  roundCount: number
}

type genesisAllocationsState = sliceState<genesisAllocationsInfo>

interface Round {
  roundID: number,
  signatures: { [key: string]: {
    tokenCount: string,
    signature: string
  }}
}

async function _fetchRound(id: number) {
  const url = `/rounds/${id}.json`
  const round = await fetch(url).then((response) => {
    // parse if found
    if (response.ok) {
      return response.json()
    }
    // return null if missing
    if (response.status === 404) {
      return null
    }
    // raise error on non-404 HTTP errors.
    throw new Error(
      `Request to ${url} failed with status code ${response.status}`
    )
  })
  console.log(`_fetchRound ${id}`, round)
  return round as Round
}

async function _fetchRounds() {
  let id = 0
  async function* iter() {
    // starting at 0,
    // fetch rounds sequentially until payload not found
    while (true) {
      const next = await _fetchRound(id)
      id++
      if (next === null) break
      yield next
    }
  }

  const rounds = []
  for await (const round of iter()) {
    rounds.push(round)
  }
  return {rounds, roundCount: id}
}

export async function fetchAllocations() {
  const {rounds, roundCount} = await _fetchRounds()
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
  return {allocations, roundCount}
}

export const getGenesisAllocations = createAsyncThunk(
  "genesisAllocations/getGenesisAllocations",
  async (_: {}): Promise<genesisAllocationsInfo> => fetchAllocations()
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
