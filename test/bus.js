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
  const busSuccessFixture = require('fs').readFileSync('./test/bus_success.json').toString();
  nock('https://truetime.portauthority.org')
    .filteringPath(ignoreQueryParams)
    .get('/bustime/api/v3/getpredictions')
    .times(1)
    .reply(200, busSuccessFixture);

  const railSuccessFixture = require('fs').readFileSync('./test/rail_success.json').toString();
  nock('https://truetime.portauthority.org')
    .filteringPath(ignoreQueryParams)
    .get('/bustime/api/v3/getpredictions')
    .times(1)
    .reply(200, railSuccessFixture);

  getBus((err, res) => {
    require('fs').writeFileSync('res.json', JSON.stringify(res.body));
    t.equal(200, res.statusCode);

    const expectedResponse = [
      {
        buses: [
          {
            destination: 'Lawrenceville',
            route: '93',
            status: 'DUE',
            stopId: 2573
          },
          {
            destination: 'Negley',
            route: '71A',
            status: '9 minutes',
            stopId: 2573
          },
          {
            destination: 'Point Breeze',
            route: '71C',
            status: '13 minutes',
            stopId: 2573
          },
          {
            destination: 'Negley',
            route: '71A',
            status: '24 minutes',
            stopId: 2573
          },
          {
            destination: 'North Side Via Polish Hill',
            route: '54',
            status: '25 minutes',
            stopId: 2573
          }
        ],
        name: 'Craig @ Centre EE',
        stopId: 2573
      },
      {
        buses: [
          {
            destination: 'Downtown',
            route: '71C',
            status: '7 minutes',
            stopId: 2633
          },
          {
            destination: 'South Side to Bon Air',
            route: '54',
            status: '7 minutes',
            stopId: 2633
          },
          {
            destination: 'Hazelwood',
            route: '93',
            status: '26 minutes',
            stopId: 2633
          },
          {
            destination: 'South Side - SHJ',
            route: '54',
            status: '28 minutes',
            stopId: 2633
          }
        ],
        name: 'Craig @ Centre DT',
        stopId: 2633
      },
      {
        buses: [
          {
            destination: 'Downtown - North Shore',
            route: 'SLVR',
            status: '3 minutes',
            stopId: 99995
          },
          {
            destination: 'Downtown - North Shore',
            route: 'BLUE',
            status: '21 minutes',
            stopId: 99995
          },
          {
            destination: 'Downtown - North Shore',
            route: 'RED',
            status: '21 minutes',
            stopId: 99995
          }
        ],
        name: 'Steel Plaza N',
        stopId: 99995
      },
      {
        buses: [
          {
            destination: 'South Hills Village ',
            route: 'RED',
            status: '14 minutes',
            stopId: 98881
          },
          {
            destination: 'Library',
            route: 'SLVR',
            status: '19 minutes',
            stopId: 98881
          }
        ],
        name: 'North Side S',
        stopId: 98881
      }
    ];

    t.strictSame(res.body, expectedResponse);
    t.end();
  });
});

tap.test('correctly sends bus response if error', (t) => {
  nock('https://truetime.portauthority.org')
    .persist()
    .filteringPath(ignoreQueryParams)
    .get('/bustime/api/v3/getpredictions')
    .times(2)
    .reply(500, '');

  getBus((err, res) => {
    t.equal(500, res.statusCode);
    t.strictSame(res.body, []);
    t.end();
  });
});
