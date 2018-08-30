const tap = require('tap');
const nock = require('nock');
const supertest = require('supertest');

const getBus = (cb) => {
  supertest(require('../lib/server'))
    .get('/api/bus')
    .end(cb);
};

const ignoreQueryParams = (pathAndQuery) => {
  return require('url').parse(pathAndQuery, true).pathname;
};

tap.test('correctly sends bus response if success', (t) => {
  const paBusSuccessFixture = require('fs').readFileSync('./test/pabus_success.xml').toString();
  nock('http://truetime.portauthority.org')
    .filteringPath(ignoreQueryParams)
    .get('/bustime/eta/getStopPredictionsETA.jsp')
    .times(5)
    .reply(200, paBusSuccessFixture);

  const pittBusSuccessFixture = require('fs').readFileSync('./test/pittbus_success.json').toString();
  nock('http://www.pittshuttle.com')
    .filteringPath(ignoreQueryParams)
    .get('/Services/JSONPRelay.svc/GetMapStopEstimates')
    .times(1)
    .reply(200, pittBusSuccessFixture);

  getBus((err, res) => {
    t.equal(200, res.statusCode);

    const expectedResponse = [
      {
        buses: [
          {
            route: '1U North South Loop',
            status: '24 minutes'
          },
          {
            route: '1U North South Loop',
            status: 'an hour'
          },
          {
            destination: 'Wharton Sq',
            route: '83',
            status: '13 Minutes'
          }
        ],
        name: 'Sutherland Hall'
      },
      {
        buses: [
          {
            route: '1U North South Loop',
            status: '19 minutes',
          }
        ],
        name: 'Cathedral of Learning'
      },
      {
        buses: [
          {
            destination: 'Wharton Sq',
            route: '83',
            status: '13 Minutes'
          }
        ],
        name: 'Fifth @ Thackeray Ave'
      },
      {
        buses: [
          {
            destination: 'Wharton Sq',
            route: '83',
            status: '13 Minutes'
          }
        ],
        name: 'Forbes @ Oakland Ave'
      },
      {
        buses: [
          {
            destination: 'Wharton Sq',
            route: '83',
            status: '13 Minutes',
          }
        ],
        name: 'Forbes past Bouquet St'
      }
    ];

    t.strictSame(expectedResponse, res.body);
    t.end();
  });
});

tap.test('correctly sends bus response if error', (t) => {
  nock('http://truetime.portauthority.org')
    .persist()
    .filteringPath(ignoreQueryParams)
    .get('/bustime/eta/getStopPredictionsETA.jsp')
    .times(5)
    .reply(500, '');

  nock('http://www.pittshuttle.com')
    .persist()
    .filteringPath(ignoreQueryParams)
    .get('/Services/JSONPRelay.svc/GetMapStopEstimates')
    .times(1)
    .reply(500, '');

  getBus((err, res) => {
    t.equal(500, res.statusCode);
    t.strictSame([], res.body);
    t.end();
  });
});
