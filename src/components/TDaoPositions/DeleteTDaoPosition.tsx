import { useParams } from 'react-router';
import {
  waitForTDaoPositions,
  waitForTDaoInfo,
} from '../../slices/waitFor'
import { TransactionType } from '../../slices/transactions'
import CreateTransactionButton from '../utils/CreateTransactionButton'
import { useAppDispatch, useAppSelector as selector } from '../../app/hooks'
import TDaoPositionDisplay from '../library/TDaoPositionDisplay'
import Breadcrumbs from '../library/Breadcrumbs'
import InputPicker from '../library/InputPicker'
import { PositionUpdateOptions } from './'
import TwoColumnDisplay from '../utils/TwoColumnDisplay'
import LargeText from '../utils/LargeText'
import ParagraphDivider from '../utils/ParagraphDivider'

interface MatchParams {
  positionID: string
}

const DeleteTDaoPosition = () => {
  const params: MatchParams = useParams()
  const dispatch = useAppDispatch()

  const positionID = params.positionID

  const positions = waitForTDaoPositions(selector, dispatch)
  const tdaoInfo = waitForTDaoInfo(selector, dispatch)
  const tdao =  selector((state) => state.chainID.tdao)

  const dataNull =
    positions === null ||
    tdaoInfo === null ||
    tdao === null

  const position = positions === null ? null : positions[positionID]

  const columnOne =
    <>
      <div>
        <InputPicker
          options={PositionUpdateOptions}
          initialValue={PositionUpdateOptions.Delete}
          navigation={{
            [PositionUpdateOptions.IncreaseLockTime]: `/positions/${positionID}`
          }}
          width={300}
          label="TDao position update options"
          style={{}}
        />
      </div>
      <CreateTransactionButton
        style={{marginTop: 8}}
        disabled={position === null || !position.canBeUnlocked }
        title={"Delete position " + positionID}
        txArgs={{
          type: TransactionType.DeleteTDaoPosition,
          positionID,
          tdao: tdao === null ? '' : tdao,
        }}
      />
    </>

  const columnTwo =
    position?.canBeUnlocked
    ? <LargeText>
        You are deleting position {positionID} forever, and position {positionID} will no longer accrue
        TDao tokens.
        <ParagraphDivider />
        All unclaimed TDao rewards will be claimed, and {position === null ? '-' : position.count} will
        be returned to your wallet.
      </LargeText>
    : <LargeText>
        Position {positionID} can not be deleted because the lock duration is not complete.
      </LargeText>

  return (
    <>
      <Breadcrumbs crumbs={[{ text: 'Positions', href: '/positions' }, positionID.toString(), 'delete']} />
      {position === null ? null : <TDaoPositionDisplay position={position} width={800} displayRewards={false} />}
      <TwoColumnDisplay
        columnOne={columnOne}
        columnTwo={columnTwo}
        loading={dataNull}
      />
    </>
  )

}

export default DeleteTDaoPosition
