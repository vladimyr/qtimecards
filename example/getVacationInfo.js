'use strict';

var Client      = require('../index.js'),
    credentials = require('./credentials.json');

var options = {
    username: credentials.username,
    password: credentials.password,
    baseUrl: 'http://attend.dbtouch.com'
};

Client.create(options)
    .then(function complete(client){
        return client.getVacationInfo();
    })
    .then(function(info){
        console.log(JSON.stringify(info, null, 2));
    });