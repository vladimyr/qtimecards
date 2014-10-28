'use strict';

var Path    = require('path'),
    Promise = require('bluebird'),
    request = require('request'),
    cheerio = require('cheerio');

var cookieJar = request.jar(),
    request   = request.defaults({
      jar:                cookieJar,
      followRedirect:     true,
      followAllRedirects: true
    });

var baseUrl = 'http://qtimecards.com';

request = Promise.promisifyAll(request);


function _imgName(path) {
  var extname  = Path.extname(path),
    basename = Path.basename(path);

  return basename.substring(0, basename.indexOf(extname));
}


function _extractData(html, sortOrder, forceInEvent) {
  sortOrder = sortOrder || 'desc';
  var $ = cheerio.load(html);

  var records = [], shiftedEntry = [];

  $('.one-day-records-holder').each(function(i, el){
    var $el   = $(el),
      date  = $el.find('.date-holder').last().text().trim(),
      total = $el.find('.day-total-holder').text().trim();

    var dateRecords = {
      date:    date,
      total:   total,
      entries: []
    };

    // place shifted entry
    if (shiftedEntry[0]) {
      dateRecords.entries.push(shiftedEntry[0]);
      shiftedEntry = [];
    }

    var entries = $(el).find('.row'),
        last    = entries.length - 1;

    entries.each(function(i, el){

      var $entry   = $(el).find('.time-holder, .reader-holder, .status-holder img'),
          time     = $entry.eq(0).text().trim(),
          location = $entry.eq(1).text().trim(),
          type     = _imgName($entry.eq(2).attr('src').trim());

      var entry = {
        time:     time,
        type:     type,
        location: location
      };

      // if last entry is "out" and forceInEvent is set to true
      // shift event for the next day
      if (forceInEvent && i == last && type === 'out') {
        shiftedEntry.push(entry);
      }
      // add entry to curent day's records
      else {
        dateRecords.entries.push(entry);
      }
    });

    if (sortOrder.toLowerCase() === 'asc')
      dateRecords.entries.reverse();

    records.push(dateRecords);
  });

  if (sortOrder.toLowerCase() === 'asc')
    records.reverse();

  return records;
}


function _currentMonthStats(html) {
  var $    = cheerio.load(html),
      done = 0, doneh, donem;

  var todo  = $('.one-day-records-holder').length * 450,
      todoh = parseInt(todo/60),
      todom = todo%60;

  $('.one-day-records-holder').each(function(i, el){
    var time = $(el).find('.day-total-holder').text().trim().split(':');

    done += parseInt(time[0]) * 60 + parseInt(time[1]);
  });

  doneh = parseInt(done/60);
  donem = done%60;

  return 'Total ' + doneh + ':'+ donem +'/' + todoh + ':' + todom;
}


var qtime = {

  auth: function(username, password) {

    return request.headAsync(baseUrl + '/login/auth')
      .spread(function(response, body) {
        return request.postAsync(baseUrl + '/j_spring_security_check', {
          form: {
            'j_username': username,
            'j_password': password
          }
        });
      });
  },

 /**
  * grabs user records from qtimecards.com
  * @param  {String}  username      acc username
  * @param  {String}  password      acc password
  * @param  {String}  sortOrder     'asc' or 'desc'
  * @param  {Boolean} forceInEvent  forces day record
  *                                 to start with IN
  *                                 event
  * @return {Array}                 array of user records
  */
  getRecords: function(username, password, sortOrder, forceInEvent) {

    return qtime.auth(username, password)
      .spread(function(response, body) {
        return _extractData(body, sortOrder, forceInEvent);
      });
  },

  getTotal: function(username, password) {

    return qtime.auth(username, password)
      .spread(function(response, body) {
        return _currentMonthStats(body);
      });
  }
};

module.exports = qtime;
