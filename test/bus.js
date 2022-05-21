const axios = require('axios');
const MockAdapter = require('axios-mock-adapter');
const { readFileSync } = require('fs');
const tap = require('tap');

const mock = new MockAdapter(axios);
const busUrl = 'https://truetime.portauthority.org/bustime/api/v3/getpredictions?format=json&key=testkey&rtpidatafeed=Port+Authority+Bus&stpid=2633%2C2573';
const railUrl = 'https://truetime.portauthority.org/bustime/api/v3/getpredictions?format=json&key=testkey&rtpidatafeed=Light+Rail&stpid=99995%2C98881';

process.env.PABUS_KEY = 'testkey';
const server = require('../lib/server');

tap.test('correctly sends bus response if success', (t) => {
  const busSuccessFixture = readFileSync('./test/bus_success.json').toString();
  mock.onGet(busUrl).reply(200, busSuccessFixture);

  const railSuccessFixture = readFileSync('./test/rail_success.json').toString();
  mock.onGet(railUrl).reply(200, railSuccessFixture);

  server.inject({
    method: 'GET',
    url: '/api/bus',
  }, (err, res) => {
    t.equal(200, res.statusCode);

    const expectedResponse = [
      {
        buses: [
          {
            destination: 'Lawrenceville',
            error: false,
            route: '93',
            status: 'DUE',
            stopId: 2573,
          },
          {
            destination: 'Negley',
            error: false,
            route: '71A',
            status: '9 minutes',
            stopId: 2573,
          },
          {
            destination: 'Point Breeze',
            error: false,
            route: '71C',
            status: '13 minutes',
            stopId: 2573,
          },
          {
            destination: 'Negley',
            error: false,
            route: '71A',
            status: '24 minutes',
            stopId: 2573,
          },
          {
            destination: 'North Side Via Polish Hill',
            error: false,
            route: '54',
            status: '25 minutes',
            stopId: 2573,
          },
        ],
        name: 'Craig & Centre EE',
        stopId: 2573,
      },
      {
        buses: [
          {
            destination: 'Downtown',
            error: false,
            route: '71C',
            status: '7 minutes',
            stopId: 2633,
          },
          {
            destination: 'South Side to Bon Air',
            error: false,
            route: '54',
            status: '7 minutes',
            stopId: 2633,
          },
          {
            destination: 'Hazelwood',
            error: false,
            route: '93',
            status: '26 minutes',
            stopId: 2633,
          },
          {
            destination: 'South Side - SHJ',
            error: false,
            route: '54',
            status: '28 minutes',
            stopId: 2633,
          },
        ],
        name: 'Craig & Centre DT',
        stopId: 2633,
      },
      {
        buses: [
          {
            destination: 'Downtown - North Shore',
            error: false,
            route: 'SLVR',
            status: '3 minutes',
            stopId: 99995,
          },
          {
            destination: 'Downtown - North Shore',
            error: false,
            route: 'BLUE',
            status: '21 minutes',
            stopId: 99995,
          },
          {
            destination: 'Downtown - North Shore',
            error: false,
            route: 'RED',
            status: '21 minutes',
            stopId: 99995,
          },
        ],
        name: 'Steel Plaza N',
        stopId: 99995,
      },
      {
        buses: [
          {
            destination: 'South Hills Village ',
            error: false,
            route: 'RED',
            status: '14 minutes',
            stopId: 98881,
          },
          {
            destination: 'Library',
            error: false,
            route: 'SLVR',
            status: '19 minutes',
            stopId: 98881,
          },
        ],
        name: 'North Side S',
        stopId: 98881,
      },
    ];

    t.strictSame(JSON.parse(res.body), expectedResponse);
    t.end();
  });
});

tap.test('correctly sends bus response if success', (t) => {
  const busSuccessFixture = readFileSync('./test/bus_success_notimes.json').toString();
  mock.onGet(busUrl).reply(200, busSuccessFixture);

  const railSuccessFixture = readFileSync('./test/rail_success_notimes.json').toString();
  mock.onGet(railUrl).reply(200, railSuccessFixture);

  server.inject({
    method: 'GET',
    url: '/api/bus',
  }, (err, res) => {
    t.equal(200, res.statusCode);

    const expectedResponse = [
      {
        buses: [
          {
            destination: 'South Side - SHJ',
            error: false,
            route: '54',
            status: 'DUE',
            stopId: 2633,
          },
          {
            destination: 'South Side to Bon Air',
            error: false,
            route: '54',
            status: '28 minutes',
            stopId: 2633,
          },
        ],
        name: 'Craig & Centre DT',
        stopId: 2633,
      },
      {
        buses: [],
        name: 'Craig & Centre EE',
        stopId: 2573,
      },
      {
        buses: [],
        name: 'Steel Plaza N',
        stopId: 99995,
      },
      {
        buses: [],
        name: 'North Side S',
        stopId: 98881,
      },
    ];

    t.strictSame(JSON.parse(res.body), expectedResponse);
    t.end();
  });
});

tap.test('correctly sends bus response if error', (t) => {
  mock.onGet(busUrl).reply(500);
  mock.onGet(railUrl).reply(500);

  server.inject({
    method: 'GET',
    url: '/api/bus',
  }, (err, res) => {
    t.equal(500, res.statusCode);
    t.strictSame(JSON.parse(res.body), []);
    t.end();
  });
});
