'use strict';

var Promise = require('bluebird'),
    Url     = require('url'),
    request = require('request'),
    scrape  = require('./lib/scraper.js'),
    types   = require('./lib/types.js'),
    debug   = require('debug')('http');

request = request.defaults({
    jar:                true,
    followRedirect:     true,
    followAllRedirects: true
});
request = Promise.promisifyAll(request);

var BASE_URL = 'http://attend.dbtouch.com';


function Client(baseUrl) {
    this._baseUrl  = baseUrl || BASE_URL;
}

Client.create = function(options){
    options = options || {};

    var client = new Client(options.baseUrl);
    return client._login(options.username, options.password);
};
Client.baseUrl   = BASE_URL;
Client.SortOrder = types.SortOrder;
Client.EntryType = types.EntryType;

Client.prototype.dispose = function(){
    return this._login();
};

Client.prototype._login = function(username, password){
    var self = this,
        url  = Url.resolve(self._baseUrl, '/login/auth'),
        options;

    self._username = username;

    return request.headAsync(url)
        .spread(function complete(response, body) {
            url = Url.resolve(self._baseUrl, '/j_spring_security_check');
            options = {
                form: {
                    'j_username': username,
                    'j_password': password
                }
            };

            return request.postAsync(url, options);
        })
        .spread(function complete(response, body){
            var urlPath = response.req.path;

            debug('server responded with: %d', response.statusCode);
            debug('response url: %s', urlPath);

            var matches = urlPath.match(/^\/record\/usersRecords\/(\d+)$/);

            if (matches && matches[1]) {
                self._userId = Number(matches[1]);
                return self;
            }

            throw new Error('Login failed, wrong username and/or password!');
        });
};

Client.prototype._logout = function() {
    var url = Url.resolve(this._baseUrl, '/j_spring_security_logout');
    return request.get(url);
};

Client.prototype.getRecords = function(options){
    options = options || {};

    var path   = '/record/usersRecords/' + this._userId,
        url    = Url.resolve(this._baseUrl, path),
        offset = options.offset || 1;

    return request.getAsync(url, { qs: { offset: offset }})
        .spread(function complete(response, body){
            return scrape(body, options.sortOrder, options.forceInEvent);
        });
};

Client.prototype.submitNewRecord = function(recordData){
    var self    = this,
        url     = Url.resolve(self.baseUrl, '/record/saveRecordManual'),
        options = { form: { 'editReason': recordData } };

    return request.postAsync(url, options)
        .spread(function complete(response, body){
            debug('server responded with: %d', response.statusCode);
            debug('response body: %s', body);

            return response.statusCode === 200;
        });
};

module.exports = Client;