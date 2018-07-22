const tap = require('tap');
const nock = require('nock');
const supertest = require('supertest');

const getWeather = (cb) => {
  process.env.DARK_SKY_KEY = 'testkey';
  supertest(require('../lib/server'))
    .get('/api/weather')
    .end(cb);
};

tap.test('correctly sends weather response if success', (t) => {
  const successFixture = require('fs').readFileSync('./test/weather_success.json').toString();
  nock('https://api.darksky.net')
    .get('/forecast/testkey/40.4442663,-79.95328589999997')
    .reply(200, successFixture);

  getWeather((err, res) => {
    t.equal(200, res.statusCode);

    const expectedResponse = {
      now: {
        desc: 'Mostly Cloudy',
        icon: 'PARTLY_CLOUDY_DAY',
        temp: 75.18
      },
      today: {
        desc: 'Rain starting in the evening.',
        high: 82.61,
        icon: 'RAIN',
        low: 67.02,
      },
      tomorrow: {
        desc: 'Mostly cloudy throughout the day.',
        high: 88.27,
        icon: 'PARTLY_CLOUDY_DAY',
        low: 71.26
      }
    };

    t.strictSame(expectedResponse, res.body);
    t.end();
  });
});

tap.test('correctly sends weather response if error', (t) => {
  nock('https://api.darksky.net')
    .get('/forecast/testkey/40.4442663,-79.95328589999997')
    .reply(500, JSON.stringify({}));

  getWeather((err, res) => {
    t.equal(500, res.statusCode);
    t.strictSame({}, res.body);
    t.end();
  });
});
