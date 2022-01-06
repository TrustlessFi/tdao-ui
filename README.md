This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app), using the [Redux](https://redux.js.org/) and [Redux Toolkit](https://redux-toolkit.js.org/) template.

## Getting started

Configure yarn and install dependencies:

```
yarn set version stable
yarn install
```

## Run locally

`PORT` defines the port that the web server will be run on (default is `3000`)  
`PROXY_PORT` defines the port that the sttic content server will be run on (default is `3001`)

```
PORT=<port> PROXY_PORT=<proxy_port> yarn start
```

## Using hardhat network

If you are using hardhat, copy the generated `localHardhatAddresses.json` to `src/utils/deploy/localHardhatAddresses.json`.

## Adding genesis rounds

Generate rounds using `tcp-genesis` and move the generated JSON files to `static/rounds/<number>.json`
