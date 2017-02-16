const cheerio = require('cheerio');
const co = require('co');
const fetch = require('node-fetch');
const urlNode = require('url');
const config = require('../config');

const parsedLinks = [];
const linkToParse = [];
let level = 0;

class PageParser {
  constructor(req, res) {
    this.request = req;
    this.response = res;
    this.url = req.query.url;
    this.element = req.query.element;
    this.level = req.query.level;
    this.links = [];
    this.level = this.level || config.app.level;
    this.depth = 0;
    this.parsedLinks = [];
  }

  getPageHtml(url) {
    return fetch(url)
      .then(res => res.text())
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
    this.$(`a[href^='${this.url}']`).map((index, tag) => {
      href = this.prepareLinks(this.$(tag).attr('href'));

      if (parsedLinks.indexOf(href) === -1) {
        linkToParse.push(href);
      }
    });

    return this.links;
  }

  prepareLinks(href) {
    const urlParts = urlNode.parse(href);

    return `${urlParts.protocol}//${urlParts.host}${urlParts.path}`;
  }

  grabPageData(url = this.url, element, res) {
    return this
      .getPageHtml(url)
      .then((result) => {
        const pageElements = this.grabPageElements(result, element);
        const pageLinks = this.grabLinks(result);
  
        parsedLinks.push(url);
        linkToParse.push(...pageLinks);

        console.log(linkToParse, parsedLinks);

        if (parsedLinks.length === linkToParse.length || level >= parsedLinks.length) {
          console.log('Done');
          res.end(JSON.stringify([pageElements, parsedLinks]));
          return true;
        }

        this.grabPageData(linkToParse[linkToParse.indexOf(url) + 1]);
      })
      .catch((error) => {
        console.log(error);
        return;
      });
  }
}

module.exports = PageParser;
