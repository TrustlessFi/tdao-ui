import React, { FunctionComponent } from "react"
import AppTile from "../library/AppTile"
import SimpleTable from "../library/SimpleTable"
import { useAppSelector as selector, useAppDispatch } from "../../app/hooks"
import {
  waitForGenesisPositions,
  waitForGenesisRounds,
} from "../../slices/waitFor"

const Participants: FunctionComponent = () => {
  const dispatch = useAppDispatch()

  const { debt, liquidity } = waitForGenesisPositions(selector, dispatch) || {
    debt: [],
    liquidity: [],
  }
  const rounds = waitForGenesisRounds(selector, dispatch) || []

  const debtOwners = new Set(debt.map((pos) => pos.owner))
  const liquidityOwners = new Set(liquidity.map((pos) => pos.owner))
  const genesisParticipants = Array.from(debtOwners).filter((debtOwner) =>
    liquidityOwners.has(debtOwner)
  )
  const rows = genesisParticipants.map((address: string) => ({
    key: address,
    data: { address },
  }))

  return (
    <>
      <AppTile title="Genesis" className="genesis">
        <SimpleTable rows={rows} />
      </AppTile>
    </>
  )
}

export default Participants
