'use strict';

var _ = require('lodash');
var utils = require('./utils.js');
var debug = require('debug')('records-parser');

var parseAbsences = require('./parseAbsences.js');

var readString = utils.readString;
var readEntryType = utils.readEntryType;

var dailyNorm = 480; // 8 hrs

function parseDate(data, $row) {
  var dateEl = $row.find('.date-holder').last()[0];
  var dateStr = readString(dateEl.children[0]);

  data.date = utils.getIsoDate(dateStr, 'DD/MM/YYYY');
  data.weekday = utils.getIsoWeekday(dateStr, 'DD/MM/YYYY');

  if (dateEl.children[1])
    data.comment = readString(dateEl.children[1].children[0]);

  debug('  daily row: date="%s", comment="%s"',
    data.date, data.comment || '<none>');

  return data;
}

function parseDurations(data, $row) {
  var $duration = $row.find('.text-right');

  data.working = readString($duration.eq(0));
  data.break = readString($duration.eq(1));
  data.total = readString($duration.eq(2));
  data.overtime = $duration.eq(3).find('input').val();

  debug('  daily row timespans: working="%s", break="%s", total="%s", overtime="%s"',
    data.working, data.break, data.total, data.overtime);

  return data;
}

function parseEntry(data, $entry) {
  data.time = readString($entry.find('.time-holder a'));
  data.location = readString($entry.find('.reader-holder'));
  data.type = readEntryType($entry.find('.status-holder .fa.fa-circle'));

  debug('    entry: time="%s", location="%s", type="%s"',
    data.time, data.location, data.type);

  return data;
}

function addEntry(entry, index, monthlyRecords) {
  var dailyRecord = monthlyRecords[index];

  if (dailyRecord) {
    dailyRecord.entries.push(entry);
    return true;
  }

  debug('  error: adding entry to dailyRecord failed!');
  return false;
}

function processEntry(entry, index, monthlyRecords, normalizeRecords) {
  addEntry(entry, index, monthlyRecords);

  if (normalizeRecords && entry.order === 0 && entry.type === 'out') {
    entry.normalized = true;
    debug('  adding entry to previous dailyRecord due to "normalizeRecords" flag...');
    addEntry(entry, index - 1, monthlyRecords);
  }
}

function attachAbsences($, monthlyRecordsMap, options) {
  var data = parseAbsences($, options);

  if (!data || !data.absences)
    return;

  data.absences.forEach(function(entry) {
    monthlyRecordsMap[entry.date].absence = {
      type: entry.type,
      counted: entry.counted
    };
  });
}

function parseRecords(input, options) {
  var sortOrder = options.sortOrder;
  var normalizeRecords = options.normalizeRecords;
  var includeAbsenceInfo = options.includeAbsenceInfo;

  var $ = utils.getDOM(input);
  $.prototype.isEmpty = utils.isEmpty;

  var month = readString($('.pagination-link-current-page').last());
  var monthlyRecords = [];
  var monthlyRecordsMap = {};

  var $dailyRows = $('.custom-table-data-one-row');
  _.times($dailyRows.length, function(i) {
    monthlyRecords.push({
      order: i,
      entries: []
    });
  });

  var expectedMinutes = 0;
  var completedMinutes = 0;

  $dailyRows.each(function(i, dailyRow) {
    var $dailyRow = $(dailyRow);
    var $dailyRecordsHolder = $dailyRow.find('.daily-records-holder');

    var isNonWorkingDay = $dailyRow.hasClass('non-working-day');

    // locus trap
    // eval(require('locus'));

    // var cls = dailyRow.attribs.class.trim().replace(/\n+/g, ' ').replace(/\s+/g, ' ');
    // debug('parsing daily row: #%d classList: "%s"', i + 1, cls);

    var dailyRecord = monthlyRecords[i];
    dailyRecord.nonWorkingDay= isNonWorkingDay;

    parseDate(dailyRecord, $dailyRow);
    parseDurations(dailyRecord, $dailyRow);

    if (dailyRecord.weekday !== 6 && dailyRecord.weekday !== 7)
      expectedMinutes += options.dailyNorm || dailyNorm;

    completedMinutes += utils.getMinutes(dailyRecord.total);

    monthlyRecordsMap[dailyRecord.date] = dailyRecord;

    var entries = $dailyRecordsHolder.find('.row');
    entries.each(function(i, recordEntry) {
      var $recordEntry = $(recordEntry);

      // locus trap
      // eval(require('locus'));
      debug('  parsing entry: #%d %s', i + 1, dailyRecord.date);

      var entry = parseEntry({}, $recordEntry);
      entry.order = i;

      processEntry(entry, dailyRecord.order, monthlyRecords, normalizeRecords);
    });
  });

  if (sortOrder === 'desc')
    monthlyRecords.reverse();

  if (includeAbsenceInfo)
    attachAbsences($, monthlyRecordsMap, options);

  var stats = {
    expected: utils.getDuration(expectedMinutes),
    completed: utils.getDuration(completedMinutes),
    difference: utils.getDuration(completedMinutes - expectedMinutes)
  };

  return {
    month: month,
    records: monthlyRecords,
    stats: stats
  };
}

module.exports = parseRecords;
