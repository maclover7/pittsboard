const axios = require('axios');
const { URLSearchParams } = require('url');

const feedStopGroups = [
  {
    feedId: 'Port Authority Bus',
    stops: [
      { name: 'Craig & Centre DT', id: 2633 },
      { name: 'Craig & Centre EE', id: 2573 },
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
  const params = new URLSearchParams({
    format: 'json',
    key: process.env.PABUS_KEY,
    rtpidatafeed: feedId,
    stpid: stopIds
  });

  return axios.get(`https://truetime.portauthority.org/bustime/api/v3/getpredictions?${params.toString()}`)
    .then(({ data: response }) => {
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
      return getPredictions(feedStopIds, feedStopGroup.feedId)
        .then((feedPredictions) => {
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
        });
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
