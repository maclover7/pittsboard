const request = require('request-promise');
const moment = require('moment');

const flattenArray = (arr) => { return arr.reduce((acc, val) => acc.concat(val), []); };

module.exports = (req, res) => {
  request({
    url: 'http://www.pittshuttle.com/Services/JSONPRelay.svc/GetMapStopEstimates',
    qs: {
      TimesPerStopString: '8',
      ApiKey: process.env.PITTBUS_KEY
    },
    json: true
  })
    .then((routes) => {
      return routes.map((route) => {
        return new Promise((resolve) => {
          const stopTimes = route.RouteStops
            .filter((stop) => {
              return stop.Description === process.env.PITTBUS_ID;
            })
            .map((stop, index) => {
              return stop.Estimates
                .map((estimate) => {
                  var routeName;
                  if (index === 0) {
                    routeName = `${route.Description} Outbound`;
                  } else {
                    routeName = `${route.Description} Inbound`;
                  }

                  return {
                    status: moment().add(estimate.SecondsToStop, 'seconds').fromNow().replace('in ', ''),
                    route: routeName
                  };
                });
            });

          resolve(stopTimes);
        });
      });
    })
    .then((promises) => {
      return Promise.all(promises);
    })
    .then((stopTimes) => {
      return new Promise((resolve) => {
        res.json(flattenArray(flattenArray(stopTimes)));
        resolve();
      });
    })
    .catch(() => {
      res.status(500).json([]);
    });
};
