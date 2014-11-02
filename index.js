'use strict';

var Path    = require('path'),
    Promise = require('bluebird'),
    request = require('request'),
    cheerio = require('cheerio'),
    debug   = require('debug')('http');

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
    
    var records      = [], 
        shiftedEntry = [];

    // changed from: .one-day-records-holder
    $('.custom-table-data-one-row').each(function(i, el){
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

function _submitRecord(recordData) {
    // TODO: remove this in production
    var baseUrl = 'https://tonlyyi6fp3k.runscope.net';
    var options = { form: { 'editReason': recordData } };

    return request.postAsync(baseUrl + '/record/saveRecordManual', options)
        .spread(function complete(response, body){
            debug('server responded with: %d', response.statusCode);
            debug('response body: %s', body);
             
            if (response.statusCode != 200)
                return false;

            return true;
        });
}


function Client(username, password) {
    this._username = username;
    this._password = password;
}

Client.prototype.login = function() {
    var self = this;

    return request.headAsync(baseUrl + '/login/auth')
        .spread(function(response, body) {
            return request.postAsync(baseUrl + '/j_spring_security_check', {
                form: {
                    'j_username': self._username,
                    'j_password': self._password
                }
            });
        });   
};

function _checkLoginSuccess(response) {
    var urlPath = response.req.path;

    debug('server responded with: %d', response.statusCode);
    debug('response url: %s', urlPath);
    // debug('reponse body: %s', body);
    
    if ( !urlPath.match(/^\/record\/usersRecords\/\d+$/))
        throw new Error('Login failed, wrong username and/or password!');
}

Client.prototype.getRecords = function(sortOrder, forceInEvent){
    return function handler(response, body) {
        _checkLoginSuccess(response);
        return _extractData(body, sortOrder, forceInEvent);
    };
};

Client.prototype.submitNewRecord = function(recordData){
    return function hadler(response, body){
        _checkLoginSuccess(response);
        return _submitRecord(recordData);
    };
};

Client.prototype.logout = function() {
    return request.get(baseUrl + '/j_spring_security_logout');    
};


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
function getRecords(username, password, sortOrder, forceInEvent) {
    var client = new Client(username, password);
    return client.login()
        .spread(client.getRecords(sortOrder, forceInEvent))
        .tap(client.logout);
}

/**
 * submits new record to qtimecards.com
 * @param  {String} username   acc username
 * @param  {String} password   acc password
 * @param  {String} recordData record contents
 */
function submitNewRecord(username, password, recordData) {
    var client = new Client(username, password);
    return client.login()
        .spread(client.submitNewRecord(recordData))
        .tap(client.logout);
}

module.exports = {
    getRecords:      getRecords,
    submitNewRecord: submitNewRecord
};
