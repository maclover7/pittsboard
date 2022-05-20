const express = require('express');
const app = express();
const path = require('path');

app.use(express.static(path.join(__dirname, '../public')));
app.get('/api/weather', require('./weather'));
app.get('/api/bus', require('./bus'));
app.get('/ping', (_, res) => { res.status(200).end(); });

module.exports = app;
