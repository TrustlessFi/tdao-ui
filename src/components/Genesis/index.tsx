import React, { useState } from "react"
import * as ethers from "ethers"
import { Button, TextInput, Form, FormGroup } from "carbon-components-react"
import { CheckmarkFilled20,  ErrorFilled20} from '@carbon/icons-react';
import { red, green, blue } from '@carbon/colors';

import Text from "../library/Text"
import AppTile from "../library/AppTile"
import SimpleTable from "../library/SimpleTable"
import { unscale, unique } from "../../utils"

import { useAppSelector as selector, useAppDispatch } from "../../app/hooks"
import {
  waitForGenesisPositions,
  waitForGenesisAllocations,
} from "../../slices/waitFor"
import { waitForGenesisClaimAllocations } from "../../slices/genesis"

const Genesis: React.FunctionComponent = () => {
  const dispatch = useAppDispatch()
  const downloadRef = React.createRef<HTMLAnchorElement>()

  const chainID = selector((state) => state.chainID.chainID)
  const userAddress = selector((state) => state.wallet.address)
  // process debt and liquidity
  const { debt, liquidity } = waitForGenesisPositions(selector, dispatch) || {
    debt: [],
    liquidity: [],
  }
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

  // process genesis allocations
  const allAllocations = waitForGenesisAllocations(selector, dispatch) || {}
  const allocations = userAddress ? allAllocations[userAddress] || [] : []
  const genesisAllocation = selector((state) => state.chainID.genesisAllocation)

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

  const userAndEligibleOwners =
    userAddress === null
    ? eligibleOwners
    : (debtOwners.includes(userAddress)
      ? eligibleOwners
      : [{address: userAddress, debt: false, liquidity: false}].concat(eligibleOwners)
    )

  const booleanIcon = (value: boolean) =>
    value
    ? <CheckmarkFilled20 color={green[50]} />
    : <ErrorFilled20 color={red[50]}/>

  const eligibilityRows = userAndEligibleOwners
    .filter(data => addressFilter === "" || data.address.indexOf(addressFilter) > -1)
    .map(({address, liquidity, debt }, index) => {
      return {
        key: index,
        data: {
          Address: address === userAddress ? <Text bold color={blue[50]}>{address}</Text> : address,
          'Borrowed Hue': booleanIcon(debt),
          'Provided Uniswap Liquidity': booleanIcon(liquidity),
        },
      }
    })

  const allocationRows = allocations.map(({ roundID, count }) => ({
    key: `${roundID}-${count}`,
    data: {
      "Round ID": roundID,
      "Tokens Allocated": unscale(ethers.BigNumber.from(count)),
    },
  }))

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
      download: `genesis-${_dateString(new Date())}-${chainID}.json`,
    }
  }
  const downloadClick = (event: React.MouseEvent) => {
    const hiddenAnchorElement = downloadRef.current
    if (!hiddenAnchorElement) return
    if (downloadDisabled) return
    hiddenAnchorElement.click()
  }

  // claim url
  const claimDisabled = genesisAllocation === null || allocations.length === 0
  const claimClick = () => {
    if (claimDisabled) return
    if (claimDisabled) return
    if (genesisAllocation === null) return
    dispatch(waitForGenesisClaimAllocations({ genesisAllocation, allocations }))
  }

  return (
    <>
      <AppTile title={`Tcp Genesis Address Eligibility (${Object.values(eligibleOwners).length})`} className="genesis-eligibility">
        <div style={{ display: "flex", marginBottom: "5px" }}>
          <div style={{ flex: 1 }}>
            <TextInput
              id={"address-search"}
              hideLabel={true}
              labelText={"Search"}
              placeholder={"Search for address"}
              value={addressFilter}
              onChange={(event) => setAddressFilter(event.target.value)}
              light={true}
              size={"sm"}
            />
          </div>
          <div>
            <Button
              kind={"primary"}
              onClick={claimClick}
              disabled={claimDisabled}
              size={"sm"}
            >
              Claim
            </Button>
            <Button
              kind={"secondary"}
              disabled={downloadDisabled}
              onClick={downloadClick}
              size={"sm"}
            >
              Save
            </Button>
          </div>
        </div>
        <SimpleTable rows={eligibilityRows} />
      </AppTile>
      <div style={{ display: "none" }}>
        <h3>Allocation</h3>
        <SimpleTable rows={allocationRows} />
      </div>
      <a {...downloadAnchorProps}>Hidden Genesis Data Download Link</a>
    </>
  )
}

const _dateString = (date: Date) => {
  const year = date.getFullYear()
  const month = date.getMonth()
  const day = date.getDay()
  const hour = date.getHours()
  const minutes = date.getMinutes()
  const seconds = date.getSeconds()
  return `${year}${month}${day}${hour}${minutes}${seconds}`
}

export default Genesis
