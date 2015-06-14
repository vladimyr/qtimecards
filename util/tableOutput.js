'use strict';

var chalk = require('chalk'),
    fecha = require('fecha'),
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

    var date = new Date(record.date);
    console.log('Entries for: %s', fecha.format(date, 'DD.MM.YYYY'));
    console.log(entriesTable + '\n');
}

module.exports = function(count){
    count = Number(count) || 1;
    
    return function printTable(data){
        var records       = data.records,
            startDate     = new Date().getDate(),
            targetRecords = records.slice(startDate - count, startDate);
        
        targetRecords.forEach(printEntriesTable);
    };
};