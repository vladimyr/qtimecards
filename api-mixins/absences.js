'use strict';

var debug = require('debug')('vacation');

module.exports = function(client, request) {
  client.getAbsences = function(options){
    options = options || {};
    options.targetData = 'absences';
    options.sortOrder = options.sortOrder || 'asc';

    debug('#getAbsences called...');
    this._checkUserId(options.userId);

    var url = this._makeUrl('/record/usersRecords/', this._userId);
    var offset = options.offset || 1;

    debug('issuing GET request with offset: %d to: %s', offset, url);
    return request.getAsync(url, { qs: { offset: offset }})
      .spread(this._handleRecordListResponse(options).bind(this));
  };

  return client;
};
