const tap = require('tap');
const nock = require('nock');
const supertest = require('supertest');

const getPabus = (cb) => {
  process.env.PABUS_IDS = '8653';
  process.env.PABUS_KEY = '';
  supertest(require('../lib/server'))
    .get('/api/pabus')
    .end(cb);
};

const ignoreQueryParams = (pathAndQuery) => {
  return require('url').parse(pathAndQuery, true).pathname;
};

tap.test('correctly sends pabus response if success', (t) => {
  const successFixture = require('fs').readFileSync('./test/pabus_success.xml').toString();
  nock('http://truetime.portauthority.org')
    .filteringPath(ignoreQueryParams)
    .get('/bustime/eta/getStopPredictionsETA.jsp')
    .reply(200, successFixture);

  getPabus((err, res) => {
    t.equal(200, res.statusCode);

    const expectedResponse = [
      {
        'Sutherland Inbound': [
          {
            destination: 'Wharton Sq',
            route: '83',
            status: '13 Minutes'
          }
        ]
      }
    ];

    t.strictSame(expectedResponse, res.body);
    t.end();
  });
});

tap.test('correctly sends pabus response if error', (t) => {
  nock('http://truetime.portauthority.org')
    .filteringPath(ignoreQueryParams)
    .get('/bustime/eta/getStopPredictionsETA.jsp')
    .reply(500, '');

  getPabus((err, res) => {
    t.equal(500, res.statusCode);
    t.strictSame([], res.body);
    t.end();
  });
});
