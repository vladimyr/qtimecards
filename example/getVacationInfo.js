'use strict';

var Client = require('../index.js');
var credentials = require('./credentials.json');

var username = credentials.username;
var password = credentials.password;

var client = Client.create({ baseUrl: 'http://attend.dbtouch.com' });

client.login(username, password)
  .then(function complete() {
    return client.getVacationInfo({
      userId: credentials.userId
    });
  })
  .then(function(info){
    console.log(JSON.stringify(info, null, 2));
  });
