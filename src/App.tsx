import React, { ReactNode } from "react"
import PageHeader from "./components/PageHeader"
import Genesis from "./components/Genesis"
import ErrorBoundary from "./components/library/ErrorBoundary"
import { Switch, Route, Redirect } from "react-router-dom"
import { HashRouter as Router } from "react-router-dom"
import LocalStorageManager from "./components/utils/LocalStorageManager"
import AppModal from "./components/AppModal"
import Notifications from "./components/Notifications"

import "./App.css"
import "./styles/night_app.scss"

declare global {
  interface Window {
    ethereum: any
  }
}

export enum Tab {
  Genesis = "Genesis"
}

const tabToRender: { [key in Tab]: ReactNode } = {
  Genesis: <Genesis />
}

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <PageHeader />
        <div style={{ marginTop: 47, padding: 48 }}>
          <Switch>
            {Object.values(Tab).map((tab, index) => {
              const path = "/" + tab.toLowerCase()
              return (
                <Route path={path} key={index}>
                  {tabToRender[tab]}
                </Route>
              )
            })}
            <Route path={`/`} key={"default"}>
              <Redirect to={`/${Object.values(Tab)[0].toLowerCase()}`} />
            </Route>
          </Switch>
        </div>
      </Router>
      <Notifications />
      <LocalStorageManager />
      <AppModal />
    </ErrorBoundary>
  )
}

export default App
