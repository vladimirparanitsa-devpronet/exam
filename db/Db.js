const redis = require('redis');
const uuid = require('uuid');
const Promise = require('bluebird');

// its worth it
Promise.promisifyAll(redis.RedisClient.prototype);
Promise.promisifyAll(redis.Multi.prototype);

const client = redis.createClient();

class Db {
  constructor() {
    client.on('error', (error) => {
      console.log('Error' + error);
    });

    this.ttl = 60 * 60 * 24;
  }

  saveData(key, value, ttl = this.ttl) {
    return client.setexAsync(key, ttl, JSON.stringify(value));
    // its really easier this way
  }

  saveHistory(history, key = 'history') {
    // the saving history didnt work here - it stored only the first search
    // now it stores Hash for the each history object and List of that hash ids
    const itemKey = uuid.v4();
    return client.multi()
      .hmset(itemKey, history)
      .rpush(key, itemKey)
      .execAsync();
  }

  getHistory(key = 'history') {
    // so now you get the ids of Hashes and then get the actual history records
    return client.lrangeAsync(key, 0, -1)
      .then(keys => Promise.all(keys.map(itemKey => client.hgetallAsync(itemKey))));
  }


  deleteRecord(key, cb) {
    return client.del(key, cb);
  }

  getData(key, ttl = this.ttl) {
    return client.multi()
      .get(key)
      .expire(key, ttl)
      .execAsync()
      .then(results => results[0]);
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

}

module.exports = Db;
