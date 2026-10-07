const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {
  function getStockPrices(stocks, like) {
    const stockParams = stocks
      .map(stock => `stock=${encodeURIComponent(stock)}`)
      .join('&');
    const likeParam = like ? '&like=true' : '';
    return chai.request(server).get(`/api/stock-prices?${stockParams}${likeParam}`);
  }

  test('Viewing one stock', function() {
    return getStockPrices(['MSFT'])
      .then(response => {
        assert.equal(response.status, 200);
        assert.isObject(response.body.stockData);
        assert.equal(response.body.stockData.stock, 'MSFT');
        assert.isNumber(response.body.stockData.price);
        assert.isNumber(response.body.stockData.likes);
      });
  });

  test('Viewing one stock and liking it', function() {
    return getStockPrices(['NVDA'])
      .then(before => getStockPrices(['NVDA'], true)
        .then(response => {
          assert.equal(response.status, 200);
          assert.equal(response.body.stockData.stock, 'NVDA');
          assert.equal(response.body.stockData.likes, before.body.stockData.likes + 1);
        }));
  });

  test('Viewing the same stock and liking it again', function() {
    return getStockPrices(['NVDA'], true)
      .then(firstResponse => getStockPrices(['NVDA'], true)
        .then(secondResponse => {
          assert.equal(firstResponse.body.stockData.likes, secondResponse.body.stockData.likes);
        }));
  });

  test('Viewing two stocks', function() {
    return getStockPrices(['GOOG', 'MSFT'])
      .then(response => {
        assert.equal(response.status, 200);
        assert.isArray(response.body.stockData);
        assert.lengthOf(response.body.stockData, 2);
        response.body.stockData.forEach(stockData => {
          assert.isString(stockData.stock);
          assert.isNumber(stockData.price);
          assert.isNumber(stockData.rel_likes);
          assert.notProperty(stockData, 'likes');
        });
      });
  });

  test('Viewing two stocks and liking them', function() {
    return getStockPrices(['GOOG', 'NVDA'], true)
      .then(firstResponse => getStockPrices(['GOOG', 'NVDA'], true)
        .then(secondResponse => {
          assert.equal(firstResponse.body.stockData[0].rel_likes,
            secondResponse.body.stockData[0].rel_likes);
          assert.equal(firstResponse.body.stockData[1].rel_likes,
            secondResponse.body.stockData[1].rel_likes);
        }));
  });
});
