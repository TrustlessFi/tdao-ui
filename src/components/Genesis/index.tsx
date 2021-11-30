import React, { FunctionComponent } from "react"

import AppTile from "../library/AppTile"
import SimpleTable from "../library/SimpleTable"
import { Button } from "carbon-components-react"

import { useAppSelector as selector, useAppDispatch } from "../../app/hooks"
import {
  waitForGenesisPositions,
  waitForGenesisAllocations,
} from "../../slices/waitFor"
import { waitForGenesisClaimAllocations } from "../../slices/genesis"

const Genesis: FunctionComponent = () => {
  const dispatch = useAppDispatch()

  const userAddress = selector((state) => state.wallet.address)

  // process genesis positions
  const { debt, liquidity } = waitForGenesisPositions(selector, dispatch) || {
    debt: [],
    liquidity: [],
  }
  const debtOwners = new Set(debt.map((pos) => pos.owner))
  const liquidityOwners = new Set(liquidity.map((pos) => pos.owner))
  const genesisParticipants = Array.from(debtOwners).filter((debtOwner) =>
    liquidityOwners.has(debtOwner)
  )

  // process genesis allocations
  const allAllocations = waitForGenesisAllocations(selector, dispatch) || {}
  const allocations = userAddress ? allAllocations[userAddress] || [] : []
  const genesisAllocation = selector((state) => state.chainID.genesisAllocation)

  // view data
  const eligibilityRows = genesisParticipants.map((address: string) => ({
    key: address,
    data: { address },
  }))
  const allocationRows = allocations.map(({ roundID, count }) => ({
    key: `${roundID}-${count}`,
    data: {
      roundID,
      count,
    },
  }))
  const onClaimClick = () => {
    if (genesisAllocation === null) return
    dispatch(waitForGenesisClaimAllocations({ genesisAllocation, allocations }))
  }

  return (
    <>
      <AppTile title="Genesis" className="genesis">
        <div style={{ marginBottom: 32 }}>
          <Button kind={"primary"} onClick={onClaimClick}>
            Claim Tokens
          </Button>
        </div>
        <h3>Current Eligibility</h3>
        <SimpleTable rows={eligibilityRows} />
        <h3>Your Allocations</h3>
        <SimpleTable rows={allocationRows} />
      </AppTile>
    </>
  )
}

export default Genesis
