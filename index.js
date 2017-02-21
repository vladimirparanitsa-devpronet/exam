const express = require('express');
const config = require('./config');
const Parser = require('./parse/PageParser');
const Db = require('./db/Db');
const argv = require('minimist')(process.argv.slice(2));
const swagger = require('swagger-node-express');
const bodyParser = require('body-parser');

const app = express();
const port = config.server.port || 3000;
const db = new Db();

app.get('/api/search', (req, res) => {
  res.setHeader('Content-type', 'application/json');

  const pageParser = new Parser(req, res);

  db.getData(pageParser.key, (result) => {
    if (result) {
      return res.end(result);
    }

    pageParser.grabPageData();
  });
});

app.get('/api/search/list', (req, res) => {
  res.setHeader('Content-type', 'application/json');

  db.getRecord('history', (result) => {
    res.end(result);
  });
});

app.delete('/api/search', (req, res) => {
  const pageParser = new Parser(req, res);

  db.deleteRecord(pageParser.key, (error, result) => {
    if (error) {
      res.end({ error: 'Please try again later' });
      console.log(error);
    }
    res.setHeader('Content-type', 'application/json');

    if (! result) {
      res.status(404).end(JSON.stringify({ status: 'Error', message: 'Not Found' }));
    }

    res.end(JSON.stringify({ status: 'Removed', message: 'OK' }));
  });
});

const subpath = express();
app.use(bodyParser());
app.use('/v1', subpath);

swagger.setAppHandler(subpath);
app.use(express.static('dist'));

swagger.setApiInfo({
  title: 'Scraper API',
  description: 'API scrap',
  termsOfServiceUrl: '',
  contact: 'vladimir.paranitsa@dev-pro.net',
  license: '',
  licenseUrl: '',
});

subpath.get('/', (req, res) => {
  res.sendFile(__dirname + '/dist/index.html');
});
// swagger.configureSwaggerPaths('', 'api-docs', '');

let domain = '127.0.0.1';
if (argv.domain !== undefined) {
  domain = argv.domain;
} else {
  console.log('No --domain=xxx specified, taking default hostname "localhost".');
}

const applicationUrl = `http://${domain}:${port}`;
swagger.configure(applicationUrl, '1.0.0');

// console.log('\033[2J'); // TODO remove before deploy
app.listen(port, () => {
  console.log(`Server listen 127.0.0.1:${port} port`);
});
