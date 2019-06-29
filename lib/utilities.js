/*
 * Guerilla
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the MIT License.
 *
 * Utility and helper functions used across the application.
 */

import * as util from 'util';

export default class Utilities {

    static formatMilliseconds(ms) {
        var secNum = parseInt(ms / 1000, 10);
        var hours = Math.floor(secNum / 3600);
        var minutes = Math.floor((secNum - (hours * 3600)) / 60);
        var seconds = secNum - (hours * 3600) - (minutes * 60);
        if (minutes < 10) {
            minutes = '0' + minutes;
        }
        if (seconds < 10) {
            seconds = '0' + seconds;
        }
        return hours + ':' + minutes + ':' + seconds;
    }

    static isDictionary(obj) {
        return !(!obj || Array.isArray(obj) || obj.constructor != Object);
    }

    static exists(v) {
        return !(v === undefined || v === null);
    }

    static stringify(obj) {
        if (typeof obj === 'object') {
            return util.inspect(obj, {showHidden: true, depth: null});
        } else {
            return obj;
        }
    }
}