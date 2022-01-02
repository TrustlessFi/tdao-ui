import { Row, Col } from 'react-flexbox-grid'
import React, { useState } from "react"
import { Button, TextInput, DataTableSkeleton } from "carbon-components-react"
import { CheckmarkOutline16, ErrorOutline16} from '@carbon/icons-react';
import { red, green, blue } from '@carbon/colors';

import Text from "../library/Text"
import Center from '../library/Center'
import CreateTransactionButton from '../library/CreateTransactionButton'
import AppTile from '../library/AppTile'
import SimpleTable from '../library/SimpleTable'
import SpacedList from '../library/SpacedList'
import ConnectWalletButton from '../library/ConnectWalletButton'
import { unscale, unique, numDisplay, bnf, notNullString, first } from "../../utils"
import { TransactionType } from '../../slices/transactions'
import { Allocation } from '../../slices/genesisAllocations'

import { useAppSelector as selector, useAppDispatch } from "../../app/hooks"
import {
  waitForGenesisPositions,
  waitForGenesisAllocations,
  waitForClaimedAllocationRounds,
} from "../../slices/waitFor"

const BooleanIcon: React.FunctionComponent<{
  isTrue: boolean,
}> = ({ isTrue }) => {
  return isTrue
    ? <CheckmarkOutline16 color={green[50]} />
    : <ErrorOutline16 color={red[50]} />
}

const ClaimGenesisAllocationsPanel: React.FunctionComponent = () => {
  const dispatch = useAppDispatch()

  const allocations = waitForGenesisAllocations(selector, dispatch)
  const claimedAllocationRounds = waitForClaimedAllocationRounds(selector, dispatch)
  const userAddress = selector(state => state.wallet.address)
  const genesisAllocation = selector(state => state.chainID.genesisAllocation)
  const allocationsLoading = selector(state => state.genesisAllocations.loading)

  const dataNull =
    allocations === null ||
    claimedAllocationRounds === null ||
    userAddress === null ||
    genesisAllocation === null

  console.log({allocations, claimedAllocationRounds, userAddress})

  // process genesis allocations
  const userAllocations =
    userAddress === null || allocations === null || allocations.allocations[userAddress] === undefined
    ? []
    : allocations.allocations[userAddress]

  let totalCount = 0
  const unclaimedRoundIDs: string[] = []
  const unclaimedAllocations: Allocation[] = []

  const allocationRows = userAllocations.map(({ roundID, count }, index) => {
    console.log({roundID, count, claimedAllocationRounds, claimed: claimedAllocationRounds === null ? null : claimedAllocationRounds[roundID]})



    const claimed = claimedAllocationRounds === null ? false : claimedAllocationRounds[roundID]
    const unscaledCount = unscale(bnf(count))
    if (!claimed) {
      const allocationsForRoundID = userAllocations.filter(ua => ua.roundID === roundID)
      if (allocationsForRoundID.length > 1) throw new Error(`more than 1 sig found for round ${roundID}`)
      if (allocationsForRoundID.length > 0) {
        totalCount += unscaledCount
        unclaimedRoundIDs.push(roundID)
        unclaimedAllocations.push(first(allocationsForRoundID))
      }
    }

    return {
      key: index,
      data: {
        "Round ID": roundID,
        "Claimable Tcp": numDisplay(unscaledCount),
        "Claimed": <BooleanIcon isTrue={claimed} />,
      },
    }
  })

  const claimAllocationButton =
    <CreateTransactionButton
      style={{}}
      disabled={dataNull || totalCount === 0 }
      size='sm'
      title='Claim'
      txArgs={{
        type: TransactionType.ClaimGenesisAllocations,
        genesisAllocation: notNullString(genesisAllocation),
        allocations: unclaimedAllocations,
        roundIDs: unclaimedRoundIDs,
      }}
    />

  return (
      <AppTile title='Claim Genesis Tcp' rightElement={claimAllocationButton}>
        {
          allocationsLoading
          ? <DataTableSkeleton showHeader={false} showToolbar={false} columnCount={3} />
          : <SimpleTable rows={allocationRows} clickable={false} />
        }
      </AppTile>
  )
}

const Genesis: React.FunctionComponent = () => {
  const dispatch = useAppDispatch()
  const downloadRef = React.createRef<HTMLAnchorElement>()

  // process debt and liquidity
  const { debt, liquidity } = waitForGenesisPositions(selector, dispatch) || {
    debt: [],
    liquidity: [],
  }

  const chainID = selector((state) => state.chainID.chainID)
  const userAddress = selector((state) => state.wallet.address)
  const genesisAllocation = selector((state) => state.chainID.genesisAllocation)

  // get debt owners
  const uniqueDebtOwners = unique(debt.map(d => d.owner).sort())

  const debtOwners =
    userAddress === null
    ? uniqueDebtOwners
    : uniqueDebtOwners.sort(address => address === userAddress ? -1 : 1) // float user address to the top

  // get liquidity owners who also have debt
  const liquidityOwners =
    unique(liquidity.map(l => l.owner).sort())
      .filter(l => debtOwners.includes(l))


  // eligibility search box
  const [addressFilter, setAddressFilter] = useState("")

  // view data
  //tables
  const eligibleOwners =
    debtOwners.sort().map(address => ({
      address,
      debt: true,
      liquidity: liquidityOwners.includes(address),
    })
  )

  const eligibilityRows = eligibleOwners
    .filter(data => addressFilter === "" || data.address.indexOf(addressFilter) > -1)
    .map(({address, liquidity, debt }, index) => {
      return {
        key: index,
        data: {
          Address: address === userAddress ? <Text bold color={blue[50]}>{address}</Text> : address,
          'Borrowed Hue': <BooleanIcon isTrue={debt} />,
          'Provided Uniswap Liquidity': <BooleanIcon isTrue={liquidity} />,
        },
      }
    })

  //download url
  const downloadDisabled =
    genesisAllocation === null ||
    (debt.length === 0 && liquidity.length === 0) ||
    !chainID
  let downloadAnchorProps = {
    style: { textDecoration: "none", color: "inherit" },
    ref: downloadRef,
    hidden: true,
  } as React.HTMLProps<HTMLAnchorElement>
  if (!downloadDisabled) {
    const data = {
      chainID,
      genesisAllocationAddress: genesisAllocation,
      liquidityPositions: liquidityOwners,
      debtPositions: debtOwners,
    }
    const blob = new Blob([JSON.stringify(data)], { type: "text/json" })
    downloadAnchorProps = {
      ...downloadAnchorProps,
      href: URL.createObjectURL(blob),
      download: `genesis-${_dateString(new Date())}_${chainID}.json`,
    }
  }
  const downloadClick = () => {
    const hiddenAnchorElement = downloadRef.current
    if (!hiddenAnchorElement) return
    if (downloadDisabled) return
    hiddenAnchorElement.click()
  }

  const userDebtEligible = userAddress === null ? false : debtOwners.includes(userAddress)
  const userLiquidityEligible = userAddress === null ? false : liquidityOwners.includes(userAddress)

  const total = (userDebtEligible ? 50 : 0) + (userLiquidityEligible ? 50 : 0)

  return (
    <SpacedList spacing={32} >
      <AppTile title={`Your Genesis Eligibility: ${total}%`}>
        <div style={{paddingBottom: 32}}>
          {userAddress === null
            ? <Center><ConnectWalletButton size='sm' /></Center>
            : <>
                <Col xs={8} style={{marginLeft: 32}}>
                  <Row middle="xs">
                    <Col style={{marginRight: 8}}><Text>Borrowed Hue: </Text></Col>
                    <Col><BooleanIcon isTrue={userDebtEligible} /></Col>
                  </Row>
                  <Row middle="xs">
                    <Col style={{marginRight: 8}}><Text>Also Provided Uniswap Liquidity: </Text></Col>
                    <Col><BooleanIcon isTrue={userLiquidityEligible} /></Col>
                  </Row>
                </Col>
              </>
          }
        </div>
      </AppTile>
      <ClaimGenesisAllocationsPanel />
      <AppTile
        title={`Tcp Genesis Address Eligibility (${Object.values(eligibleOwners).length})`}
        rightElement={
          <Button
            kind={"secondary"}
            disabled={downloadDisabled}
            onClick={downloadClick}
            size={"sm"}>
            Download JSON
          </Button>
        }
        className="genesis-eligibility">

        <div style={{ display: 'flex', marginBottom: 8 }}>
          <div style={{ flex: 1 }}>
            <TextInput
              id={"address-search"}
              hideLabel={true}
              labelText='Search'
              placeholder='filter addresses'
              value={addressFilter}
              onChange={(event) => setAddressFilter(event.target.value)}
              light={true}
              size={"sm"}
            />
          </div>
        </div>
        <SimpleTable rows={eligibilityRows} size="compact" clickable={false} />
      </AppTile>

      <a {...downloadAnchorProps}>Hidden Genesis Data Download Link</a>
    </SpacedList>
  )
}

const _dateString = (date: Date) => {
  const year = date.getFullYear()
  const month = date.getMonth()
  const day = date.getDay()
  const hour = date.getHours()
  const minutes = date.getMinutes()
  const seconds = date.getSeconds()
  return `${year}-${month}-${day}_${hour}-${minutes}-${seconds}`
}

export default Genesis
