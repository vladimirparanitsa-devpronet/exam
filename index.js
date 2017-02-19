const express = require('express');
const config = require('./config');
const Parser = require('./parse/PageParser');
const co = require('co');
const Db = require('./db/Db');

const app = express();
const port = config.server.port || 3000;
const db = new Db();

app.get('/api/search', (req, res) => {
  const pageParser = new Parser(req, res);

  db.getData(pageParser.key, (result) => {
    if (result) {
      return res.end(result);
    }

    pageParser.grabPageData();
  });
});

app.get('/api/search/list', (req, res) => {

  db.getRecord('history', (result) => {
    res.end(result);
  });
});

app.delete('/api/search', (req, res) => {
  const pageParser = new Parser(req, res);
  db.deleteRecord(pageParser.key, (error, result) => {
    if (error) {
      console.log(error);
    }

    if (! result) {
      res.status(404).end('Not Found');
    }

    res.end('Removed');
  });
});

// console.log('\033[2J'); // TODO remove before deploy
app.listen(port, () => {
  console.log(`Server listen 127.0.0.1:${port} port`);
});
