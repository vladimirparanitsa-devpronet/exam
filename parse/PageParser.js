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
    return fetch(url)
      .then(res => res.text())
      .then(text => text)
      .catch((error) => {
        console.log(error);
        return false;
      });
  }

  grabPageElements(pageHtml, element) {
    this.$ = cheerio.load(pageHtml);
    const result = [];
    this.$(element).map((index, tag) => {
      result.push(this.$(tag).html());
    });

    return result;
  }

  grabLinks() {
    const links = [];

    this.$('a:not([href*="mailto:"])').map((index, tag) => {
      console.log(this.$(tag));
      links.push(this.$(tag).attr('src'));
    });

    return links;
  }

  static build(req, res) {
    console.log('start');
    const pageParser = new PageParser(req, res);

    co(function* () {
      const pageHtml = yield pageParser.getPageHtml(pageParser.query);
      const pageElements = yield pageParser.grabPageElements(pageHtml, pageParser.query.element);
      const pageLinks = yield pageParser.grabLinks();

      // console.log(pageLinks);
      yield res.end(pageHtml);
    })
      .catch((error) => {
        console.log(error);
      });
  }
}

module.exports = PageParser;
