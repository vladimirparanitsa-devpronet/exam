#!/usr/bin/env node

/*
  The shebang (#!) at the start means execute the script with what follows.
  /bin/env looks at your current node environment.
  Any argument to it not in a 'name=value' format is a command to execute.
*/

const command = require('commander');
const promptly = require('promptly');
const chalk = require('chalk');
const querystring = require('querystring');
const http = require('http');
const config = require('../config/');

command
  .option('-u, --url <link>', 'Add URL')
  .option('-e, --element <tag>', 'Add correct tag')
  .option('-l, --level [depth]', 'Add level of depth')
  .parse(process.argv);

// const postData = querystring.stringify({
//   element: command.element,
//   level: command.level,
// });

const level = command.level || config.level;
const url = querystring.escape(command.url);

http.get(`http://127.0.0.1:${config.server.port}/api/search/?url=${url}&element=${command.element}&level=${level}`, (res) => {
  const statusCode = res.statusCode;
  const contentType = res.headers['content-type'];

  let error;
  if (statusCode !== 200) {
    error = new Error(`Request Failed.\n` +
                      `Status Code: ${statusCode}`);
  } else if (!/^application\/json/.test(contentType)) {
    error = new Error(`Invalid content-type.\n` +
                      `Expected application/json but received ${contentType}`);
  }
  if (error) {
    console.log(error.message);
    // consume response data to free up memory
    res.resume();
    return;
  }

  res.setEncoding('utf8');
  let rawData = '';
  res.on('data', (chunk) => rawData += chunk);
  res.on('end', () => {
    try {
      let parsedData = JSON.parse(rawData);
      console.log(parsedData);
    } catch (e) {
      console.log(e.message);
    }
  });
}).on('error', (e) => {
  console.log(`Got error: ${e.message}`, e);
});
