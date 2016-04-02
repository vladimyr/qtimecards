'use strict';

var padStart = require('lodash/padStart');
var util = require('util');
var cheerio = require('cheerio');
var fecha = require('fecha');

var EntryType = {
  In: 'in',
  Out: 'out',

  fromColor: function(color){
    switch (color) {
      case 'red':   return EntryType.Out;
      case 'green': return EntryType.In;
    }
  }
};

function readEntryType($circle) {
  var color;

  if (!$circle || $circle.length === 0)
    throw new Error('Invalid HTMLElement provided!');

  var style = $circle.attr('style');
  var matches = style.match(/color:\s+(\w+)/);

  if (matches && matches[1])
    color = matches[1];

  return EntryType.fromColor(color);
}

function readString(el) {
  var val = '';

  if (!el)
    throw new Error('Invalid HTMLElement provided!');

  if (el.text)
    val = val || el.text();
  else
    val = val || el.data;

  return val.trim();
}

function readInteger(el) {
  var val;

  if (!el)
    throw new Error('Invalid HTMLElement provided!');

  if (el.val)
    val = el.val();
  else
    val = el.text();

  return parseInt(val, 10);
}

function querySelector($) {
  return function query(selector) {
    return $(selector);
  };
}

function isEmpty() {
  //jshint validthis:true
  return !!(this.html() || '').trim();
}

function getDOM(input) {
  if (typeof input !== 'string')
    return input;

  return cheerio.load(input);
}

function getIsoDate(str, format) {
  var date = fecha.parse(str, format);
  return fecha.format(date, 'YYYY-MM-DD');
}

function getIsoWeekday(str, format) {
  var date = fecha.parse(str, format);
  var weekday = parseInt(fecha.format(date, 'd'), 10);

  if (weekday > 0)
    return weekday;
  else // Sunday
    return 7;
}

function getMinutes(duration) {
  var tokens = duration.split(':');
  var hours = parseInt(tokens[0], 10);
  var minutes = parseInt(tokens[1], 10);
  return hours * 60 + minutes;
}

function getDuration(input) {
  var hours = (input / 60) | 0;
  var minutes = Math.abs(input % 60);
  return util.format('%s:%s', hours, padStart(minutes, 2, '0'));
}

function getRecordTime(input) {
  return fecha.format(input || new Date(), 'DD/MM/YYYY HH:mm');
}

module.exports = {
  EntryType: EntryType,
  readEntryType: readEntryType,
  readString: readString,
  readInteger: readInteger,
  querySelector: querySelector,
  isEmpty: isEmpty,
  getDOM: getDOM,
  getIsoDate: getIsoDate,
  getIsoWeekday: getIsoWeekday,
  getRecordTime: getRecordTime,
  getMinutes: getMinutes,
  getDuration: getDuration
};
