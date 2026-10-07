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

  test('Viewing one stock: GET request to /api/stock-prices/', function() {
    return getStockPrices(['MSFT'])
      .then(response => {
        assert.equal(response.status, 200);
        assert.isObject(response.body.stockData);
        assert.equal(response.body.stockData.stock, 'MSFT');
        assert.isNumber(response.body.stockData.price);
        assert.isNumber(response.body.stockData.likes);
      });
  });

  test('Viewing one stock and liking it: GET request to /api/stock-prices/', function() {
    return getStockPrices(['NVDA'])
      .then(before => getStockPrices(['NVDA'], true)
        .then(response => {
          assert.equal(response.status, 200);
          assert.equal(response.body.stockData.stock, 'NVDA');
          assert.equal(response.body.stockData.likes, before.body.stockData.likes + 1);
        }));
  });

  test('Viewing the same stock and liking it again: GET request to /api/stock-prices/', function() {
    return getStockPrices(['NVDA'], true)
      .then(firstResponse => getStockPrices(['NVDA'], true)
        .then(secondResponse => {
          assert.equal(firstResponse.body.stockData.likes, secondResponse.body.stockData.likes);
        }));
  });

  test('Viewing two stocks: GET request to /api/stock-prices/', function() {
    return getStockPrices(['GOOG', 'MSFT'])
      .then(response => {
        assert.equal(response.status, 200);
        assert.isArray(response.body.stockData);
        assert.lengthOf(response.body.stockData, 2);
        assert.equal(response.body.stockData[0].stock, 'GOOG');
        assert.isNumber(response.body.stockData[0].price);
        assert.isNumber(response.body.stockData[0].rel_likes);
        assert.notProperty(response.body.stockData[0], 'likes');
        assert.equal(response.body.stockData[1].stock, 'MSFT');
        assert.isNumber(response.body.stockData[1].price);
        assert.isNumber(response.body.stockData[1].rel_likes);
        assert.notProperty(response.body.stockData[1], 'likes');
      });
  });

  test('Viewing two stocks and liking them: GET request to /api/stock-prices/', function() {
    return getStockPrices(['GOOG'])
      .then(firstBefore => getStockPrices(['MSFT'])
        .then(secondBefore => getStockPrices(['GOOG', 'MSFT'], true)
          .then(response => getStockPrices(['GOOG'])
            .then(firstAfter => getStockPrices(['MSFT'])
              .then(secondAfter => {
                assert.isArray(response.body.stockData);
                assert.isNumber(response.body.stockData[0].rel_likes);
                assert.isNumber(response.body.stockData[1].rel_likes);
                assert.equal(firstAfter.body.stockData.likes,
                  firstBefore.body.stockData.likes + 1);
                assert.equal(secondAfter.body.stockData.likes,
                  secondBefore.body.stockData.likes + 1);
              })))));
  });
});
