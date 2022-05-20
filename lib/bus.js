const request = require('request-promise');

const feedStopGroups = [
  {
    feedId: 'Port Authority Bus',
    stops: [
      { name: 'Craig @ Centre DT', id: 2633 },
      { name: 'Craig @ Centre EE', id: 2573 },
    ]
  },
  {
    feedId: 'Light Rail',
    stops: [
      { name: 'Steel Plaza N', id: 99995 },
      { name: 'North Side S', id: 98881 }
    ]
  }
];

const flattenArray = (arr) => { return arr.reduce((acc, val) => acc.concat(val), []); };

const getPredictions = (stopIds, feedId) => {
  return request({
    url: 'https://truetime.portauthority.org/bustime/api/v3/getpredictions',
    qs: {
      format: 'json',
      key: process.env.PABUS_KEY,
      rtpidatafeed: feedId,
      stpid: stopIds
    },
    json: true
  })
    .then((response) => {
      const updates = response['bustime-response']['prd'].map((prediction) => {
        return {
          destination: prediction.des,
          route: prediction.rt,
          status: isNaN(prediction.prdctdn) ? prediction.prdctdn : `${prediction.prdctdn} minutes`,
          stopId: parseInt(prediction.stpid)
        };
      });

      return Promise.resolve(updates);
    });
};

module.exports = (req, res) => {
  return Promise.all(feedStopGroups
    .map((feedStopGroup) => {
      const feedStopIds = feedStopGroup.stops.map((s) => s.id).join(',');
      const feedPredictions = getPredictions(feedStopIds, feedStopGroup.feedId);

      const predictionsByStop = feedPredictions.reduce((acc, prediction) => {
        let stopPredictions = acc.find((s) => s.stopId === prediction.stopId);

        if (!stopPredictions) {
          stopPredictions = {
            buses: [],
            name: feedStopGroup.stops.find((s) => s.id === prediction.stopId).name,
            stopId: prediction.stopId
          };

          acc.push(stopPredictions);
        }

        stopPredictions.buses.push(prediction);

        return acc;
      }, []);

      return Promise.resolve(predictionsByStop);
    }))
    .then((predictionsByFeed) => Promise.resolve(flattenArray(predictionsByFeed)))
    .then((predictions) => {
      res.send(predictions);
      return Promise.resolve();
    })
    .catch(() => {
      res.code(500).send([]);
    });
};
