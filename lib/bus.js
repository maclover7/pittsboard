const request = require('request-promise');
const moment = require('moment');
const parseString = require('util').promisify(require('xml2js').parseString);

const flattenArray = (arr) => { return arr.reduce((acc, val) => acc.concat(val), []); };

const properlyCapitalize = (str) => {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const stopGroupsLists = {
  'main': [
    { name: 'Sutherland Hall', stops: [ { resolver: 'PITT', id: 'Sutherland Hall' }, { resolver: 'PA', id: '8653' } ] },
    { name: 'Cathedral of Learning', stops: [ { resolver: 'PITT', id: 'Cathedral of Learning' } ] },
    { name: 'Fifth @ Thackeray Ave', stops: [ { resolver: 'PA', id: '35' } ] },
    { name: 'Fifth Opp Thackeray Ave', stops: [ { resolver: 'PA', id: '2566' } ] },
    { name: 'Forbes @ Oakland Ave / Bigelow Blvd', stops: [ { resolver: 'PA', id: '9024' }, { resolver: 'PA', id: '31' } ] }
  ],
  'craig': [
    { name: 'Craig @ Bayard', stops: [ { resolver: 'PA', id: '2634' }, { resolver: 'PA', id: '2572' } ] },
    { name: 'Sixth @ Smithfield', stops: [ { resolver: 'PA', id: '3158' } ] },
    { name: 'Fifth @ Thackeray Ave', stops: [ { resolver: 'PA', id: '35' } ] },
    { name: 'Fifth Opp Thackeray Ave', stops: [ { resolver: 'PA', id: '2566' } ] },
    { name: 'Forbes @ Oakland Ave / Bigelow Blvd', stops: [ { resolver: 'PA', id: '9024' }, { resolver: 'PA', id: '31' } ] }
  ]
};

const getPABus = (id) => {
  return request({
    url: 'http://truetime.portauthority.org/bustime/eta/getStopPredictionsETA.jsp',
    qs: {
      route: 'all',
      stop: `Port Authority Bus:${id}`,
      key: process.env.PABUS_KEY
    },
    encoding: null
  })
    .then(parseString)
    .then((bus) => {
      return new Promise((resolve) => {
        var updates = [];

        if (bus.stop.pre) {
          updates = bus.stop.pre.map((pre) => {
            return {
              status: properlyCapitalize(pre.pt.concat(pre.pu).join('').replace('&nbsp;', '')),
              route: pre.rn.join('').trim(),
              destination: properlyCapitalize(pre.fd.join('').trim())
            };
          });
        }

        resolve(updates);
      });
    });
};

const getPittData = () => {
  return request({
    url: 'http://www.pittshuttle.com/Services/JSONPRelay.svc/GetMapStopEstimates',
    qs: {
      TimesPerStopString: '8',
      ApiKey: process.env.PITTBUS_KEY
    },
    json: true
  });
};

const getPittBus = (stopId, data) => {
  const routeStopTimes = data.map((route) => {
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

    return Promise.resolve(stopTimes);
  });

  return Promise.all(routeStopTimes)
    .then((stopTimes) => {
      const sortedStopTimes = flattenArray(flattenArray(stopTimes))
        .sort((a, b) => { return a.status - b.status; })
        .map((stopTime) => {
          stopTime.status = moment().add(stopTime.status, 'seconds').fromNow().replace('in ', '');
          return stopTime;
        });

      return Promise.resolve(sortedStopTimes);
    });
};

module.exports = (req, res) => {
  const stopGroups = stopGroupsLists[req.query.path === '/jon/' ? 'craig' : 'main'];

  getPittData()
    .then((data) => {
      return stopGroups
        .map((stopGroup) => {
          const buses = stopGroup.stops.map((stop) => {
            return stop.resolver === 'PA' ? getPABus(stop.id) : getPittBus(stop.id, data);
          });

          return Promise.all(buses).then((buses) => {
            const getMinutesUntil = (bus) => { return parseInt(bus.status.split(' ')[0]); };
            return Promise.resolve({
              name: stopGroup.name,
              buses: flattenArray(buses).sort((a, b) => { return getMinutesUntil(a) - getMinutesUntil(b); })
            });
          });
        });
    })
    .then((stopGroupPromises) => {
      return Promise.all(stopGroupPromises);
    })
    .then((times) => {
      res.json(times);
      return Promise.resolve();
    })
    .catch(() => {
      res.status(500).json([]);
    });
};
