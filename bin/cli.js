#!/usr/bin/env node

'use strict'

var commander  = require('commander'),
    multiline  = require('multiline'),
    chalk      = require('chalk'),
    Path       = require('path'),
    getRecords = require(Path.resolve(__dirname, '../index.js'));

// grab metadata from package.json
var pkgData     = require(Path.resolve(__dirname, '../package.json')),
    programName = Object.keys(pkgData.bin)[0],
    programVer  = pkgData.version;


var program = new (commander.Command)(programName);
program
    .version(programVer)
    .option('-u, --username [username]')
    .option('-p, --password [password]')
    .option('-t  --total')
    .option('-s, --sort [method]', 'sorting method: "asc" or "desc"');


var helpMsg = multiline(function(){/*
  This command line utility grabs records from
  qtimecards.com for the specified account and 
  returns them in json format
  
  Example:

  $ qgrab -u <username> -p <password>

  Get total time:
  
  $ qgrab -u <username> -p <password> -t
*/});

program.on('--help', function(){
    console.log(helpMsg);
});

program.parse(process.argv);

if (!program.username || !program.password) {
    chalk.red(console.error('No username and/or password given!'));
    return;
}

var postProcess = function(records){
    console.log(JSON.stringify(records, null, 2));
};

if (program.total)
    postProcess = require(Path.resolve(__dirname, '../util/totalTimeStats.js'));

// do actual work
getRecords(program.username, program.password, program.sort || 'asc', true)
    .done(postProcess);