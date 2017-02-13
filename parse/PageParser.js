const cheerio = require('cheerio');
const co = require('co');
const fetch = require('node-fetch');

class PageParser {
  constructor(req, res) {
    this.request = req;
    this.response = res;
    this.query = this.request.query;
  }

  getPageHtml({ url, level, element }) {
    this.response.end(url);
    return fetch(url)
      .then(res => res.text())
      .then(text => text)
      .catch((error) => {
        console.log(error);
        return false;
      });
  }

  grabPageElements(pageHtml, element) {
    const $ = cheerio.load(pageHtml);
    const result = [];
    $(element).map((index, tag) => {
      result.push($(tag).text());
    });

    return result;
  }

  static build(req, res) {
    console.log('start');
    const pageParser = new PageParser(req, res);

    co(function* () {
      const pageHtml = yield pageParser.getPageHtml(pageParser.query);
      const pageElements = yield pageParser.grabPageElements(pageHtml, pageParser.query.element);
      console.log(pageElements);
      // yield res.end(pageHtml);
    })
      .catch((error) => {
        console.log(error);
      });
  }
}

module.exports = PageParser;
