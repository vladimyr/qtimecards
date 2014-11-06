#!/usr/bin/env node

'use strict';

var commander = require('commander'),
    multiline = require('multiline'),
    chalk     = require('chalk'),
    Table     = require('cli-table'),
    Path      = require('path'),
    prompt    = require(Path.resolve(__dirname, './prompt.js')),
    client    = require(Path.resolve(__dirname, '../index.js'));

// grab metadata from package.json
var pkgData     = require(Path.resolve(__dirname, '../package.json')),
    programName = Object.keys(pkgData.bin)[0],
    programVer  = pkgData.version;


var program = new (commander.Command)(programName);
program
    .version(programVer)
    .option('-u, --username [username]')
    .option('-t, --total [working hrs per day]')
    .option('-a, --add-record [record data]')
    .option('--table [days to show]')
    .option('-s, --sort [method]', 'sorting method: "asc" or "desc"');


var helpMsg = multiline(function(){/*
  This command line utility grabs records from
  qtimecards.com for the specified account and 
  returns them in json format
  
  Get records as json:

  $ qgrab [-u <username>] [-s <sorting_method>]

  Output latest daily records in table format:

  $ qgrab --table [records_count] [-u <useraname>] [-s <sorting_method>]

  Get total time stats:
  
  $ qgrab [-u <username>] -t <working_hrs_per_day>

  Add new record:

  $ qgrab [-u <username>] -as
*/});

program.on('--help', function(){
    console.log(helpMsg);
});

program.parse(process.argv);


function validateString(input) {
    return input && input.length > 0;
}

function defaultEmailDomain(input) {
    if (input.indexOf('@') == -1)
        return input + '@extensionengine.com';

    return input;
}

var usernameInput = {
    type:     'input',
    message:  'Enter your qtimecards.com username (email):',
    name:     'username',
    validate: validateString,
    filter:   defaultEmailDomain
};

var passwordInput = {
    type:    'password',
    message: 'Enter your qtimecards.com password',
    name:    'password',
    validate: validateString
};

var confirmSubmission = {
    type:      'confirm',
    message:   'Are you sure you want to submit new record?',
    name:      'confirmed',
    'default': false
};

var inputs = [ passwordInput ];

if (!program.username)
    inputs.unshift(usernameInput);


var postProcess;

if (program.addRecord) {
    inputs.push(confirmSubmission);

    postProcess = function(success) {
        if (!success)
            console.log(chalk.magenta('New record is not submitted!'));
        else
            console.log(chalk.green('Record sucessfully submitted.'));
    };
} else {
    postProcess = function(records){
        console.log(JSON.stringify(records, null, 2));
    };

    if (program.total) {
        var workHrsPerDay = parseInt(program.total, 10);
        postProcess = require(Path.resolve(__dirname, '../util/totalTimeStats.js'))(workHrsPerDay);
    } else if (program.table) {
        var count = parseInt(program.table, 10);
        postProcess = require(Path.resolve(__dirname, '../util/tableOutput.js'))(count);
    }
}


prompt(inputs)
    .then(function complete(answers){
        console.log();

        var username = defaultEmailDomain(program.username || answers.username),
            password = answers.password;
        
        if (!program.addRecord) {
            var sortMethod   = program.sort || 'asc',
                forceInEvent = true;

            return client.getRecords(username, password, sortMethod, forceInEvent);
        }

        if (!answers.confirmed)
            return false;

        return client.submitNewRecord(username, password, program.addRecord);
    })
    .done(postProcess, handleError);

function handleError(err){
    console.error(chalk.red(err.message));
}