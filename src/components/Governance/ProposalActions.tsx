import { Row, Col } from 'react-flexbox-grid'
import { CodeSnippet } from "carbon-components-react"
import { BigNumber, ethers } from "ethers"
import { FunctionComponent } from "react"
import { Proposal } from "../../slices/proposals"
import { useAppDispatch, useAppSelector as selector } from '../../app/hooks'
import { waitForContracts } from '../../slices/waitFor'
import { ContractsInfo, ProtocolContract } from '../../slices/contracts'

const getProposalActionsRawString = (
  target: string,
  signature: string,
  calldata: string
) => [
  `target: ${target}`,
  `signature: ${signature}`,
  `calldata: ${calldata}`,
].join('\n')

const getProposalActionsString = (
  contracts: ContractsInfo | null,
  targetAddress: string,
  signature: string,
  calldata: string
): string => {
  const functionName = signature.split('(')[0]
  const functionParams = signature.split('(')[1].split(')')[0].split(',')

  const parameterValues =
    functionParams.length > 0
    ? Object.values(ethers.utils.defaultAbiCoder.decode(functionParams, calldata)).map(value =>
        BigNumber.isBigNumber(value) || value.type === Number
        ? value.toString()
        : value)
    : []

  const populatedSignature = `${functionName}(${parameterValues.join(', ')})`

  const matchingContracts = contracts === null
    ? []
    : Object.keys(contracts || {}).filter(key => contracts[key as ProtocolContract] === targetAddress);

  const targetContractName = matchingContracts.length !== 1 ? targetAddress : matchingContracts[0];

  return `${targetContractName}.${populatedSignature}`
}

const ProposalActionsWrapper: FunctionComponent<{ index: number }> = ({ index, children }) => (
  <Row style={{ marginTop: 8 }} key={index} middle="xs">
    <Col>
    {index + 1}:
    </Col>
    <Col style={{marginLeft: 8}} xs={11}>
      {children}
    </Col>
  </Row>
)

const ProposalActions: FunctionComponent<{
  proposal: Proposal
  showRaw?: boolean,
}> = ({ showRaw = false, proposal }) => {
  const dispatch = useAppDispatch()

  const contracts = waitForContracts(selector, dispatch)

  const p = proposal
  return (
    <Col>
      {p.targets.map((_, index) => {
        return showRaw ? (
          <ProposalActionsWrapper index={index} key={`${p.targets[index]}-${index}`}>
            <CodeSnippet type="multi">
              {getProposalActionsRawString(p.targets[index], p.signatures[index], p.calldatas[index])}
            </CodeSnippet>
          </ProposalActionsWrapper>
        ) : (
          <ProposalActionsWrapper index={index} key={`${p.targets[index]}-${index}`}>
            <CodeSnippet type="single">
              {getProposalActionsString(contracts, p.targets[index], p.signatures[index], p.calldatas[index])}
            </CodeSnippet>
          </ProposalActionsWrapper>
          )
      })}
    </Col>
  )
}

export default ProposalActions
