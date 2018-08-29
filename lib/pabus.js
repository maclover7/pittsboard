const request = require('request-promise');
const parseString = require('util').promisify(require('xml2js').parseString);

const properlyCapitalize = (str) => {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const nameForId = {
  35: 'Forbes @ Thackeray',
  9024: 'Sennott',
  8653: 'Sutherland Inbound'
};

const getBusesForStop = (id) => {
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

        resolve({ [nameForId[id]]: updates });
      });
    });
};

module.exports = (req, res) => {
  const promises = process.env.PABUS_IDS
    .split(',')
    .map((id) => { return getBusesForStop(id); });

  Promise.all(promises)
    .then((times) => { res.json(times); })
    .catch(() => {
      res.status(500).json([]);
    });
};
