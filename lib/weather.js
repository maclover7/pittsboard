const request = require('request-promise');

const iconCodes = {
  rain: 'RAIN',
  snow: 'SNOW',
  sleet: 'SLEET',
  hail: 'SLEET',
  wind: 'WIND',
  fog: 'FOG',
  cloudy: 'CLOUDY',
  'partly-cloudy-day': 'PARTLY_CLOUDY_DAY',
  'partly-cloudy-night': 'PARTLY_CLOUDY_NIGHT',
  'clear-day': 'CLEAR_DAY',
  'clear-night': 'CLEAR_NIGHT'
};

const getData = (obj) => {
  var retVal = {
    icon: iconCodes[obj.icon] || 'CLOUDY',
    desc: obj.summary
  };

  if (obj.apparentTemperature) {
    retVal.temp = obj.apparentTemperature;
  } else {
    retVal.high = obj.apparentTemperatureHigh;
    retVal.low = obj.apparentTemperatureLow;
  }

  return retVal;
};

module.exports = (req, res) => {
  request({
    url: `https://api.darksky.net/forecast/${process.env.DARK_SKY_KEY}/40.4442663,-79.95328589999997`,
    json: true
  })
    .then((body) => {
      res.json({
        now: getData(body.currently),
        today: getData(body.daily.data[0]),
        tomorrow: getData(body.daily.data[1])
      });
    })
    .catch(() => {
      res.status(500).json({});
    });
};
