const express = require('express');
const config = require('./config');
const Parser = require('./parse/PageParser');
const co = require('co');

const app = express();
const port = config.server.port || 3000;

app.get('/api/search', (req, res) =>{
  const pageParser = new Parser(req, res);

  pageParser.links.map((link) => {
    co(function* generatorFunc() {
      // console.log(link);
      const pageHtml = yield pageParser.getPageHtml(link);
      const pageElements = yield pageParser.grabPageElements(pageHtml, pageParser.query.element);
      const pageLinks = yield pageParser.grabLinks();

      pageParser.links.push(...pageLinks);
      pageParser.parsedLinks.push(link);
      // delete pageParser.links[pageParser.links.indexOf(link)];
      // console.log(pageParser.links.sort());
      // yield pageParser.response.send(pageHtml);
      return this;
    })
      .then((result) => {
        console.log(link);
      })
      .catch((error) => {
        console.log(error);
      });
  });
});
// console.log('\033[2J'); // TODO remove before deploy
app.listen(port, () => {
  console.log(`Server listen 127.0.0.1:${port} port`);
});
