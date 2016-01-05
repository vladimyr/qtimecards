'use strict';

var _ = require('lodash');
var utils = require('./utils.js');


function parseVacationInfo(input, options) {
  var $ = utils.getDOM(input);
  var num = _.compose(utils.readInteger, utils.querySelector($));

  var vacationInfo = {
    category: {
      old: num('.old-vacation-input'),
      'new': num('.new-vacation-input'),
      additional: num('.additional-vacation-input')
    },
    usage: {
      used: num('.total-vacation-input'),
      unused: num('.used-vacation-input'),
      total: num('.unused-vacation-input')
    }
  };

  vacationInfo.notes = $('textarea[name^="vacation-notes"]').val();
  return vacationInfo;
}

module.exports = parseVacationInfo;
