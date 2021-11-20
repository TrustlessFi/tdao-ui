import React, { FunctionComponent } from 'react';
import AppTile from '../library/AppTile';
import SimpleTable from "../library/SimpleTable";
import { waitForParticipants } from '../../slices/waitFor';
import { useAppSelector as selector, useAppDispatch } from '../../app/hooks'

const Participants: FunctionComponent = () => {
    const dispatch = useAppDispatch();

    const participants = waitForParticipants(selector, dispatch);
    const addresses = (participants === null) ? [] as string[] : participants.addresses;
    const rows = addresses.map((address: string)=>({key: address, data: {address}}));

    return (
        <>
            <AppTile title="Participants" className="participants" >
                <SimpleTable rows={rows} />
            </AppTile>
        </>
    );
}
  
export default Participants;
