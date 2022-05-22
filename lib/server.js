const path = require('path');

const app = require('fastify')({ logger: true });

app.register(require('@fastify/static'), {
  root: path.join(__dirname, '../public'),
});

app.get('/api/weather', require('./weather'));
app.get('/api/bus', require('./bus'));

module.exports = app;
