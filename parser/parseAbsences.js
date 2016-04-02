'use strict';

var acorn = require('acorn');
var findNodeAt = require('acorn/dist/walk').findNodeAt;
var camelCase = require('lodash/camelCase');
var utils = require('./utils.js');
var debug = require('debug')('absence-data-parser');


function isAbsenceData(nodeType, node) {
  return node.kind === 'var' &&
    node.declarations &&
    node.declarations.length > 0 &&
    node.declarations[0].id.name === 'dayOffTypes';
}

function processAbsenceString(str) {
  var entries = JSON.parse(str);

  var data = {};
  var absences = [];

  entries.forEach(function(entry) {
    var type = camelCase(entry.type);
    data[type] = entry;

    entry.dates = [];

    entry.dayOffDatesList.map(function(dayOffRecord) {
      dayOffRecord.specificDate = utils.getIsoDate(dayOffRecord.specificDate, 'DD-MM-YYYY');
      entry.dates.push(dayOffRecord.specificDate);

      absences.push({
        date: dayOffRecord.specificDate,
        type: entry.type,
        counted: entry.counted
      });
    });
  });

  // locus trap
  // eval(require('locus'));

  return absences;
}

function findAbsenceData(ast) {
  var found = findNodeAt(ast, null, null, isAbsenceData);
  if (!found || !found.node) {
    debug('error: absence data is not found!');
    return null;
  }

  return found.node.declarations[0].init.value;
}

function parseAbsences(input, options) {
  var $ = utils.getDOM(input);

  var $month = $('.pagination-link-current-page').last();
  var $absenceScript = $('.main-content > script').eq(0);

  var code = $absenceScript.text();

  var ast = acorn.parse(code);
  var str = findAbsenceData(ast);

  if (!str)
    return null;

  var absences = processAbsenceString(str);
  absences.sort(function(a, b) {
    if (options.sortOrder === 'asc')
      return a.date > b.date;

    return a.date < b.date;
  });

  return {
    month: utils.readString($month),
    absences: absences
  };
}

module.exports = parseAbsences;
