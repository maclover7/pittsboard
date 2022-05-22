const axios = require('axios');
const { URLSearchParams } = require('url');

const feedStopGroups = [
  {
    feedId: 'Port Authority Bus',
    stops: [
      { name: 'Craig & Centre DT', id: 2633 },
      { name: 'Craig & Centre EE', id: 2573 },
    ],
  },
  {
    feedId: 'Light Rail',
    stops: [
      { name: 'Steel Plaza N', id: 99995 },
      { name: 'North Side S', id: 98881 },
    ],
  },
];

const flattenArray = (arr) => arr.reduce((acc, val) => acc.concat(val), []);

const getPredictions = (stopIds, feedId) => {
  const params = new URLSearchParams({
    format: 'json',
    key: process.env.PABUS_KEY,
    rtpidatafeed: feedId,
    stpid: stopIds,
  });

  return axios.get(`https://truetime.portauthority.org/bustime/api/v3/getpredictions?${params.toString()}`)
    .then(({ data: response }) => {
      let updates = [];

      Object.keys(response['bustime-response']).forEach((key) => {
        const res = response['bustime-response'][key];

        if (key === 'error') {
          updates = updates.concat(res.map((prediction) => ({
            error: true,
            status: prediction.msg,
            stopId: parseInt(prediction.stpid, 10),
          })));
        } else {
          updates = updates.concat(res.map((prediction) => ({
            destination: prediction.des,
            error: false,
            route: prediction.rt,
            status: Number.isNaN(Number(prediction.prdctdn)) ? prediction.prdctdn : `${prediction.prdctdn} mins`,
            stopId: parseInt(prediction.stpid, 10),
          })));
        }
      });

      return Promise.resolve(updates);
    });
};

module.exports = (req, res) => Promise.all(feedStopGroups
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
              stopId: prediction.stopId,
            };

            acc.push(stopPredictions);
          }

          if (!prediction.error) stopPredictions.buses.push(prediction);

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
