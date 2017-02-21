const cheerio = require('cheerio');
const co = require('co');
const fetch = require('node-fetch');
const urlNode = require('url');
const config = require('../config');
const Db = require('../db/Db');

const parsedLinks = [];
const linkToParse = [];

class PageParser {
  constructor(req, res) {
    this.request = req;
    this.response = res;
    this.url = req.query.url;
    this.element = req.query.element;
    this.level = req.query.level || config.app.level;
    this.depth = 0;
    this.parsedLinks = [];
    this.parent = [];
    this.result = { foundElements: [] };
    linkToParse.push({ href: this.url, parent: [] });
    this.db = new Db();
    this.key = this.db.createKey(this.url, this.element, this.level);
  }

  getPageHtml(url) {
    return fetch(url)
      .then(res => res.text())
      .catch((error) => {
        this.response.end({ error: 'Sorry, but looks like we can not get required URL' });
        console.log(error);
        return false;
      });
  }

  grabPageElements(pageHtml, element = this.element) {
    this.$ = cheerio.load(pageHtml);
    const result = [];
    this.$(element).map((index, tag) => {
      result.push(this.$(tag).html());
    });

    return result;
  }

  grabLinks(parent) {
    let href = '';

    this.$(`a[href^='${this.url}']`).map((index, tag) => { //TODO issue if links without http or use trail slash
      href = this.prepareLinks(this.$(tag).attr('href'));

      if (this.isFile(href)) {
        return true;
      }

      if (!this.linkInStack(href)) {
        linkToParse.push({
          href,
          parent: [].concat(parent),
        });
      }
    });

    return linkToParse;
  }

  isFile(url) {
    return /\.png|jpg|gif|msi|pkg|.gz|asc|txt|xz|zip/.test(url);
  }

  prepareLinks(href) {
    const urlParts = urlNode.parse(href);

    return `${urlParts.protocol}//${urlParts.host}${urlParts.path}`;
  }

  grabPageData(data = { href: this.url, parent: [] }, element) {
    return this
      .getPageHtml(data.href)
      .then((result) => {
        const pageElements = this.grabPageElements(result, element);
        this.result.foundElements = this.result.foundElements.concat(pageElements);
        let parent = [].concat(...data.parent, data.href);
        this.grabLinks(parent);
  
        parsedLinks.push({ href: data.href, parent });

        if (parsedLinks.length === linkToParse.length || parent.length >= this.level) {
          this.response.end(JSON.stringify([this.result]));
          this.db.saveData(this.key, this.result);
          this.updateHistory();

          return true;
        }

        setTimeout(() => {
          return this.grabPageData(linkToParse[this.findIndex(data.href) + 1]);
        }, 0);
      })
      .catch((error) => {
        this.response.end({ error: 'Ooops, something went wrong' });
        console.log(error);
        return false;
      });
  }

  findParentLink(linkData) {
    if (parsedLinks.length === 0) {
      return currentLink;
    }

    let result = linkToParse.find((link) => {
      return link.href === linkData.href;
    });

    if (result) {
      return result;
    }
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

  checkDb(key = this.key) {
    return this.db.getData(key);
  }

  updateHistory() {
    this.db.getRecord('history', (err, result) => {
      if (err) {
        this.response.end({ error: 'Please try again later' });
        return console.log(err);
      }

      const records = result ? JSON.parse(result) : [];
      records.push({ url: this.url, element: this.element, level: this.level });
      this.db.saveHistory(JSON.stringify({ history: records }));
    });
  }
}

module.exports = PageParser;
