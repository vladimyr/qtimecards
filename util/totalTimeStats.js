'use strict';

var moment = require('moment');
require('moment-duration-format');

var workHrsPerDay = 7.5;

/**
 * Prints out required vs. completed time
 * @param  {Array} records array of working records
 */
module.exports = function getStats(records){
    var requiredTime  = moment.duration(records.length * workHrsPerDay, 'hours'),
        completedTime = moment.duration(0);

    records.forEach(function(record){
        completedTime.add(moment.duration(record.total));
    });

    console.log('Total [%s working hrs per day]: %s / %s', workHrsPerDay,
        requiredTime.format('h:mm'), completedTime.format('h:mm'));
};