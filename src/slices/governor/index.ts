import { Governor } from '@trustlessfi/typechain'
import { RootContract } from '../contracts/ProtocolContract'
import getContract from '../../utils/getContract'
import { thunkArgs, RootState } from '../fetchNodes'
import { createChainDataSlice, CacheDuration } from '../'

export type governorInfo = {
  phase: number
}

const governorSlice = createChainDataSlice({
  name: 'governor',
  dependencies: ['rootContracts'],
  stateSelector: (state: RootState) => state.governor,
  cacheDuration: CacheDuration.NONE,
  thunkFunction:
    async (args: thunkArgs<'rootContracts'>) => {
      const governor = getContract(args.rootContracts.governor, RootContract.Governor) as Governor

      const [
        phase,
      ] = await Promise.all([
        governor.currentPhase(),
      ])

      return { phase }
    }
})

export default governorSlice
