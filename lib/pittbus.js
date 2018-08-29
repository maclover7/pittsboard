const request = require('request-promise');
const moment = require('moment');

const flattenArray = (arr) => { return arr.reduce((acc, val) => acc.concat(val), []); };

const getData = () => {
  return request({
    url: 'http://www.pittshuttle.com/Services/JSONPRelay.svc/GetMapStopEstimates',
    qs: {
      TimesPerStopString: '8',
      ApiKey: process.env.PITTBUS_KEY
    },
    json: true
  });
};

const getBusesForStop = (data, stopId) => {
  const stopTimes = data.map((route) => {
    return new Promise((resolve) => {
      const stopTimes = route.RouteStops
        .filter((stop) => { return stop.Description === stopId; })
        .map((stop) => {
          return stop.Estimates
            .map((estimate) => {
              return {
                status: estimate.SecondsToStop,
                route: route.Description
              };
            });
        });

      resolve(stopTimes);
    });
  });

  return Promise.all(stopTimes)
    .then((stopTimes) => {
      const sortedStopTimes = flattenArray(flattenArray(stopTimes))
        .sort((a, b) => { return a.status - b.status; })
        .map((stopTime) => {
          stopTime.status = moment().add(stopTime.status, 'seconds').fromNow().replace('in ', '');
          return stopTime;
        });

      return Promise.resolve({ [stopId]: sortedStopTimes });
    });
};

module.exports = (req, res) => {
  getData().then((data) => {
    const promises = process.env.PITTBUS_IDS
      .split(',')
      .map((id) => { return getBusesForStop(data, id); });

    return Promise.all(promises)
      .then((times) => {
        res.json(times);
        return Promise.resolve();
      });
  })
    .catch(() => {
      res.status(500).json([]);
    });
};
