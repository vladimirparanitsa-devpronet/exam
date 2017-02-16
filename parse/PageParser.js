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
    this.parent = [];
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
     
      if (!this.linkInStack(href)) {

        linkToParse.push({
          href,
          parent: this.parent,
        });
      }
    });

    return linkToParse;
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
        let parent = this.findParentLink(url).parent || url;
        this.grabLinks(result);
  
        parsedLinks.push({ href: url, parent });
        console.log(parent);

        if (parsedLinks.length === linkToParse.length || level >= parsedLinks.length) {
          console.log('Done');
          res.end(JSON.stringify([pageElements, parsedLinks]));
          return true;
        }
level++;
        this.grabPageData(linkToParse[linkToParse.indexOf(url) + 1]);
      })
      .catch((error) => {
        console.log(error);
        return;
      });
  }

  findParentLink(currentLink) {
    let result = parsedLinks.find((link) => {
      return link.href === currentLink;
    });

    return result ? result.parent.push(currentLink) : { parent: currentLink };
  }

  linkInStack(link) {
    return linkToParse.some((row) => {
      return row.href === link;
    });
  }

  findIndex(currentLink) {
    linkIndex = 0;
    linkToParse.some((row, index) => {
      if (row) {
        return '';
      }
    });
    return index;
  }
}

module.exports = PageParser;
