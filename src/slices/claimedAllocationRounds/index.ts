import getContract, { getMulticallContract} from '../../utils/getContract'
import { executeMulticalls, rc, oneContractOneFunctionMC } from '@trustlessfi/multicall'
import { GenesisAllocation } from '@trustlessfi/typechain'
import { RootContract } from '../contracts/ProtocolContract'
import { thunkArgs, RootState } from '../fetchNodes'
import { createChainDataSlice, CacheDuration } from '../'

export interface claimedAllocationRounds {
  [roundID: string]: boolean
}

const claimedAllocationRoundsSlice = createChainDataSlice({
  name: 'claimedAllocationRounds',
  dependencies: ['rootContracts', 'genesisAllocations', 'userAddress'],
  stateSelector: (state: RootState) => state.claimedAllocationRounds,
  cacheDuration: CacheDuration.LONG,
  reducers: {
    clearClaimedAllocationRounds: (state) => {
      state.value = null
    },
  },
  thunkFunction:
    async (args: thunkArgs<'rootContracts' | 'genesisAllocations' | 'userAddress'>) => {
      const multicall = getMulticallContract(args.rootContracts.trustlessMulticall)
      const genesisAllocation = getContract(args.rootContracts.genesisAllocation, RootContract.GenesisAllocation) as GenesisAllocation
      const roundIDs = Object.keys(args.genesisAllocations)

      const result = await executeMulticalls(
        multicall,
        {
          claimedRounds: oneContractOneFunctionMC(
            genesisAllocation,
            'claimedSig',
            rc.Boolean,
            Object.fromEntries(roundIDs.map(roundID => [roundID, [args.userAddress, roundID]])),
          ),
        }
      )
      return result.claimedRounds
    },
})

export const { clearClaimedAllocationRounds } = claimedAllocationRoundsSlice.slice.actions

export default claimedAllocationRoundsSlice
