import { useHistory } from "react-router-dom"
import { useState } from "react"
import { Toggle } from "carbon-components-react"
import { useAppDispatch, useAppSelector as selector } from "../../app/hooks"
import {
  waitForTDaoPositions,
  waitForTcpAllocationInfo,
  waitForBalances,
  waitForContracts,
} from "../../slices/waitFor"
import TDaoPositionDisplay from "../library/TDaoPositionDisplay"
import CreateTransactionButton from "../library/CreateTransactionButton"
import RelativeLoading from "../library/RelativeLoading"
import SpacedList from "../library/SpacedList"
import { TransactionType } from "../../slices/transactions"
import { Button } from "carbon-components-react"
import { numDisplay, sum } from "../../utils"

const ExistingTDaoPositions = () => {
  const dispatch = useAppDispatch()
  const history = useHistory()
  const [isViewAll, setIsViewAll] = useState(false)

  const balances = waitForBalances(selector, dispatch)
  const contracts = waitForContracts(selector, dispatch)
  const tdaoPositions = waitForTDaoPositions(selector, dispatch) || {}
  const tcpAllocationInfo = waitForTcpAllocationInfo(selector, dispatch)
  const tdao = selector((state) => state.chainID.tdao)
  const userAddress = selector((state) => state.wallet.address)

  const tcpBalance =
    balances === null || contracts === null
      ? null
      : balances.tokens[contracts.Tcp].userBalance

  const allPositions = Object.values(tdaoPositions)
  const userPositions = Object.values(allPositions).filter(
    (p) => p.isUserPosition
  )
  const userPositionsWithRewards = userPositions.filter(
    (p) => p.approximateRewards > 0
  )
  const userPositionIdsWithRewards = userPositionsWithRewards.map(
    (p) => p.nftTokenID
  )
  const totalRewards = userPositionsWithRewards
    .map((p) => p.approximateRewards)
    .reduce(sum, 0)
  const positionDisplay = Object.values(allPositions)
    .filter((p) => isViewAll || p.isUserPosition)
    .map((p) => {
      return (
        <TDaoPositionDisplay
          key={`positionDisplay ${p.nftTokenID}`}
          position={p}
          onClick={(positionID: string) =>
            history.push(`/positions/${positionID}`)
          }
        />
      )
    })

  const tokensToBeAllocated =
    tcpAllocationInfo === null
      ? null
      : tcpAllocationInfo.totalAllocation - tcpAllocationInfo.tokensAllocated
  const tokensToBeAllocatedDisplay =
    tokensToBeAllocated === null ? "-" : numDisplay(tokensToBeAllocated)

  const tcpWalletBalanceDisplay =
    contracts === null || balances === null
      ? "-"
      : numDisplay(balances.tokens[contracts.Tcp].userBalance)

  return (
    <SpacedList spacing={16}>
      <div style={{ position: "relative" }}>
        <RelativeLoading
          show={
            (tokensToBeAllocated === null || tcpBalance === null) &&
            userAddress !== null
          }
        />
        <SpacedList row spacing={8}>
          <Button
            disabled={tokensToBeAllocated === null || tokensToBeAllocated === 0}
            onClick={() => history.push(`/positions/allocate/lock/tcp`)}
            style={{ marginBottom: 16 }}
          >
            Stake {tokensToBeAllocatedDisplay} aTcp
          </Button>
          <Button
            disabled={tcpBalance === null || tcpBalance === 0}
            onClick={() => history.push(`/positions/create/tcp`)}
            style={{ marginBottom: 16 }}
          >
            Stake {tcpWalletBalanceDisplay} Tcp From Wallet
          </Button>
          <Toggle
            size={"sm"}
            id={"view-all"}
            labelText={"View"}
            labelA={"Mine"}
            labelB={"All"}
            onClick={() => setIsViewAll(!isViewAll)}
          />
        </SpacedList>
      </div>
      {positionDisplay}
      <CreateTransactionButton
        disabled={
          tcpAllocationInfo === null ||
          tdao == null ||
          userPositionIdsWithRewards.length === 0
        }
        title={`Claim ${numDisplay(totalRewards)} TDao`}
        txArgs={{
          type: TransactionType.ClaimAllTDaoPositionRewards,
          tdao: tdao === null ? "" : tdao,
          positionIDs: userPositionIdsWithRewards,
        }}
      />
    </SpacedList>
  )
}

export default ExistingTDaoPositions
