const redis = require('redis');

const client = redis.createClient();

class Db {
  constructor() {
    client.on('error', (error) => {
      console.log('Error' + error);
    });

    this.ttl = 60 * 60 * 24;
  }

  saveData(key, value, ttl = this.ttl) {
    return client.setex(key, ttl, JSON.stringify(value), (error, result) => {
      if (error) {
        return console.log(error);
      }

      return result;
    });
  }

  saveHistory(history, key = 'history') {
    return client.set(key, history, (err, result) => {
      if (err) {
        return console.log(err);
      }

      return result;
    });
  }

  deleteRecord(key, cb) {
    return client.del(key, cb);
  }

  getData(key, cb, ttl = this.ttl) {
    return client.get(key, (err, result) => {

      if (err) {
        return console.log(err);
      }

      client.expire(key, ttl, (error) => {
        if (error) {
          console.log(error);
          return false;
        }

        return true;
      });

      cb(result);
      return result;
    });
  }

  getRecord(key, cb = false) {
    client.get(key, (err, result) => {
      if (err) {
        return console.log(__filename, err);
      }

      if (false !== cb) {
        cb(result);        
      }
      return result;
    });
  }

  createKey(url, element, level) {
    return [url, element, level].join('||');
  }

  close() {
    return client.quit();
  }

  getKeys() {
    return client.keys('*', (error, result) => {
      if (error) {
        return console.log(error);
      }

      return result;
    });
  }
}

module.exports = Db;
