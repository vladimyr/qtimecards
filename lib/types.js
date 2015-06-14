'use strict';

module.exports.EntryType = {
    In: 'in',
    Out: 'out',

    fromColor: function(color){
        switch (color) {
            case 'red':   return this.Out;
            case 'green': return this.In;
        }
    }
};

module.exports.SortOrder = {
    Ascending: 'asc',
    Descending: 'desc',

    fromStr: function(str){
        if (!str)
            return this.Ascending;

        str = str.toLowerCase();
        if (str !== this.Ascending && str !== this.Descending)
            return this.Ascending;

        return str;
    }
};
