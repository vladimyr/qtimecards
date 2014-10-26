#!/usr/bin/env node

'use strict'

var program    = require('commander'),
    multiline  = require('multiline'),
    chalk      = require('chalk'),
    Path       = require('path'),
    getRecords = require(Path.resolve(__dirname, '../index.js'));

program
    .option('-u, --username [username]')
    .option('-p, --password [password]')
    .option('-s, --sort [method]', 'sorting method: "asc" or "desc"');

var helpMsg = multiline(function(){/*
  This command line utility grabs records from
  qtimecards.com for the specified account and 
  returns them in json format
  
  Example:

  $ qtimecards -u <username> -p <password>
*/});

program.on('--help', function(){
    console.log(helpMsg);
});

program.parse(process.argv);

if (!program.username || !program.password) {
    chalk.red(console.error('No username and/or password given!'));
} else {
    getRecords(program.username, program.password, program.sort || 'asc', true)
        .then(function(records){
            console.log(JSON.stringify(records, null, 2));
        });
}