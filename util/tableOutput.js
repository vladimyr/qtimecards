'use strict';

var chalk = require('chalk'),
    Table = require('cli-table');

function printEntriesTable(record) {
    var entriesTable = new Table({
        head: [ chalk.cyan('Time'), chalk.cyan('Type'), chalk.cyan('Location') ],
        colAligns: [ 'right', 'left', 'left' ]
    });
    record.entries.forEach(function(entry, i){
        var type = entry.type;
        if (type === 'in')
            type = chalk.green(type);
        else
            type = chalk.red(type);

        var time = entry.time;
        time = chalk.bold(time);

        entriesTable.push([ time, type, entry.location ]);
    });
    entriesTable.push([ chalk.bold('Total:', record.total), '', '']);

    console.log('Entries for: %s', record.date);
    console.log(entriesTable + '\n');
}

module.exports = function(count){
    count = count || 1;
    
    return function printTable(records){
        var startDate     = new Date().getDate() + 1,
            targetRecords = records.slice(startDate - count, startDate);
        
        targetRecords.forEach(printEntriesTable);
    };
};