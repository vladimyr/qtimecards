'use strict';

var moment = require('moment');
require('moment-duration-format');

/**
 * Prints out required vs. completed time
 * @param  {Array} records array of working records
 */
module.exports = function getStats(workHrsPerDay){
    workHrsPerDay = workHrsPerDay || 7.5;

    return function calculateTime(data){
        var records       = data.records,
            requiredTime  = moment.duration(records.length * workHrsPerDay, 'hours'),
            completedTime = moment.duration(0);

        records.forEach(function(record){
            completedTime.add(moment.duration(record.total));
        });

        console.log('Total [%s working hrs per day]: %s / %s', workHrsPerDay,
            requiredTime.format('h:mm'), completedTime.format('h:mm'));
    };
};