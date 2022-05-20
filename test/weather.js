const tap = require('tap');

const axios = require("axios");
const MockAdapter = require("axios-mock-adapter");
const mock = new MockAdapter(axios);

process.env.DARK_SKY_KEY = 'testkey';
const server = require('../lib/server');

tap.test('correctly sends weather response if success', (t) => {
  const successFixture = require('fs').readFileSync('./test/weather_success.json').toString();
  mock.onGet("https://api.darksky.net/forecast/testkey/40.4442663,-79.95328589999997").reply(200, successFixture);

  server.inject({
    method: 'GET',
    url: '/api/weather'
  }, (err, res) => {
    t.equal(200, res.statusCode);

    const expectedResponse = {
      now: {
        desc: 'Mostly Cloudy',
        icon: 'PARTLY_CLOUDY_DAY',
        temps: [75.18]
      },
      today: {
        desc: 'Rain starting in the evening.',
        temps: [82.61, 67.02],
        icon: 'RAIN'
      },
      tomorrow: {
        desc: 'Mostly cloudy throughout the day.',
        temps: [88.27, 71.26],
        icon: 'PARTLY_CLOUDY_DAY'
      }
    };

    t.strictSame(expectedResponse, JSON.parse(res.body));
    t.end();
  });
});

tap.test('correctly sends weather response if error', (t) => {
  mock.onGet("https://api.darksky.net/forecast/testkey/40.4442663,-79.95328589999997").reply(500);

  server.inject({
    method: 'GET',
    url: '/api/weather'
  }, (err, res) => {
    t.equal(500, res.statusCode);
    t.strictSame({}, JSON.parse(res.body));
    t.end();
  });
});
