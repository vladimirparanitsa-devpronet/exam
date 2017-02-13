const express = require('express');
const config = require('./config');
const pageParser = require('./parse/PageParser');

const app = express();
const port = config.server.port || 3000;

app.get('/api/search', pageParser.build);

app.listen(port, () => {
  console.log(`Server listen 127.0.0.1:${port} port`);
});
