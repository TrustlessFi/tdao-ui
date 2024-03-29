import React, { useState } from "react"

import { Button, TextInput, DataTableSkeleton } from "carbon-components-react"
import { CheckmarkOutline16, ErrorOutline16} from '@carbon/icons-react';
import { red, green, blue } from '@carbon/colors';

import Center from '../library/Center'
import CreateTransactionButton from '../library/CreateTransactionButton'
import AppTile from '../library/AppTile'
import Text from '../library/Text'
import SimpleTable from '../library/SimpleTable'
import ConnectWalletButton from '../library/ConnectWalletButton'
import { unique, numDisplay, bnf, unscale, sum, isEmpty } from "../../utils"
import { TransactionType } from '../../slices/transactions'
import { UserGenesisAllocation } from '../../slices/genesisAllocations'

import { useAppSelector as selector, useAppDispatch } from "../../app/hooks"
import waitFor from "../../slices/waitFor"

const BooleanIcon: React.FunctionComponent<{
  isTrue: boolean,
  nullState?: boolean,
}> = ({ isTrue, nullState }) => {
  return (
    nullState === true
    ? <ErrorOutline16 />
    : (
      isTrue
        ? <CheckmarkOutline16 color={green[50]} />
        : <ErrorOutline16 color={red[50]} />
    )
  )
}

const ClaimGenesisAllocationsPanel: React.FunctionComponent = () => {
  const dispatch = useAppDispatch()

  const {
    genesisAllocations,
    claimedAllocationRounds,
    userAddress,
    rootContracts,
  } = waitFor([
    'genesisAllocations',
    'claimedAllocationRounds',
    'userAddress',
    'rootContracts',
  ], selector, dispatch)

  const allocationsLoading = selector(state => state.genesisAllocations.loading)

  const dataNull =
    rootContracts === null ||
    claimedAllocationRounds === null ||
    userAddress === null ||
    genesisAllocations === null

  // process genesis allocations
  let totalCountUnclaimed = bnf(0)
  let unclaimedRoundIDs: string[] = []
  let unclaimedAllocations: UserGenesisAllocation[] = []

  const allocationRows =
    claimedAllocationRounds === null || genesisAllocations === null
    ? []
    : Object
      .values(genesisAllocations).sort((a, b) => parseInt(a.roundID) - parseInt(b.roundID))
      .map(({roundID, count, userToAllocation}) => {
        const claimed = claimedAllocationRounds[roundID]
        const allocation = userAddress === null ? undefined : userToAllocation[userAddress]
        const userCount = bnf(allocation !== undefined ? allocation.count : 0)

        if (!claimed && allocation !== undefined && userCount.gt(0)) {
          totalCountUnclaimed = totalCountUnclaimed.add(userCount)
          unclaimedRoundIDs.push(roundID)
          unclaimedAllocations.push(allocation)
        }

        return {
          data: {
            'Round ID': roundID,
            'Total': `${numDisplay(count)} aTcp`,
            'Your Portion': `${numDisplay(unscale(userCount))} aTcp`,
            'Claimed': <BooleanIcon isTrue={claimed} nullState={userCount.isZero()} />,
          },
        }
      })

      console.log({unclaimedAllocations})

  const claimAllocationButton =
    <CreateTransactionButton
      style={{}}
      disabled={dataNull || totalCountUnclaimed.isZero() }
      size='sm'
      title={`Claim ${numDisplay(unscale(totalCountUnclaimed))} aTcp`}
      txArgs={{
        type: TransactionType.ClaimGenesisAllocations,
        genesisAllocation: rootContracts === null ? '' : rootContracts.genesisAllocation,
        allocations: unclaimedAllocations,
        roundIDs: unclaimedRoundIDs,
      }}
    />

  return (
    <AppTile
      title='Claim Genesis aTcp'
      rightElement={claimAllocationButton}>
      {
        allocationsLoading
        ? <DataTableSkeleton showHeader={false} showToolbar={false} columnCount={4} compact />
        : <SimpleTable rows={allocationRows} clickable={false} size='compact' />
      }
    </AppTile>
  )
}

const Genesis: React.FunctionComponent = () => {
  const dispatch = useAppDispatch()
  const downloadRef = React.createRef<HTMLAnchorElement>()

  const {
    chainID,
    userAddress,
    rootContracts,
    genesisPositions,
  } = waitFor([
    'chainID',
    'userAddress',
    'rootContracts',
    'genesisPositions',
  ], selector, dispatch)

  const debt = genesisPositions === null ? [] : genesisPositions.debt
  const liquidity = genesisPositions === null ? [] : genesisPositions.liquidity

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
  const eligibleStatuses =
    debtOwners.sort().map(address => ({
      address,
      debt: true,
      liquidity: liquidityOwners.includes(address),
    })
  )

  const totalDebtPoints =
    isEmpty(eligibleStatuses)
    ? 0
    : (eligibleStatuses.map(o => o.debt ? 1 : 0) as number[]).reduce(sum)

  const totalLiquidityPoints =
    isEmpty(eligibleStatuses)
    ? 0
    : (eligibleStatuses.map(o => o.liquidity ? 1 : 0) as number[]).reduce(sum)

  const totalPoints = totalDebtPoints + totalLiquidityPoints

  const getPointsString = (points: number) => points === 1 ? '1 point' : `${points} points`


  const eligibilityRows = eligibleStatuses
    .filter(data => addressFilter === "" || data.address.indexOf(addressFilter) > -1)
    .map(({address, liquidity, debt }, index) => {
      return {
        key: index,
        data: {
          Address: <Text monospace color={address === userAddress ? blue[50] : undefined}>{address}</Text>,
          'Borrow Hue': <BooleanIcon isTrue={debt} />,
          'Provide Uniswap Liquidity': <BooleanIcon isTrue={liquidity} />,
        },
      }
    })

  eligibilityRows.push({
      key: -1,
      data: {
        Address: <> </>,
        'Borrow Hue': <>{getPointsString(totalDebtPoints)}</>,
        'Provide Uniswap Liquidity': <>{getPointsString(totalLiquidityPoints)}</>,
      },

  })

  //download url
  const downloadDisabled =
    rootContracts === null ||
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
      genesisAllocationAddress: rootContracts === null ? '' : rootContracts.genesisAllocation,
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

  const userPoints = userLiquidityEligible ? 2 : (userDebtEligible ? 1 : 0)
  const userPointsDisplay = userPoints === 1 ? '1 point' : `${userPoints} points`

  const userPortionDisplay = numDisplay((userPoints / totalPoints) * 100) + '%'

  return (
    <>
      <div style={{marginBottom: 32}}>
        <ClaimGenesisAllocationsPanel />
      </div>
      <AppTile
        title={`Your Genesis Eligibility: ${userPointsDisplay}`}
        subTitle={`${userPortionDisplay} of total`}>
        <div style={{paddingBottom: 16, paddingTop: 16}}>
          {userAddress === null
            ? <Center><ConnectWalletButton size='sm' /></Center>
            : <SimpleTable rows={[{data: {
                'Your Address': <Text monospace>{userAddress === null ? '-' : userAddress}</Text>,
                'Borrow Hue': <BooleanIcon isTrue={userDebtEligible} />,
                'Provide Uniswap Liquidity': <BooleanIcon isTrue={userLiquidityEligible} />,
              }},{data:{
                'Your Address': '',
                'Borrow Hue': getPointsString(userDebtEligible ? 1 : 0),
                'Provide Uniswap Liquidity':getPointsString(userLiquidityEligible ? 1 : 0),
              }
            }
          ]} size='compact' clickable={false} />
          }
        </div>
      </AppTile>
      <AppTile
        title={`All Genesis Eligibility: ${numDisplay(totalPoints)} points`}
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
        <SimpleTable rows={eligibilityRows} size='compact' clickable={false} />
      </AppTile>
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
  return `${year}-${month}-${day}_${hour}-${minutes}-${seconds}`
}

export default Genesis
