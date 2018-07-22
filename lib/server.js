const express = require('express');
const app = express();

app.get('/api/weather', require('./weather'));

module.exports = app;
