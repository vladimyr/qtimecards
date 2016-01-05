'use strict';

var Client = require('../index.js');
var credentials = require('./credentials.json');

var username = credentials.username;
var password = credentials.password;

var client = Client.create({ baseUrl: 'http://attend.dbtouch.com' });

client.login(username, password)
  .then(function complete() {
    return client.getAbsences({
      userId: credentials.userId,
      sortOrder: 'asc',
      offset: 2
    });
  })
  .then(function(absences) {
    console.log(JSON.stringify(absences, null, 2));
  });
