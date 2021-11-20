import { PromiseType } from "@trustlessfi/utils";
import { Accounting, HuePositionNFT, TrustlessMulticallViewOnly } from "@trustlessfi/typechain/dist/index";
import { BigNumber } from "ethers";
import { executeMulticalls, getDuplicateFuncMulticall } from "@trustlessfi/multicall";

type DebtPosition = PromiseType<ReturnType<Accounting['getPosition']>>
type DebtPositionWithID = DebtPosition & {id: string}
interface Contracts {
    accounting: Accounting,
    huePositionNFT: HuePositionNFT,
    trustlessMulticall: TrustlessMulticallViewOnly
}

async function fetchDebtPositions({contracts, positionIDs}: {contracts: Contracts, positionIDs: BigNumber[]}) {
    const { accounting, trustlessMulticall } = contracts;
    const data = await executeMulticalls(trustlessMulticall, {
        positions: getDuplicateFuncMulticall(
            accounting,
            'getPosition',
            (result: any) => result as DebtPosition,
            Object.fromEntries(positionIDs.map(positionID => [positionID.toString(), [positionID]]))
        ),
    });
    const positions = Object.entries(data.positions).map(([positionID, position])=>({...position, id: positionID}))
    console.log(`fetchDebtPositions`, positions);
    return {contracts, positions};
}

async function filterDebtPositionsWithPositiveDebt({contracts, positions}: {contracts: Contracts, positions: DebtPositionWithID[]}) {
    const filteredPositions = positions.filter((position)=>(position.debt.gt(BigNumber.from(0))));
    console.log(`filterDebtPositionsWithPositiveDebt`, filteredPositions);
    return {contracts, positions: filteredPositions};
}

async function fetchDebtPositionOwners({contracts, positions}: {contracts: Contracts, positions: DebtPositionWithID[]}) {
    const { trustlessMulticall, huePositionNFT } = contracts;
    const { owners } = await executeMulticalls(trustlessMulticall, {
        owners: getDuplicateFuncMulticall(
            huePositionNFT,
            "ownerOf",
            (result: any) => result as PromiseType<ReturnType<HuePositionNFT["ownerOf"]>>,
            Object.fromEntries(positions.map(position => [position.id.toString(), [position.id]]))
        )
    })
    const uniqueOwners = Array.from(new Set(Object.values(owners)));
    console.log(`fetchDebtPositionOwners`, uniqueOwners);
    return {contracts, ownerIDs: uniqueOwners};
}

async function fetchLiquidityPositionsIDsFromOwnerIDs({contracts, ownerIDs}: {contracts: Contracts, ownerIDs: string[]}) {
    const { trustlessMulticall, accounting } = contracts;
    const { positions } = await executeMulticalls(trustlessMulticall, {
        positions: getDuplicateFuncMulticall(
            accounting,
            "getPoolPositionNftIdsByOwner",
            (result: any) => result as PromiseType<ReturnType<Accounting["getPoolPositionNftIdsByOwner"]>>,
            Object.fromEntries(ownerIDs.map(ownerID => [ownerID.toString(), [ownerID]]))
        )
    })
    const positionIDs = [] as BigNumber[];
    Object.values(positions).map((ownerPositions)=>positionIDs.push(...ownerPositions));
    console.log(`fetchLiquidityPositionsIDsFromOwnerIDs`, positionIDs);
    return {contracts, positionIDs};
}

async function fetchLiquidityPositions({contracts, positionIDs}: {contracts: Contracts, positionIDs: BigNumber[]}) {
    const { trustlessMulticall, accounting } = contracts;
    const data = await executeMulticalls(trustlessMulticall, {
        positions: getDuplicateFuncMulticall(
            accounting,
            "getPoolPosition",
            (result: any) => result as PromiseType<ReturnType<Accounting["getPoolPosition"]>>,
            Object.fromEntries(positionIDs.map(positionID => [positionID.toString(), [positionID]]))
        )
    })
    const positions = Object.entries(data.positions).map(([positionID, position])=>({...position, id: positionID}))
    console.log(`fetchLiquidityPositions`, positions);
    return {contracts, positions}
}

type LiquidityPosition = PromiseType<ReturnType<Accounting['getPoolPosition']>>
type LiquidityPositionWithID = LiquidityPosition & {id: string}
async function filterLiquidityPositionWithPositiveLiquidity({contracts, positions}: {contracts: Contracts, positions: LiquidityPositionWithID[]}) {
    const filteredPositions = positions.filter((position)=>(position.liquidity.gt(BigNumber.from(0))))
    console.log(`filterLiquidityPositionWithPositiveLiquidity`, filteredPositions);
    return {contracts, positions: filteredPositions};
}

async function fetchLiquidityPositionOwners({contracts, positions}: {contracts: Contracts, positions: LiquidityPositionWithID[]}) {
    const ownerIDs = positions.map((position)=>(position.owner));
    console.log(`fetchLiquidityPositionOwners`, ownerIDs);
    return {contracts, ownerIDs};
}

export async function fetchParticipants({contracts}: {contracts: Contracts}) {
    const { huePositionNFT } = contracts;

    const total = await huePositionNFT.nextPositionID();
    let addresses = new Set<string>();

    // fetch all debt posiitons
    let curr = BigNumber.from(0);
    while(curr < total) {
        // fetch a batch of positions
        // NOTE: currently fetches everything in one batch
        const sliceSize = total.sub(curr);
        const positionIDs = Array.from(Array(sliceSize.toNumber()).keys()).map((key)=>BigNumber.from(key));
        curr = curr.add(sliceSize);

        await fetchDebtPositions({contracts, positionIDs})
            .then(filterDebtPositionsWithPositiveDebt)
            .then(fetchDebtPositionOwners)
            .then(fetchLiquidityPositionsIDsFromOwnerIDs)
            .then(fetchLiquidityPositions)
            .then(filterLiquidityPositionWithPositiveLiquidity)
            .then(fetchLiquidityPositionOwners)
            .then(({ownerIDs}) => ownerIDs.map((ownerID) => addresses.add(ownerID)))
    }

    return Array.from(addresses);
}