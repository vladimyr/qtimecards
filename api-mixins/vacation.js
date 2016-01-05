'use strict';

var debug = require('debug')('vacation');

module.exports = function(client, request) {
  client.getVacationInfo = function(options){
    options = options || {};
    options.targetData = 'vacationInfo';

    debug('#getVacationInfo called...');
    this._checkUserId(options.userId);

    var url = this._makeUrl('/record/usersRecords/', this._userId);

    debug('issuing GET request with to: %s', url);
    return request.getAsync(url)
      .spread(this._handleRecordListResponse(options).bind(this));
  };

  return client;
};
