const request = require('request-promise');
const parseString = require('util').promisify(require('xml2js').parseString);

const properlyCapitalize = (str) => {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

module.exports = (req, res) => {
  request({
    url: 'http://truetime.portauthority.org/bustime/eta/getStopPredictionsETA.jsp',
    qs: {
      route: 'all',
      stop: `Port Authority Bus:${process.env.PABUS_ID}`,
      key: process.env.PABUS_KEY
    },
    encoding: null
  })
    .then(parseString)
    .then((bus) => {
      const updates = bus.stop.pre.map((pre) => {
        return {
          status: properlyCapitalize(pre.pt.concat(pre.pu).join('').replace('&nbsp;', '')),
          route: pre.rn.join('').trim(),
          destination: properlyCapitalize(pre.fd.join('').trim())
        };
      });

      res.json(updates);
    })
    .catch(() => {
      res.status(500).json([]);
    });
};
