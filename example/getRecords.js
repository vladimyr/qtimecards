'use strict';

var Client = require('../index.js');
var credentials = require('./credentials.json');

var username = credentials.username;
var password = credentials.password;

var client = Client.create({ baseUrl: 'http://attend.dbtouch.com' });

client.login(username, password)
  .then(function complete() {
    return client.getRecords({
      userId: credentials.userId,
      sortOrder: 'asc',
      normalizeRecords: true,
      includeAbsenceInfo: true,
      offset: 2
    });
  })
  .then(function(records) {
    console.log(JSON.stringify(records, null, 2));
  });
