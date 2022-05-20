const axios = require('axios');

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
    retVal.temps = [obj.apparentTemperature];
  } else {
    retVal.temps = [obj.apparentTemperatureHigh, obj.apparentTemperatureLow];
  }

  return retVal;
};

module.exports = (req, res) => {
  axios.get(`https://api.darksky.net/forecast/${process.env.DARK_SKY_KEY}/40.4442663,-79.95328589999997`)
    .then(({ data: body  }) => {
      res.send({
        now: getData(body.currently),
        today: getData(body.daily.data[0]),
        tomorrow: getData(body.daily.data[1])
      });
    })
    .catch(() => {
      res.code(500).send({});
    });
};
