const request = require('request-promise');

module.exports = (req, res) => {
  request({
    url: `http://www.pittshuttle.com/Services/JSONPRelay.svc/GetMapStopEstimates?TimesPerStopString=8&ApiKey=${process.env.PITTBUS_KEY}`,
    json: true
  })
    .then((routes) => {
      let updates = [];

      routes
        .forEach((route) => {
          route.RouteStops
            .filter((stop) => {
              return stop.Description === process.env.PITTBUS_ID;
            })
            .forEach((stop, index) => {
              const mappedEstimates = stop.Estimates
                .map((estimate) => {
                  var routeName;
                  if (index === 0) {
                    routeName = `${route.Description} Outbound`;
                  } else {
                    routeName = `${route.Description} Inbound`;
                  }

                  return {
                    status: `${estimate.SecondsToStop} seconds`,
                    route: routeName
                  };
                });

              updates = updates.concat(mappedEstimates);
            });

          res.json(updates);
        });
    })
    .catch(() => {
      res.status(500).json([]);
    });
};
