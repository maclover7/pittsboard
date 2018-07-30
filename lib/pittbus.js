const request = require('request-promise');

// Initialize "global" state
let routeStore = [];
request({
  url: `http://www.pittshuttle.com/Services/JSONPRelay.svc/GetRoutes?ApiKey=${process.env.PITTBUS_KEY}`,
  json: true
})
  .then((routes) => {
    routeStore = routes.map((route) => {
      return {
        name: route.Description.replace('_April2018', ''),
        id: route.RouteID
      };
    });
  });

module.exports = (req, res) => {
  request({
    url: `http://www.pittshuttle.com/Services/JSONPRelay.svc/GetRouteStopArrivals?TimesPerStopString=8&ApiKey=${process.env.PITTBUS_KEY}`,
    json: true
  })
    .then((stops) => {
      const stop = stops.filter((stop) => { return stop.RouteStopID.toString() === process.env.PITTBUS_ID; })[0];
      let updates = [];

      if (stop) {
        updates = stop.VehicleEstimates.map((ve) => {
          return {
            status: `In ${ve.SecondsToStop} seconds`,
            route: routeStore.filter((route) => { return route.id === stop.RouteID; })[0].name
          };
        });
      }

      res.json(updates);
    })
    .catch(() => {
      res.status(500).json([]);
    });
};
