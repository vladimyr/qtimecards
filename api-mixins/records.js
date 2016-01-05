'use strict';

var utils = require('../parser/utils.js');
var debug = require('debug')('records');


var DEFAULT_RECORD_REASON = 'Zaboravio/-la sam se prijaviti';

module.exports = function(client, request) {
  client.getRecords = function(options) {
    options = options || {};
    options.sortOrder = options.sortOrder || 'asc';
    options.normalizeRecords = options.normalizeRecords || false;
    options.includeAbsenceInfo = options.includeAbsenceInfo || false;
    options.targetData = 'records';

    debug('#getRecords called...');
    this._checkUserId(options.userId);

    var url = this._makeUrl('/record/usersRecords/', this._userId);
    var offset = options.offset || 1;

    debug('issuing GET request with offset: %d to: %s', offset, url);
    return request.getAsync(url, { qs: { offset: offset }})
      .spread(this._handleRecordListResponse(options).bind(this));
  };

  client._handleSubmissionResponse = function(response, body) {
    debug('processing submit record response...');
    this._checkResponse(response, body);

    debug('new record added successfully');
  };

  client.submitRecord = function(data) {
    data = data || {};

    debug('#submitRecord called...');
    this._checkUserId(data.userId);

    var recordTime = utils.getRecordTime(data.time);
    var reason = data.reason || DEFAULT_RECORD_REASON;
    var message = data.message;

    debug([
        'filling up record form with:',
        '\trecordTime: "%s"',
        '\treason: "%s"',
        '\tmessage: "%s"'
      ].join('\n'),
      recordTime, reason, message);

    var options = {
      form: {
        dateCreated: recordTime,
        'selected-reason': '',
        editReason: message
      }
    };

    var url = this._makeUrl('/record/saveRecordManual');
    debug('issuing POST request with record form data to: %s', url);

    return request.postAsync(url, options)
      .spread(this._handleSubmissionResponse.bind(this));
  };

  return client;
};
