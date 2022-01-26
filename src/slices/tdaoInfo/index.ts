import getContract, { getMulticallContract } from '../../utils/getContract'
import {
  executeMulticalls,
  rc,
  oneContractManyFunctionMC,
  manyContractOneFunctionMC,
} from '@trustlessfi/multicall'
import { zeroAddress, addressToERC20 } from '../../utils'
import { PromiseType } from '@trustlessfi/utils'
import { TDao } from '@trustlessfi/typechain'
import { TDaoRootContract } from '../contracts/ProtocolContract'
import { thunkArgs, RootState } from '../fetchNodes'
import { createChainDataSlice, CacheDuration } from '../'

export interface tdaoInfo {
  minMonths: number
  maxMonths: number
  monthIncrements: number
  countUnderlyingProtocolTokens: number
  startPeriod: number
  periodLength: number
  firstPeriod: number
  underlyingProtocolTokens: {
    [key in number]: {
      tokenID: number
      address: string
      name: string
      symbol: string
      decimals: number
    }
  }
}

const tdaoInfoSlice = createChainDataSlice({
  name: 'tdao',
  dependencies: ['rootContracts'],
  stateSelector: (state: RootState) => state.tdao,
  cacheDuration: CacheDuration.NONE,
  thunkFunction:
    async (args: thunkArgs<'rootContracts'>) => {
      const tdao = getContract(args.rootContracts.tdao, TDaoRootContract.TDao) as TDao
      const trustlessMulticall = getMulticallContract(args.rootContracts.trustlessMulticall)
      const tokenContract = addressToERC20(zeroAddress)

      const { tdaoInfo } = await executeMulticalls(trustlessMulticall, {
        tdaoInfo: oneContractManyFunctionMC(
          tdao,
          {
            countUnderlyingProtocolTokens: rc.BigNumberToNumber,
            startPeriod: rc.BigNumberToNumber,
            periodLength: rc.BigNumberToNumber,
            firstPeriod: rc.BigNumberToNumber,
            allTokens: (result: any) => result as PromiseType<ReturnType<TDao['allTokens']>>,
          }
        ),
      })

      const tokenAddresses = tdaoInfo.allTokens

      const { name, symbol, decimals } = await executeMulticalls(
        trustlessMulticall,
        {
          name: manyContractOneFunctionMC(tokenContract, tokenAddresses, 'name', rc.String),
          symbol: manyContractOneFunctionMC(tokenContract, tokenAddresses, 'symbol', rc.String),
          decimals: manyContractOneFunctionMC(tokenContract, tokenAddresses, 'decimals', rc.Number),
        },
      )


      return {
        minMonths: 6,
        maxMonths: 48,
        monthIncrements: 3,
        countUnderlyingProtocolTokens: tdaoInfo.countUnderlyingProtocolTokens,
        startPeriod: tdaoInfo.startPeriod,
        periodLength: tdaoInfo.periodLength,
        firstPeriod: tdaoInfo.firstPeriod,
        underlyingProtocolTokens:
          Object.fromEntries(tokenAddresses.map((address, tokenID) => {
            return [tokenID, {
              tokenID,
              address,
              symbol: symbol[address],
              name: name[address],
              decimals: decimals[address],
            }]
          }))
      }
    }
})

export default tdaoInfoSlice
