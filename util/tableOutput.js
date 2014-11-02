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
            type = chalk.inverse.green(type);
        else
            type = chalk.inverse.red(type);

        var time = entry.time;
        time = chalk.bold(time);

        entriesTable.push([ time, type, entry.location ])
    });
    entriesTable.push([ chalk.bold('Total:', record.total), '', ''])

    console.log('Entries for: %s', record.date);
    console.log(entriesTable + '\n');
}

module.exports = function(count){
    count = count || 1;
    
    return function printTable(records){
        var targetRecords = records.slice(records.length - count);
        targetRecords.forEach(printEntriesTable);
    };
}