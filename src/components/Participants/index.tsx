import React, { FunctionComponent } from 'react';
import AppTile from '../library/AppTile';
import SimpleTable from "../library/SimpleTable";

const Participants: FunctionComponent = () => {
    const participantList = [{
        key: "something",
        data: {
            "value_1": 1,
            "value_2": 2
        }
    }];

    return (
        <>
            <AppTile title="Participants" className="participants" >
                <SimpleTable rows={participantList} />
            </AppTile>
        </>
    );
}
  
export default Participants;
