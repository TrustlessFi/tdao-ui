import { PromiseType } from "@trustlessfi/utils"
import {
  Accounting,
  HuePositionNFT,
  TrustlessMulticallViewOnly,
} from "@trustlessfi/typechain"
import { BigNumber, BigNumberish } from "ethers"
import {
  executeMulticalls,
  getDuplicateFuncMulticall,
} from "@trustlessfi/multicall"

// DEBT
type BaseDebtPosition = PromiseType<ReturnType<Accounting["getPosition"]>> & {
  id: string
}
export type BaseDebtPositionWithOwner = BaseDebtPosition & { owner: string }
export interface DebtPosition {
  owner: string
  id: string
}
interface DebtPositionContracts {
  accounting: Accounting
  huePositionNFT: HuePositionNFT
  trustlessMulticall: TrustlessMulticallViewOnly
}

async function _fetchGenesisBaseDebtPositions({
  contracts,
  positionIDs,
}: {
  contracts: DebtPositionContracts
  positionIDs: BigNumber[]
}) {
  // fetch all positions via multicall
  const { accounting, trustlessMulticall } = contracts
  const data = await executeMulticalls(trustlessMulticall, {
    positions: getDuplicateFuncMulticall(
      accounting,
      "getPosition",
      (result: any) =>
        result as PromiseType<ReturnType<Accounting["getPosition"]>>,
      Object.fromEntries(
        positionIDs.map((positionID) => [positionID.toString(), [positionID]])
      )
    ),
  })

  // embed position id into debt position data
  const positions = Object.entries(data.positions).map(
    ([positionID, position]) => ({ ...position, id: positionID })
  )

  console.log(`_fetchGenesisBaseDebtPositions`, positions)
  return { contracts, positions }
}

async function _filterPositiveGenesisDebtPositions<T extends BaseDebtPosition>({
  contracts,
  positions,
}: {
  contracts: DebtPositionContracts
  positions: T[]
}) {
  //filter positions with positive debt
  const filteredPositions = positions.filter((position) =>
    position.debt.gt(BigNumber.from(0))
  )

  console.log(`_filterPositiveGenesisDebtPositions`, filteredPositions)
  return { contracts, positions: filteredPositions }
}

async function _fetchGenesiBaseDebtPositionOwners({
  contracts,
  positions,
}: {
  contracts: DebtPositionContracts
  positions: BaseDebtPosition[]
}) {
  // fetch all position owners via multicall
  const { trustlessMulticall, huePositionNFT } = contracts
  const { owners } = await executeMulticalls(trustlessMulticall, {
    owners: getDuplicateFuncMulticall(
      huePositionNFT,
      "ownerOf",
      (result: any) =>
        result as PromiseType<ReturnType<HuePositionNFT["ownerOf"]>>,
      Object.fromEntries(
        positions.map((position, index) => [index, [position.id]])
      )
    ),
  })

  // embed owner into position data
  const positionsWithOwners = positions.map((position, index) => ({
    ...position,
    owner: owners[index],
  }))

  console.log(`_fetchGenesiBaseDebtPositionOwners`, positionsWithOwners)
  return { contracts, positions: positionsWithOwners }
}

function _convertBaseDebtPositions({
  contracts,
  positions,
}: {
  contracts: DebtPositionContracts
  positions: BaseDebtPositionWithOwner[]
}) {
  // convert position into reducer-friendly format
  const converted = positions.map((position) => ({
    id: position.id,
    owner: position.owner,
  }))
  return { contracts, positions: converted }
}

function _bigNumberSlice(start: BigNumberish, end: BigNumberish): BigNumber[] {
  // generates a BigNumber array: [start, ..., end-1]
  const bnStart = BigNumber.from(start)
  const bnEnd = BigNumber.from(end)
  const sliceSize = bnEnd.sub(bnStart)
  return Array.from(Array(sliceSize.toNumber()).keys()).map((key) =>
    BigNumber.from(key)
  )
}

export async function fetchGenesisDebtPositions({
  contracts,
}: {
  contracts: DebtPositionContracts
}) {
  const { huePositionNFT } = contracts

  const total = await huePositionNFT.nextPositionID()
  let positions = [] as DebtPosition[]

  // fetch all debt posiitons in batches
  let curr = BigNumber.from(0)
  while (curr < total) {
    // fetch a batch of positions
    // NOTE: currently fetches everything in one batch
    // generate batch of ids to fetch
    const nextCurr = curr.add(total)
    const positionIDs = _bigNumberSlice(curr, nextCurr)
    curr = nextCurr

    const fetchedPositions = await _fetchGenesisBaseDebtPositions({
      contracts,
      positionIDs,
    })
      .then(_filterPositiveGenesisDebtPositions)
      .then(_fetchGenesiBaseDebtPositionOwners)
      .then(_convertBaseDebtPositions)
      .then(({ positions }) => positions)
    positions.push(...fetchedPositions)
  }

  return positions
}

// LIQUIDITY
type BaseLiquidityPosition = PromiseType<
  ReturnType<Accounting["getPoolPosition"]>
> & { id: string }
export type LiquidityPosition = {
  id: string
  owner: string
}
interface LiquidityPositionContracts {
  trustlessMulticall: TrustlessMulticallViewOnly
  accounting: Accounting
}

async function _fetchGenesisLiquidityPositionIDsFromOwnerIDs({
  contracts,
  ownerIDs,
}: {
  contracts: LiquidityPositionContracts
  ownerIDs: string[]
}) {
  // fetch liquidity position ids via multicall
  const { trustlessMulticall, accounting } = contracts
  const { positions } = await executeMulticalls(trustlessMulticall, {
    positions: getDuplicateFuncMulticall(
      accounting,
      "getPoolPositionNftIdsByOwner",
      (result: any) =>
        result as PromiseType<
          ReturnType<Accounting["getPoolPositionNftIdsByOwner"]>
        >,
      Object.fromEntries(
        ownerIDs.map((ownerID) => [ownerID.toString(), [ownerID]])
      )
    ),
  })
  // flatten ownerID -> [...positionID] map to a list of position IDs.
  const positionIDs = [] as BigNumber[]
  Object.values(positions).map((ownerPositions) =>
    positionIDs.push(...ownerPositions)
  )

  console.log(`_fetchGenesisLiquidityPositionIDsFromOwnerIDs`, positionIDs)
  return { contracts, positionIDs }
}

async function _fetchGenesisLiquidityPositions({
  contracts,
  positionIDs,
}: {
  contracts: LiquidityPositionContracts
  positionIDs: BigNumber[]
}) {
  // fetch liquidity positions via multicall
  const { trustlessMulticall, accounting } = contracts
  const data = await executeMulticalls(trustlessMulticall, {
    positions: getDuplicateFuncMulticall(
      accounting,
      "getPoolPosition",
      (result: any) =>
        result as PromiseType<ReturnType<Accounting["getPoolPosition"]>>,
      Object.fromEntries(
        positionIDs.map((positionID) => [positionID.toString(), [positionID]])
      )
    ),
  })

  // embed position id into returned data
  const positions = Object.entries(data.positions).map(
    ([positionID, position]) => ({ ...position, id: positionID })
  )

  console.log(`_fetchGenesisLiquidityPositions`, positions)
  return { contracts, positions }
}

async function _filterPositiveGenesisLiquidityPositions<
  T extends BaseLiquidityPosition
>({
  contracts,
  positions,
}: {
  contracts: LiquidityPositionContracts
  positions: T[]
}) {
  // filter all positions with a positive liquidity
  const filteredPositions = positions.filter((position) =>
    position.liquidity.gt(BigNumber.from(0))
  )

  console.log(`_filterPositiveGenesisLiquidityPositions`, filteredPositions)
  return { contracts, positions: filteredPositions }
}

async function _convertBaseLiquidityPositions({
  contracts,
  positions,
}: {
  contracts: LiquidityPositionContracts
  positions: BaseLiquidityPosition[]
}) {
  // convert position into a reducer-friendly format
  const converted = positions.map((position) => ({
    id: position.id,
    owner: position.owner,
  }))
  return { contracts, positions: converted }
}

export async function fetchGenesisLiquidityPositions({
  contracts,
  ownerIDs,
}: {
  contracts: LiquidityPositionContracts
  ownerIDs: string[]
}) {
  return await _fetchGenesisLiquidityPositionIDsFromOwnerIDs({
    contracts,
    ownerIDs,
  })
    .then(_fetchGenesisLiquidityPositions)
    .then(_filterPositiveGenesisLiquidityPositions)
    .then(_convertBaseLiquidityPositions)
    .then(({ positions }) => positions)
}

// ROUNDS
interface RoundEntry {
  address: string
  amount: number
}
export interface Round {
  id: number
  entries: RoundEntry[]
}

async function _fetchRound(id: number) {
  const url = `/rounds/${id}.json`
  const round = await fetch(url)
    .then((response) => {
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
    .then((entries) => (entries !== null ? { id, entries } : null))

  console.log(`_fetchRound ${id}`, round)
  return round
}

export async function fetchRounds() {
  async function* iter() {
    // starting at 0,
    // fetch rounds sequentially until payload not found
    let id = 0
    while (true) {
      const next = await _fetchRound(id)
      id += 1
      if (next === null) break
      yield next
    }
  }

  const rounds = []
  for await (const round of iter()) {
    rounds.push(round)
  }
  return rounds
}

// CLAIM
