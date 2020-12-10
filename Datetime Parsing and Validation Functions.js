
    //=======================================
    // Date Validation and Parsing Functions
    //=======================================
    // license     MIT; http://opensource.org/licenses/MIT

   //=======================================
    // All time validation functions and the parsing function accept
    // YYYY-MM-DD 24:00 to mean next day at 00:00
    // According to wikipedia this is part of the 24 hours time comvention
    //=======================================

    //=======================================
    // This group of functions nails the format to YYYY-MM-DD something
    //=======================================
    // Error messages
    const errorWrongDateTimeFormat = 'Use YYYY-MM-DD HH:MM [24h, 12h]';
    const errorWrongDateTimeRelativeFormat = 'Use YYYY-MM-DD HH:MM [24h, 12h]<br>Or +10d3h45m or -4h12h30m<br>+- needed, rest may be omitted';
    const errorWrongDateTimeFullFormat = 'Use YYYY-MM-DD HH:MM:SS.mmm<br>Seconds and milliseconds optional';
    const errorWrongDateTimeFullRelativeFormat = 'Use YYYY-MM-DD HH:MM:SS.mmm<br>Seconds and milliseconds optional<br>Or +10d3h45m12s -4h12h30m10s<br>+- needed, rest may be omitted';
    const errorWrongDateFormat = 'Invalid date - Use YYYY-MM-DD';
    const errorWrongDateRelativeFormat = 'Invalid date - Use YYYY-MM-DD<br>Or +10d or -2d';
    const errorOutOfRange = 'Number out of range';

    //=======================================
    // Validates datetime in YYYY-MM-DD HH:MM format
    // Accepts both 24h and 12h formats (am pm)
    // Accepts YYYY-MM-DD (HH:MM omitted)
    // Bissextile years are properly processed
    // Suitable for use as validate callback in a text component of a setting
    function validateDateTime(dateString, config){
        dateString = dateString.trim();
        if (dateString.length > 18){
           return errorWrongDateTimeFormat;
        } else {
            let result = validateDate(dateString.slice(0,10), config);
            if (result === errorOutOfRange) return errorOutOfRange;
            if (result !== true) return errorWrongDateTimeFormat;
            if (dateString.length === 10) return true; //Valid YYY-MM-DD and nothing else
            result = validateTime(dateString.slice(0,16));
            if (result === errorOutOfRange) return errorOutOfRange;
            if (result !== true) return errorWrongDateTimeFormat;
            if (dateString.length === 16){
                return true
            } else {
                if (dateString.length === 18){
                    let suffix = dateString.slice(16)
                    if (suffix === 'am' || suffix === 'pm'){
                        let hh = Number(dateString.slice(11, 13))
                        if (hh < 1 || hh > 12){return errorOutOfRange}
                        return true
                    } else {
                        return errorWrongDateTimeFormat;
                    }
                }
                return errorWrongDateTimeFormat;
            };
        };
        return errorWrongDateTimeFormat;
    };

    //=======================================
    // Validates datetime in YYYY-MM-DD HH:MM format or relative time format
    // Accepts both 24h and 12h formats (am pm)
    // Accepts YYYY-MM-DD (HH:MM omitted)
    // Bissextile years are properly processed
    // Suitable for use as validate callback in a text component of a setting
    function validateDateTimeRelative(dateString, config){
        dateString = dateString.trim();
        if (dateString.match(/^([+-])(?:(\d+)[dD])?(?:(\d+)[hH])?(?:(\d+)[mM])?$/) !== null){
            if (dateString === '+' || dateString === '-') return errorWrongDateTimeRelativeFormat
            return true;
        } else {
            let result = validateDateTime(dateString, config)
            if (result === true || result === errorOutOfRange) return result;
            return errorWrongDateTimeRelativeFormat;
        }
    };

    //=======================================
    // Validate datetime in YYYY-MM-DD HH:MM:SS.mmm format
    // Seconds and milliseconds are optional
    // Bissextile years are properly processed
    // Suitable for use as validate callback in a text component of a setting
    function validateDateTimeFull(dateString, config){
        dateString = dateString.trim();
        let result = validateDateTime(dateString.slice(0, 16), config);
        if (result === errorOutOfRange){
            return errorOutOfRange;
        } else if (result !== true){
            return errorWrongDateTimeFullFormat;
        } else if (dateString.length <= 16){
            return true // seconds and milliseconds omitted
        } else {
            var regEx = /^:(\d{2}|\d{2}\.\d{3})$/;
            if(!dateString.slice(16).match(regEx)) return errorWrongDateTimeFullFormat; // Invalid format
            let d = new Date(dateString);
            let dNum = d.getTime();
            if(!dNum && dNum !== 0) return errorOutOfRange; // NaN value, Invalid date
            return true
        }
    }

    //=======================================
    // Validate datetime in YYYY-MM-DD HH:MM:SS.mmm format or relative format
    // Seconds and milliseconds are optional
    // Bissextile years are properly processed
    // Suitable for use as validate callback in a text component of a setting
    function validateDateTimeFullRelative(dateString, config){
        dateString = dateString.trim();
        if (dateString.match(/^([+-])(?:(\d+)[dD])?(?:(\d+)[hH])?(?:(\d+)[mM])?(?:(\d+)[sS])?$/) !== null){
            if (dateString === '+' || dateString === '-') return errorWrongDateTimeFullRelativeFormat
            return true;
        } else {
            let result = validateDateTimeFull(dateString, config)
            if (result === true || result === errorOutOfRange) return result;
            return errorWrongDateTimeFullRelativeFormat;
        }
    };

    //=======================================
    // Validates dates in YYYY-MM-DD format
    // Bissextile years are properly processed
    // Suitable for use as validate callback in a text component of a setting
    function validateDate(dateString, config, keyword) {
        dateString = dateString.trim();
        let regEx = /^\d{4}-\d{2}-\d{2}$/;
        if(!dateString.match(regEx)) return errorWrongDateFormat; // Invalid format
        let d = new Date(dateString);
        let dNum = d.getTime();
        if(!dNum && dNum !== 0) return errorOutOfRange; // NaN value, Invalid date
        let r = d.toISOString().slice(0,10) === dateString;
        if (r) {
            return true
        } else {
            return errorOutOfRange
        };
    }

    //=======================================
    // Validates dates in YYYY-MM-DD format or relative format
    // Bissextile years are properly processed
    // Suitable for use as validate callback in a text component of a setting
    function validateDateRelative(dateString, config){
        dateString = dateString.trim();
        if (dateString.match(/^([+-])(?:(\d+)[dD])?$/) !== null){
            if (dateString === '+' || dateString === '-') return errorWrongDateRelativeFormat
            return true;
        } else {
            let result = validateDate(dateString, config)
            if (result === true || result === errorOutOfRange) return result;
            return errorWrongDateRelativeFormat;
        }
    };

    //=======================================
    // Helper function to validate time in HH:MM format
    // It should not be publicly exposed
    function validateTime(timeString) {
      let regEx = /^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}$/;
      if(!timeString.match(regEx)) return 'No match'; // Invalid format
      let d = new Date(timeString);
      let dNum = d.getTime();
      if(!dNum && dNum !== 0) return errorOutOfRange; // NaN value, Invalid date
      return true
    }

    //=======================================
    // Parses a validated date in YYYY-MM-DD format
    // Also parse a validated datetime in YYYY-MM-DD HH:MM format
    // Parses datetime in both 12h and 24h formats
    // Parses optional seconds and milliseconds
    // Returns the corresponding date object for this date/datetime in the local time zone
    // May return an invalid date if presented with empty or invalid data - but not always
    // If there is doubt about the quality of the data, validate first
    // Suitable to parse a validated date from a text component in a setting
    function parseDateTime(dateString) {
        dateString = dateString.trim(); // validation allows leading and trailing blanks
        try {
            if (dateString === '') return new Date('###'); // returns an invalid date
            let match = dateString.match(/^([+-])(?:(\d+)[dD])?(?:(\d+)[hH])?(?:(\d+)[mM])?(?:(\d+)[sS])?$/);
            if (match !== null){
                if (dateString === '+' || dateString === '-') return new Date('###'); // returns an invalid date
                let date = Date.now();
                let sign = (match[1] === '+' ? 1 : -1);
                let days = (match[2] || 0) * 86400000;
                let hrs = (match[3] || 0) * 3600000;
                let min = (match[4] || 0) * 60000;
                let sec = (match[5] || 0) * 1000;
                return new Date(date + sign * (days + hrs + min + sec));
            }
            // new Date() uses local time zone when the parameters are separated
            let YY = Number(dateString.substring(0, 4));
            let MM = Number(dateString.substring(5, 7))-1;
            let DD = Number(dateString.substring(8, 10));
            let hh = (dateString.length >= 13) ? Number(dateString.substring(11, 13)) : 0;
            let mm = (dateString.length >= 16) ? Number(dateString.substring(14, 16)) : 0;
            let ss = (dateString.length >= 19) ? Number(dateString.substring(17, 19)) : 0;
            let ml = (dateString.length === 23) ? Number(dateString.substring(20, 23)) : 0;

            let suffix = (dateString.length === 18) ? dateString.substring(16, 18) : ''
            if (suffix === 'am' || suffix === 'pm'){ // if 12 hours format, convert to 24 hours
                if (hh === 12) hh = 0;
                if (suffix === 'pm') hh += 12;
            }
            return new Date(YY, MM, DD, hh, mm, ss, ml);
        } catch (e) {
            return new Date('###'); // returns an invalid date in case of error
        }
    }

    //===================================
    // This group of function accepts dates formatted according to locale convention
    // at the cost of browser inconsistencies
    //===================================
    // Error messages
    const errorInvalidDate = 'Invalid date';
    const errorInvalidDateRelativeFull = 'Invalid date<br>You may use +10d3h45m or -4h12h30m<br>+- needed, rest may be omitted';
    const errorInvalidDateRelativeHoursMinutes = 'Invalid date<br>You may use +10d3h45m15s or -4h12h30m12s<br>+- needed, rest may be omitted';
    const errorInvalidDateRelative = 'Invalid date<br>You may use  +10d or -4d';
    const errorNotANumber = 'A date is not a number';
    const errorJustDateHoursMinutes = 'Just the date, hours and minutes';
    const errorJustDate = 'Just the date';

    //===================================
    // Validates a datetime in any format accepted by Date.parse
    // accepts seconds and milliseconds
    // rejects plain numbers wich are otherwise accepted by Date.parse
    //===================================
    function validateLocaleDateTimeFull (dateString, config){
        dateString = dateString.trim();
        if (dateString.match(/^\d+([.,]\d*)?$/) !== null) return errorNotANumber;
        let date = Date.parse(dateString);
        return (isNaN(date) ? errorInvalidDate : true)
    }

    //===================================
    // Validates a datetime in any format accepted by Date.parse and relative time
    // accepts seconds and milliseconds
    // rejects plain numbers wich are otherwise accepted by Date.parse
    //===================================
    function validateLocaleDateTimeFullRelative(dateString, config){
        dateString = dateString.trim();
        if (dateString.match(/^([+-])(?:(\d+)[dD])?(?:(\d+)[hH])?(?:(\d+)[mM])?(?:(\d+)[sS])?$/) !== null){
            if (dateString === '+' || dateString === '-') return errorInvalidDateRelativeFull;
            return true;
        } else {
            let result = validateLocaleDateTimeFull(dateString, config)
            if (result === true || result === errorNotANumber) return result;
            return errorInvalidDateRelativeFull;
        }
    };

    //===================================
    // Validates a datetime in any format accepted by Date.parse
    // rejects seconds and milliseconds
    // rejects plain numbers wich are otherwise accepted by Date.parse
    //===================================
    function validateLocaleDateTime (dateString, config){
        dateString = dateString.trim();
        if (dateString.match(/^\d+([.,]\d*)?$/) !== null) return errorNotANumber;
        let date = Date.parse(dateString);
        if (isNaN(date)) return errorInvalidDate;
        if (date.getSeconds() !== 0) return errorJustDateHoursMinutes;
        if (date.getMilliseconds() !== 0) return errorJustDateHoursMinutes;
        return true;
    }

    //===================================
    // Validates a datetime in any format accepted by Date.parse and relative format
    // rejects seconds and milliseconds
    // rejects plain numbers wich are otherwise accepted by Date.parse
    //===================================
    function validateLocaleDateTimeRelative(dateString, config){
        dateString = dateString.trim();
        if (dateString.match(/^([+-])(?:(\d+)[dD])?(?:(\d+)[hH])?(?:(\d+)[mM])?$/) !== null){
            if (dateString === '+' || dateString === '-') return errorInvalidDateRelativeHoursMinutes;
            return true;
        } else {
            let result = validateLocaleDateTimeFull(dateString, config)
            if (result === true || result === errorNotANumber || result === errorJustDateHoursMinutes) return result;
            return errorInvalidDateRelativeHoursMinutes;
        }
    };

    //===================================
    // Validates a date in any format accepted by Date.parse
    // requires just the date
    // rejects plain numbers wich are otherwise accepted by Date.parse
    //===================================
    function validateLocaleDate (dateString, config){
        dateString = dateString.trim();
        if (dateString.match(/^\d+([.,]\d*)?$/) !== null) return errorNotANumber;
        let date = Date.parse(dateString);
        if (isNaN(date)) return errorInvalidDate;
        if (date.getHours() !== 0) return errorJustDate;
        if (date.getMinutes() !== 0) return errorJustDate;
        if (date.getSeconds() !== 0) return errorJustDate;
        if (date.getMilliseconds() !== 0) return errorJustDate;
        return true;
    }

    //===================================
    // Validates a datetime in any format accepted by Date.parse and relative format
    // requires just the date
    // rejects plain numbers wich are otherwise accepted by Date.parse
    //===================================
    function validateLocaleDateRelative(dateString, config){
        dateString = dateString.trim();
        if (dateString.match(/^([+-])(?:(\d+)[dD])/) !== null){
            if (dateString === '+' || dateString === '-') return errorInvalidDateRelative;
            return true;
        } else {
            let result = validateLocaleDateTimeFull(dateString, config)
            if (result === true || result === errorNotANumber || result === errorJustDateHoursMinutes) return result;
            return errorInvalidDateRelative;
        }
    };

    //=======================================
    // Parses a validated date in any format accepted by Date.parse and relative format
    // Accepts optional seconds and milliseconds
    // Returns the corresponding date object for this date/datetime in the local time zone
    // May return an invalid date if presented with empty or invalid data - but not always
    // If there is doubt about the quality of the data, validate first
    // Suitable to parse a validated date from a text component in a setting
    function parseLocaleDateTime(dateString) {
        dateString = dateString.trim(); // validation allows leading and trailing blanks
        if (dateString.length === 0) return new Date('###'); // returns an invalid date
        let match = dateString.match(/^([+-])(?:(\d+)[dD])?(?:(\d+)[hH])?(?:(\d+)[mM])?(?:(\d+)[sS])?$/);
        if (match !== null){
            if (dateString === '+' || dateString === '-') return new Date('###'); // returns an invalid date
            let date = Date.now();
            let sign = (match[1] === '+' ? 1 : -1);
            let days = (match[2] || 0) * 86400000;
            let hrs = (match[3] || 0) * 3600000;
            let min = (match[4] || 0) * 60000;
            let sec = (match[5] || 0) * 1000;
            return new Date(date + sign * (days + hrs + min + sec));
        } else {
            return new Date(dateString)
        };
    }
