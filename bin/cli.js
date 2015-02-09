#!/usr/bin/env node

'use strict';

var commander = require('commander'),
    multiline = require('multiline'),
    template  = require('lodash.template'),
    chalk     = require('chalk'),
    Table     = require('cli-table'),
    prompt    = require('./prompt.js'),
    client    = require('../index.js');

// grab metadata from package.json
var pkgData     = require('../package.json'),
    programName = Object.keys(pkgData.bin)[0],
    programVer  = pkgData.version;


var program = new (commander.Command)(programName);
program
    .version(programVer)
    .option('-u, --username <username>')
    .option('-t, --total [working hrs per day]')
    .option('-a, --add-record <record data>')
    .option('--table [days to show]')
    .option('-s, --sort <method>', 'sorting method: "asc" or "desc"');


var helpMsg = template(multiline(function(){/*
  This command line utility grabs records from ${location} 
  for the specified user account and returns them as json
  
  Get records as json:
  $ ${binary} [-u <username>] [-s <sorting_method>]

  Output latest daily records in table format:
  $ ${binary} --table [records_count] [-u <useraname>] [-s <sorting_method>]

  Get total time stats:
  $ ${binary} [-u <username>] -t <working_hrs_per_day>

  Add new record:
  $ ${binary} [-u <username>] --add-record <record_message>
*/}));

program.on('--help', function(){
    console.log(helpMsg({
        location: client.baseUrl,
        binary:   programName
    }));
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
    // check for blank submissions
    if (typeof(program.addRecord) !== 'string') {
        console.error(chalk.red('Record message is required!'));
        return;
    }

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
        postProcess = require('../util/totalTimeStats.js')(workHrsPerDay);
    } else if (program.table) {
        var count = parseInt(program.table, 10);
        postProcess = require('../util/tableOutput.js')(count);
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