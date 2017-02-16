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

  grabLinks(currentLink, parent) {
    let href = '';

    this.$(`a[href^='${this.url}']`).map((index, tag) => { //TODO issue if links without http
      href = this.prepareLinks(this.$(tag).attr('href'));
// console.log('\n\n\n\n', currentLink, href, '\n\n\n\n');

      if (!this.linkInStack(href)) {
        // console.log(this.parent, currentLink, linkToParse[this.findIndex(currentLink)]);
        //TODO for some reason parent links are the same
        linkToParse.push({
          href,
          parent: [].concat(parent, currentLink),
        });
        // console.log('after ---->', linkToParse);
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
        this.grabLinks(url, parent);
  console.log(parent);
        parsedLinks.push({ href: url, parent });
        // console.log('\n\n\n\n Links to parse -> ', linkToParse, '\n\n\n', url);

        if (parsedLinks.length === linkToParse.length || 6 <= parsedLinks.length) {
          // console.log('Done', parsedLinks.length === linkToParse.length, 6 <= parsedLinks.length);
          res.end(JSON.stringify([pageElements, parsedLinks]));
          return true;
        }
level++;
        this.grabPageData(linkToParse[this.findIndex(url) + 1].href);
      })
      .catch((error) => {
        console.log(error);
        return;
      });
  }

  findParentLink(currentLink) {
    if (parsedLinks.length === 0) {
      return { parent: currentLink };
    }

    let result = parsedLinks.find((link) => {
      return link.href === currentLink;
    });

    return { parent: currentLink };
  }

  linkInStack(link) {
    return linkToParse.some((row) => {
      return row.href === link;
    });
  }

  findIndex(currentLink) {
    let linkIndex = 0;
    linkToParse.some((row, index) => {
      if (row.href === currentLink) {
         linkIndex = index;
        return true;
      }
    });

    return linkIndex;
  }
}

module.exports = PageParser;
