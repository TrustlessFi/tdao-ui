import { useAppDispatch, useAppSelector as selector } from '../../app/hooks'
import waitFor from '../../slices/waitFor'

import Notification from './Notification'

const Notifications = () => {
  const dispatch = useAppDispatch()

  const {
    notifications,
    userAddress,
    chainID,
  } = waitFor([
    'notifications',
    'userAddress',
    'chainID',
  ], selector, dispatch)

  if (
    Object.values(notifications).length === 0 ||
    userAddress === null ||
    chainID === null
  ) return null

  return (
    <div style={{ position: 'absolute', right: 16, top: 16 }}>
      {Object.values(notifications)
        .filter(notif => notif.userAddress === userAddress)
        .filter(notif => notif.chainID === chainID)
        .sort((a, b) => a.startTimeMS - b.startTimeMS)
        .map(notif => <Notification key={notif.uid} notif={notif} /> )
      }
    </div>
  )
}

export default Notifications
