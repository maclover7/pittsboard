const request = require('request-promise');
const moment = require('moment');

const flattenArray = (arr) => { return arr.reduce((acc, val) => acc.concat(val), []); };

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
    { name: 'Fifth @ Smithfield', stops: [ { resolver: 'PA', id: '20691' } ] },
    { name: 'Fifth @ Bigelow', stops: [ { resolver: 'PA', id: '2567' } ] }
  ],
  'dith': [
    { name: 'Craig @ Centre DT', stops: [ { resolver: 'PA', id: '2633', feedId: 'Port Authority Bus' } ] },
    { name: 'Craig @ Centre EE', stops: [ { resolver: 'PA', id: '2573', feedId: 'Port Authority Bus' } ] },
    { name: 'Steel Plaza N', stops: [ { resolver: 'PA', id: '99995', feedId: 'Light Rail' } ] },
    { name: 'North Side S', stops: [ { resolver: 'PA', id: '98881', feedId: 'Light Rail' } ] }
  ],
};

const getPABus = (stopId, feedId) => {
  return request({
    url: 'https://truetime.portauthority.org/bustime/api/v3/getpredictions',
    qs: {
      format: 'json',
      key: process.env.PABUS_KEY,
      rtpidatafeed: feedId,
      stpid: stopId
    },
    json: true
  })
    .then((response) => {
      const updates = response['bustime-response']['prd'].map((prediction) => {
        return {
          destination: prediction.des,
          route: prediction.rt,
          status: `${prediction.prdctdn} minutes`
        };
      });

      return Promise.resolve(updates);
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
  var stopGroups = stopGroupsLists['main'];
  if (req.query.path === '/craig/') {
    stopGroups = stopGroupsLists['craig'];
  }
  if (req.query.path === '/dith/') {
    stopGroups = stopGroupsLists['dith'];
  }

  getPittData()
    .then((data) => {
      return stopGroups
        .map((stopGroup) => {
          const buses = stopGroup.stops.map((stop) => {
            return stop.resolver === 'PA' ? getPABus(stop.id, stop.feedId) : getPittBus(stop.id, data);
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
