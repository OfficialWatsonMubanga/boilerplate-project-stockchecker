'use strict';

const crypto = require('crypto');
const https = require('https');

const likesByStock = new Map();
const stockSymbolPattern = /^[A-Z0-9.-]{1,10}$/;

function getStockQuote(stock) {
  return new Promise((resolve, reject) => {
    const request = https.get(
      `https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${encodeURIComponent(stock)}/quote`,
      response => {
        let body = '';

        response.setEncoding('utf8');
        response.on('data', chunk => {
          body += chunk;
        });
        response.on('end', () => {
          if (response.statusCode < 200 || response.statusCode >= 300) {
            reject(new Error(`Stock proxy returned HTTP ${response.statusCode}`));
            return;
          }

          let quote;
          try {
            quote = JSON.parse(body);
          } catch (error) {
            reject(new Error('Stock proxy returned invalid JSON'));
            return;
          }

          const price = Number(quote.latestPrice);
          if (!Number.isFinite(price)) {
            reject(new Error('Stock proxy returned an invalid price'));
            return;
          }

          resolve({ stock, price });
        });
      }
    );

    request.setTimeout(10000, () => {
      request.destroy(new Error('Stock proxy request timed out'));
    });
    request.on('error', reject);
  });
}

function getAnonymizedIp(ip) {
  return crypto.createHash('sha256').update(ip).digest('hex');
}

function addLike(stock, anonymizedIp) {
  if (!likesByStock.has(stock)) {
    likesByStock.set(stock, new Set());
  }
  likesByStock.get(stock).add(anonymizedIp);
}

module.exports = function (app) {
  app.route('/api/stock-prices').get(async function (req, res) {
    const requestedStocks = req.query.stock;
    const stocks = (Array.isArray(requestedStocks)
      ? requestedStocks
      : [requestedStocks])
      .filter(stock => stock !== undefined)
      .map(stock => typeof stock === 'string' ? stock.trim().toUpperCase() : '');

    if (stocks.length < 1 || stocks.length > 2 ||
        stocks.some(stock => !stockSymbolPattern.test(stock))) {
      res.status(400).json({ error: 'Provide one or two valid stock symbols' });
      return;
    }

    try {
      const quotes = await Promise.all(stocks.map(getStockQuote));

      if (req.query.like === 'true') {
        const anonymizedIp = getAnonymizedIp(req.ip);
        stocks.forEach(stock => addLike(stock, anonymizedIp));
      }

      if (quotes.length === 1) {
        const quote = quotes[0];
        res.json({
          stockData: {
            ...quote,
            likes: (likesByStock.get(quote.stock) || new Set()).size
          }
        });
        return;
      }

      const [first, second] = quotes;
      const firstLikes = (likesByStock.get(first.stock) || new Set()).size;
      const secondLikes = (likesByStock.get(second.stock) || new Set()).size;
      res.json({
        stockData: [
          { ...first, rel_likes: firstLikes - secondLikes },
          { ...second, rel_likes: secondLikes - firstLikes }
        ]
      });
    } catch (error) {
      console.error('Unable to retrieve stock quote:', error.message);
      res.status(502).json({ error: 'Unable to retrieve stock price' });
    }
  });
};
