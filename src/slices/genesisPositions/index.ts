import getContract, { getMulticallContract } from "../../utils/getContract"
import { Accounting, HuePositionNFT } from "@trustlessfi/typechain"
import { ProtocolContract } from '../contracts/ProtocolContract'
import {
  DebtPosition,
  fetchDebtPositions,
  fetchLiquidityPositions,
  LiquidityPosition,
} from "./api"
import { thunkArgs, RootState } from '../fetchNodes'
import { createChainDataSlice, CacheDuration } from '../'

export interface genesisPositionsInfo {
  debt: DebtPosition[]
  liquidity: LiquidityPosition[]
}

const genesisPositionsSlice = createChainDataSlice({
  name: 'genesisPositions',
  dependencies: ['contracts', 'rootContracts'],
  stateSelector: (state: RootState) => state.genesisPositions,
  cacheDuration: CacheDuration.NONE,
  thunkFunction:
    async (args: thunkArgs<'contracts' | 'rootContracts'>) => {
      const accounting = getContract(
        args.contracts.Accounting,
        ProtocolContract.Accounting
      ) as Accounting
      const huePositionNFT = getContract(
        args.contracts.HuePositionNFT,
        ProtocolContract.HuePositionNFT
      ) as HuePositionNFT

      const trustlessMulticall = getMulticallContract(args.rootContracts.trustlessMulticall)
      const contracts = { accounting, huePositionNFT, trustlessMulticall }

      const debtPositions = await fetchDebtPositions({ contracts })
      const debtOwnerIDs = Array.from(
        new Set(debtPositions.map((debtPosition) => debtPosition.owner))
      )
      const liquidityPositions = await fetchLiquidityPositions({
        contracts,
        ownerIDs: debtOwnerIDs,
      })

      return {
        debt: debtPositions,
        liquidity: liquidityPositions,
      }
    }
})

export default genesisPositionsSlice
