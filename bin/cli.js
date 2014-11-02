#!/usr/bin/env node

'use strict'

var commander  = require('commander'),
    multiline  = require('multiline'),
    chalk      = require('chalk'),
    Path       = require('path'),
    prompt     = require(Path.resolve(__dirname, './prompt.js')),
    getRecords = require(Path.resolve(__dirname, '../index.js'));

// grab metadata from package.json
var pkgData     = require(Path.resolve(__dirname, '../package.json')),
    programName = Object.keys(pkgData.bin)[0],
    programVer  = pkgData.version;


var program = new (commander.Command)(programName);
program
    .version(programVer)
    .option('-u, --username [username]')
    .option('-t, --total [working hrs per day]')
    .option('-s, --sort [method]', 'sorting method: "asc" or "desc"');


var helpMsg = multiline(function(){/*
  This command line utility grabs records from
  qtimecards.com for the specified account and 
  returns them in json format
  
  Example:

  $ qgrab [-u <username>] [-s <sorting_method>]

  Get total time:
  
  $ qgrab [-u <username>] -t <working_hrs_per_day>
*/});

program.on('--help', function(){
    console.log(helpMsg);
});

program.parse(process.argv);


var postProcess = function(records){
    console.log(JSON.stringify(records, null, 2));
};

if (program.total) {
    var workHrsPerDay = parseInt(program.total, 10);
    postProcess = require(Path.resolve(__dirname, '../util/totalTimeStats.js'))(workHrsPerDay);
}


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

var inputs = [ passwordInput ];

if (!program.username)
    inputs.unshift(usernameInput);

prompt(inputs)
    .then(function complete(answers){
        var username     = defaultEmailDomain(program.username || answers.username),
            password     = answers.password,
            sortMethod   = program.sort || 'asc',
            forceInEvent = true;

        console.log();
        return getRecords(username, password, sortMethod, forceInEvent);
    })
    .done(postProcess, handleError);

function handleError(err){
    console.error(chalk.red(err.message));
}