'use strict';

var Promise  = require('bluebird'),
    inquirer = require('inquirer');

module.exports = function prompt(args) {
    var deferred = Promise.pending(),
        inputs   = Array.isArray(args) 
                    ? args 
                    : Array.prototype.slice.call(arguments, 0);

    inquirer.prompt(inputs, function(answers){
        deferred.resolve(answers);
    });

    return deferred.promise;
};