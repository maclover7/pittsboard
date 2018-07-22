const request = require('request-promise');

const getIcon = (icon) => {
  if (icon === 'rain')
    return 'RAIN';
  else if (icon === 'snow')
    return 'SNOW';
  else if (icon === 'sleet')
    return 'SLEET';
  else if (icon === 'hail')
    return 'SLEET';
  else if (icon === 'wind')
    return 'WIND';
  else if (icon === 'fog')
    return 'FOG';
  else if (icon === 'cloudy')
    return 'CLOUDY';
  else if (icon === 'partly-cloudy-day')
    return 'PARTLY_CLOUDY_DAY';
  else if (icon === 'partly-cloudy-night')
    return 'PARTLY_CLOUDY_NIGHT';
  else if (icon === 'clear-day')
    return 'CLEAR_DAY';
  else if (icon === 'clear-night')
    return 'CLEAR_NIGHT';
  else
    return 'CLOUDY';
};

const getDailyData = (index, dailyData) => {
  return {
    icon: getIcon(dailyData[index].icon),
    desc: dailyData[index].summary,
    high: dailyData[index].apparentTemperatureHigh,
    low: dailyData[index].apparentTemperatureLow
  };
};

module.exports = (req, res) => {
  request({
    url: `https://api.darksky.net/forecast/${process.env.DARK_SKY_KEY}/40.4442663,-79.95328589999997`,
    json: true
  })
    .then((body) => {
      res.json({
        now: {
          icon: getIcon(body.currently.icon),
          desc: body.currently.summary,
          temp: body.currently.apparentTemperature
        },
        today: getDailyData(0, body.daily.data),
        tomorrow: getDailyData(1, body.daily.data)
      });
    })
    .catch(() => {
      res.status(500).json({});
    });
};
