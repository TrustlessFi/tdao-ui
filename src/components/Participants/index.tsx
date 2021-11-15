import React, { FunctionComponent } from 'react';
import AppTile from '../library/AppTile';
import SimpleTable from "../library/SimpleTable";

const Participants: FunctionComponent = () => {
    const participantList = [];

    const rows = Object.values(participantList).map((participant: LiquidityPosition) => (
        {
            key: lqPos.positionID,
            data: {

            },
            onClick: () => {
                dispatch(clearPoolCurrentData(pool.address))
                dispatch(startEdit({ positionID: lqPos.positionID, }))
            }
        }
    ))
  return (
    <>
      <AppTile title="Participants" className="participants" >
          <SimpleTable rows={rows} />
      </AppTile>
    </>
  );
}
  
export default Participants;
