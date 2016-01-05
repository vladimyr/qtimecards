'use strict';

var Promise = require('bluebird');
var urlJoin = require('url-join');
var debug = require('debug')('client');

// setup request
var request = require('request');
request = request.defaults({
    jar: true,
    followRedirect: true,
    // follow non GET redirects
    followAllRedirects: true
});
request = Promise.promisifyAll(request, { multiArgs: true });


var BASE_URL = 'http://attend.dbtouch.com';

function Client(options) {
  options = options || {};
  this.baseUrl = options.baseUrl || BASE_URL;
  debug('instance created: baseUrl=%s', this.baseUrl);
}

Client.prototype._makeUrl = function() {
  var args = [].slice.call(arguments);
  args.unshift(this.baseUrl);
  return urlJoin.apply(null, args);
};

Client.prototype._checkUserId = function(userId) {
  debug('doing userId check...');
  this._userId = this._userId || userId;

  if (!this._userId) {
    debug('error: userId check failed!');
    throw new Error('No userId provided!');
  }

  debug('userId check passed: userId=%d', userId);
};

Client.prototype._checkResponse = function(response, body) {
  var req = response.request;
  var url = req.uri.href;

  // locus trap
  // eval(require('locus'));

  debug('server responded with: %d', response.statusCode);
  debug('response url: %s', url);

  if (response.statusCode < 200 || response.statusCode >= 300) {
    debug('error: invalid status code received! [statusCode=%s]', response.statusCode);
    throw new Error('Server returned an error, request failed!');
  }
};

var parseVacationInfo = require('./parser/parseVacationInfo.js');
var parseRecords = require('./parser/parseRecords.js');
var parseAbsences = require('./parser/parseAbsences.js');

Client.prototype._handleRecordListResponse = function(options) {
  return function processBody(response, body) {
    //jshint validthis:true
    debug('processing record list response...');
    this._checkResponse(response, body);

    debug('got valid response, parsing record list...');
    debug('targetData: %s', options.targetData);

    var data = null;
    if (options.targetData === 'vacationInfo') {
      data = parseVacationInfo(body, options);
      debug('vacation info successfully extracted');
      return data;
    }

    if (options.targetData === 'absences') {
      data = parseAbsences(body, options);
      debug('absences successfully extracted');
      return data;
    }

    if (options.targetData === 'records') {
      data = parseRecords(body, options);
      debug('records successfully extracted');
      return data;
    }

    debug('warning: unknown targetData!');
    return data;
  };
};

Client.create = function(options){
  return new Client(options);
};

// attach API mixins
require('./api-mixins/auth.js')(Client.prototype, request);
require('./api-mixins/records.js')(Client.prototype, request);
require('./api-mixins/vacation.js')(Client.prototype, request);
require('./api-mixins/absences.js')(Client.prototype, request);

Client.EntryType = require('./parser/utils.js').EntryType;

module.exports = Client;
