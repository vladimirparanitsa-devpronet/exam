const cheerio = require('cheerio');
const co = require('co');
const fetch = require('node-fetch');
const urlNode = require('url');
const config = require('../config');

class PageParser {
  constructor(req, res) {
    this.request = req;
    this.response = res;
    this.query = this.request.query;
    this.links = [];
    this.level = this.query.level || config.app.level;
    this.depth = 0;
    this.parsedLinks = [];

    this.links.push(this.query.url);
  }

  getPageHtml(url) {
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
    let href = '';
    this.$(`a[href^='${this.query.url}']`).map((index, tag) => {
      href = this.prepareLinks(this.$(tag).attr('href'));

      if (this.links.indexOf(href) === -1) {
        this.links.push(href);
      }
    });

    return this.links;
  }

  prepareLinks(href) {
    const urlParts = urlNode.parse(href);

    return `${urlParts.protocol}//${urlParts.host}${urlParts.path}`;
  }
}

module.exports = PageParser;
