'use strict';

var Url = require('url');
var debug = require('debug')('auth');

module.exports = function(client, request) {
  client._initSession = function() {
    var url = this._makeUrl('/login/auth');
    debug('starting session...');
    debug('issuing HEAD request to: %s', url);
    return request.headAsync(url);
  };

  client._submitLoginForm = function(username, password) {
    debug([
        'filling up login form with:',
        '\tusername: "%s"',
        '\tpassword: "%s"'
      ].join('\n'),
      username, password);

    var options = {
      form: {
        'j_username': username,
        'j_password': password
      }
    };

    return function doRequest() {
      var url = this._makeUrl('/j_spring_security_check');
      debug('issuing POST request with login form data to: %s', url);
      return request.postAsync(url, options);
    };
  };

  client._collectUserId = function(url) {
    debug('collecting userId...');
    var matches = url.match(/\/record\/usersRecords\/(\d+)$/);

    if (matches && matches[1]) {
      this._userId = parseInt(matches[1], 10);
      debug('userId found: %d', this.userId);
      return;
    }

    debug('warning: userId is not found!');
  };

  client._handleLoginResponse = function(response, body) {
    var req = response.request;
    var url = req.uri.href;

    debug('processing login response...');
    this._checkResponse(response, body);

    var href = req.headers.referer;
    var query = Url.parse(href, true).query;

    if (query.login_error) {
      debug('error: login_error query param was found!');
      throw new Error('Login failed, wrong username and/or password!');
    }

    debug('login succeeded');
    this._collectUserId(url);
  };

  client.login = function(username, password) {
    debug('received login request');
    this._username = username;

    return this._initSession()
      .spread(this._submitLoginForm(username, password).bind(this))
      .spread(this._handleLoginResponse.bind(this));
  };

  client.getUserId = function() {
    return this._userId;
  };

  client._cleanup = function() {
    debug('doing cleanup...');
    this._username = null;
    debug('cleanup finished');
  };

  client.logout = function() {
    debug('received logout request');
    var url = this._makeUrl('/j_spring_security_logout');

    debug('issuing GET request to: %s', url);
    return request.get(url)
      .then(this._cleanup.bind(this));
  };

  return client;
};
