const request = require('request-promise');

const flattenArray = (arr) => { return arr.reduce((acc, val) => acc.concat(val), []); };

const stopGroupsLists = {
  'main': [
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

module.exports = (req, res) => {
  const stopGroups = stopGroupsLists['main'];

  return Promise.all(stopGroups
    .map((stopGroup) => {
      const buses = stopGroup.stops.map((stop) => {
        return stop.resolver === 'PA' ? getPABus(stop.id, stop.feedId) : new Error('Unknown resolver');
      });

      return Promise.all(buses).then((buses) => {
        const getMinutesUntil = (bus) => { return parseInt(bus.status.split(' ')[0]); };
        return Promise.resolve({
          name: stopGroup.name,
          buses: flattenArray(buses).sort((a, b) => { return getMinutesUntil(a) - getMinutesUntil(b); })
        });
      });
    }))
    .then((times) => {
      res.json(times);
      return Promise.resolve();
    })
    .catch(() => {
      res.status(500).json([]);
    });
};
