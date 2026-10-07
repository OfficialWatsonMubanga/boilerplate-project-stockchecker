# Stock Price Checker

A full-stack JavaScript app that retrieves current stock prices from the
freeCodeCamp stock proxy and reports likes for one or two NASDAQ symbols.

## Run the app

Install dependencies and start the server:

```sh
npm install
npm start
```

Visit `http://localhost:3000`. The API accepts one or two stock symbols:

```text
/api/stock-prices?stock=GOOG
/api/stock-prices?stock=GOOG&like=true
/api/stock-prices?stock=GOOG&stock=MSFT
/api/stock-prices?stock=GOOG&stock=MSFT&like=true
```

Likes are kept in memory for the lifetime of the server process. The app hashes
client IP addresses before using them to prevent multiple likes from the same
address without storing the raw address.

## Run the functional tests

Set `NODE_ENV` to `test` and start the server. On Windows PowerShell:

```powershell
$env:NODE_ENV = 'test'
npm start
```

The functional tests call the live stock proxy, so the proxy must be reachable.
