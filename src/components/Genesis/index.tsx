import React, { FunctionComponent } from "react"

import AppTile from "../library/AppTile"
import SimpleTable from "../library/SimpleTable"
import { Button } from "carbon-components-react"

import { useAppSelector as selector, useAppDispatch } from "../../app/hooks"
import {
  getContractWaitFunction,
  waitForGenesisPositions,
  waitForGenesisRounds,
} from "../../slices/waitFor"
import { ProtocolContract } from "../../slices/contracts"

const Genesis: FunctionComponent = () => {
  const dispatch = useAppDispatch()

  const userAddress = selector((state) => state.wallet.address)

  const { debt, liquidity } = waitForGenesisPositions(selector, dispatch) || {
    debt: [],
    liquidity: [],
  }

  const rounds = waitForGenesisRounds(selector, dispatch) || []
  const signatures = [] as string[]
  Object.values(rounds).map((round) =>
    round.entries.map((entry) => signatures.push(entry.signature))
  )
  const contract = getContractWaitFunction(ProtocolContract.TcpAllocation)(
    selector,
    dispatch
  )

  const debtOwners = new Set(debt.map((pos) => pos.owner))
  const liquidityOwners = new Set(liquidity.map((pos) => pos.owner))
  const genesisParticipants = Array.from(debtOwners).filter((debtOwner) =>
    liquidityOwners.has(debtOwner)
  )
  const rows = genesisParticipants.map((address: string) => ({
    key: address,
    data: { address },
  }))

  const onClaimClick = () => {
    console.log("clicked")
  }

  return (
    <>
      <AppTile title="Genesis" className="genesis">
        <div style={{ marginBottom: 32 }}>
          <Button kind={"primary"} onClick={onClaimClick}>
            Claim Tokens
          </Button>
        </div>
        <SimpleTable rows={rows} />
      </AppTile>
    </>
  )
}

export default Genesis
