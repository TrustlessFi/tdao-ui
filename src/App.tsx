import { ReactNode, FunctionComponent, useEffect } from 'react'
import { useAppDispatch, useAppSelector as selector } from './app/hooks'
import getProvider from './utils/getProvider'
import PageHeader from './components/PageHeader'
import Genesis from './components/Genesis'
import TDaoPositions from './components/TDaoPositions'
import Governance from './components/Governance'
import ErrorBoundary from './components/library/ErrorBoundary'
import { Switch, Route } from 'react-router-dom'
import { HashRouter as Router } from 'react-router-dom'
import LocalStorageManager from './components/library/LocalStorageManager'
import Notifications from './components/Notifications'
import RecentTransactions from './components/RecentTransactions'
import SwitchNetwork from './components/SwitchNetwork'
import { TransactionStatus, waitForTransaction} from './slices/transactions'
import { RootState } from './slices/fetchNodes'

import './App.css'
import './styles/night_app.scss'

declare global {
  interface Window {
    ethereum: any
  }
}

export enum Tab {
  Genesis = 'Genesis',
  Positions = 'Positions',
  Tcp = 'Tcp',
  Transactions = 'Transactions',
}

export const tabDisplay: { [key in Tab]?: string } = {
  [Tab.Tcp]: 'Tcp DAO',
}

const tabToRender: { [key in Tab]: ReactNode } = {
  Genesis: <Genesis />,
  Positions: <TDaoPositions />,
  Tcp: <Governance />,
  Transactions: <RecentTransactions />,
}

const App: FunctionComponent<{}> = () => {
  const dispatch = useAppDispatch()
  const transactions = selector((state: RootState) => state.transactions)
  const provider = getProvider()

  // TODO have this filter on only transactions that are relevant to this view: chainID and address
  // use getAllUserTxs helper function
  useEffect(() => {
    const fetchTransactions = () =>
      Promise.all(
        Object.values(transactions)
          .filter(tx => tx.status === TransactionStatus.Pending)
          .map(tx => waitForTransaction(tx, provider, dispatch))
      )

    fetchTransactions()
  }, [])

  return (
    <ErrorBoundary>
      <Router>
        <PageHeader />
        <SwitchNetwork>
          <div style={{ marginTop: 47, padding: 48 }}>
            <Switch>
              {Object.values(Tab).map((tab, index) => {
                const path = '/' + tab.toLowerCase()
                const paths = index === 0 ? ['/', path] : [path]
                return paths.map((path) => (
                  <Route exact={path === '/'} path={path} key={path}>
                    {tabToRender[tab]}
                  </Route>
                ))
              })}
            </Switch>
          </div>
        </SwitchNetwork>
      </Router>
      <Notifications />
      <LocalStorageManager />
    </ErrorBoundary>
  )
}

export default App
