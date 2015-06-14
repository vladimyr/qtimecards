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
        return client.getRecords({
            sortOrder: Client.SortOrder.Ascending,
            forceInEvent: true
        });
    })
    .then(function(records){
        console.log(JSON.stringify(records, null, 2));
    });