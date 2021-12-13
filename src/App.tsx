import React, { ReactNode } from 'react'
import PageHeader from './components/PageHeader'
import Genesis from './components/Genesis'
import TDaoPositions from './components/TDaoPositions'
import ErrorBoundary from './components/library/ErrorBoundary'
import { Switch, Route } from 'react-router-dom'
import { HashRouter as Router } from 'react-router-dom'
import LocalStorageManager from './components/utils/LocalStorageManager'
import Notifications from './components/Notifications'
import RecentTransactions from './components/RecentTransactions'

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
  Transactions = 'Transactions',
  LockTcp = 'LockTcp',
}

export const tabDisplay: { [key in Tab]?: string } = {
  [Tab.LockTcp]: 'Lock Tcp',
}

const tabToRender: { [key in Tab]: ReactNode } = {
  Genesis: <Genesis />,
  Positions: <TDaoPositions />,
  Transactions: <RecentTransactions />,
  LockTcp: <RecentTransactions />,
}

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <PageHeader />
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
      </Router>
      <Notifications />
      <LocalStorageManager />
    </ErrorBoundary>
  )
}

export default App
