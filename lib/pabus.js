const request = require('request-promise');
const parseString = require('util').promisify(require('xml2js').parseString);

module.exports = (req, res) => {
  request({
    url: `http://truetime.portauthority.org/bustime/eta/getStopPredictionsETA.jsp?route=all&stop=Port%20Authority%20Bus:${process.env.PABUS_ID}&key=${process.env.PABUS_KEY}`,
    encoding: null
  })
  .then(parseString)
  .then((bus) => {
    const updates = bus.stop.pre.map((pre) => {
      return {
        status: pre.pt.concat(pre.pu).join('').replace('&nbsp;', ''),
        route: pre.rn.join('').trim(),
        destination: pre.fd.join('').trim()
      }
    });

    res.json(updates);
  });
};

