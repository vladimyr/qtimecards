'use strict';

var cheerio   = require('cheerio'),
    fecha     = require('fecha'),
    EntryType = require('./types.js').EntryType,
    SortOrder = require('./types.js').SortOrder;

function getEntryType($circle){
    var style   = $circle.attr('style'),
        matches = style.match(/color:\s+(\w+)/),
        color;

    if (matches && matches[1])
        color = matches[1];

    return EntryType.fromColor(color);
}

function getText(el){
    var text;

    if (!el)
        return text;

    if (el.text)
        text = el.text() || '';
    else
        text = el.data || '';

    return text.trim();
}

function getNumber(el){
    var val;

    if (el.val)
        val = el.val() || 0;
    else
        val = el.text() || 0;

    return Number(val);
}

function scrapeRecordsPage(html, sortOrder, forceInEvent) {
    sortOrder = SortOrder.fromStr(sortOrder);
    var $ = cheerio.load(html);

    var month = getText($('.pagination-link-current-page').last());
    var records = [];

    $('.custom-table-data-one-row').each(function(i, el){
        var $el     = $(el),
            dateEl  = $el.find('.date-holder').last()[0];

        var dateStr, date, comment;

        /**
         * part of markup that holds date and comment:
         *
         * <div class="col-md-3 hidden-sm hidden-xs date-holder">
         *   04/06/2015            <!-- date -->
         *   <span>Tijelovo</span> <!-- comment -->
         * </div>
         */
        dateStr = getText(dateEl.children[0]);
        if (dateStr)
            date = fecha.parse(dateStr, 'DD/MM/YYYY');

        if (dateEl.children[1])
            comment = getText(dateEl.children[1].children[0]);

        var $duration = $el.find('.text-right'),
            working   = getText($duration.eq(0)),
            _break    = getText($duration.eq(1)),
            total     = getText($duration.eq(2)),
            overtime  = $duration.eq(3).find('input').val();

        var dateRecords = {
            date:     date,
            comment:  comment,
            total:    total,
            working:  working,
            'break':  _break,
            overtime: overtime,
            entries:  []
        };

        var entries = $(el).find('.row');

        entries.each(function(i, el){
            var $entry   = $(el),
                time     = getText($entry.find('.time-holder a')),
                location = getText($entry.find('.reader-holder')),
                type     = getEntryType($entry.find('.status-holder .fa.fa-circle'));

            var entry = {
                time:     time,
                type:     type,
                location: location
            };

            /**
             * if first entry is "out" and forceInEvent
             * is set to true shift event back to prev day
             */
            if (forceInEvent && i === 0 && type === 'out') {
                var prevDateRecrods = records[records.length - 1];
                prevDateRecrods && prevDateRecrods.entries.push(entry); // jshint ignore:line
            } else {
                /* add entry to curent day's records */
                dateRecords.entries.push(entry);
            }
        });

        if (sortOrder === SortOrder.Descending)
            dateRecords.entries.reverse();

        records.push(dateRecords);
    });

    if (sortOrder === SortOrder.Descending)
        records.reverse();

    return {
        month: month,
        records: records
    };
}

function scrapeDaysOffPage(html){
    var $ = cheerio.load(html);

    var oldVacation        = getNumber($('.old-vacation-input')),
        newVacation        = getNumber($('.new-vacation-input')),
        additionalVacation = getNumber($('.additional-vacation-input'));

    var totalVacation  = getNumber($('.total-vacation-input')),
        usedVacation   = getNumber($('.used-vacation-input')),
        unusedVacation = getNumber($('.unused-vacation-input'));

    var vacationNotes = $('textarea[name^="vacation-notes"]').val();

    var vacation = {
        category: {
            old: oldVacation,
            'new': newVacation,
            additional: additionalVacation
        },
        usage: {
            used: usedVacation,
            unused: unusedVacation,
            total: totalVacation
        },
        notes: vacationNotes
    };

    return {
        vacation: vacation
    };
}

module.exports = {
    scrapeDaysOffPage: scrapeDaysOffPage,
    scrapeRecordsPage: scrapeRecordsPage
};