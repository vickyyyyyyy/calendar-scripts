const { ScriptApp, GroupsApp, PropertiesService, Calendar } = require("./__fixtures__/google")

// Copy everything from this point on

const OOO = {}

// Set the ID of the team calendar to add events to. You can find the calendar's
// ID on the settings page.
var TEAM_CALENDAR_ID = '';
// Set the email address of the Google Group that contains everyone in the team.
// Ensure the group has less than 500 members to avoid timeouts.
var GROUP_EMAIL = '';

var KEYWORDS = ['vacation', 'ooh', 'ooo', 'holiday', 'out of office', 'offline'];
var MONTHS_IN_ADVANCE = 3;

/**
 * Setup the script to run automatically every hour.
 */
function setup() {
  var triggers = ScriptApp.getProjectTriggers();
  if (triggers.length > 0) {
    throw new Error('Triggers are already setup.');
  }
  ScriptApp.newTrigger('sync').timeBased().everyHours(1).create();
  // Run the first sync immediately.
  sync();
}

function getNumberOfDays(start, end) {
    const firstDate = new Date(start);
    const secondDate = new Date(end);

    const oneDayInMs = 1000 * 60 * 60 * 24;
    const diffInTime = secondDate.getTime() - firstDate.getTime();
    const diffInDays = Math.round(diffInTime / oneDayInMs);

    return diffInDays;
}

function weekday(date) {
    const day = date.getDay()
    if (day > 0 && day < 6) {
        return day
    }

    return false
}

function eventsToDays(events) {
    const daysOff = []

    for (var event of events) {
        const start = new Date(Date.parse(event.start.dateTime))
        start.setHours(0,0,0,0)
        const end = new Date(Date.parse(event.end.dateTime))
        end.setHours(0,0,0,0)
        
        const numDaysOff = getNumberOfDays(start, end)

        // if this is a single OOO no need to loop
        if (numDaysOff === 1) {
            if (weekday(start)) {
                daysOff.push(start)
            }
        } else {
            
            for (start; start < end; start.setDate(start.getDate() + 1)) {
                if (weekday(start)) {
                    daysOff.push(new Date(start))
                }
            }
        }
    }

    return daysOff
    
}

function getWeeks(start = new Date(), end = new Date(new Date().getFullYear(), 11, 31)) { 
    const weeks = []
    var week = []

    // make this inclusive
    end.setDate(end.getDate() + 1)

    // loop through days
    for (var d = start; d < end; d.setDate(d.getDate() + 1)) {
        const day = weekday(d)
        if (day) {
            var date = d
            date.setHours(0,0,0,0)

            week.push(new Date(date))

            // chunk week days for Mon to Fri
            if (day === 5) {
                weeks.push(week)
                week = []
            }
        }
    }

    if (week.length > 0) {
        weeks.push(week)
    }

    return weeks
}

// Google code
/**
 * Imports the given event from the user's calendar into the shared team
 * calendar.
 * @param {string} username The team member that is attending the event.
 * @param {Calendar.Event} event The event to import.
 */
 function importEvent(username, event) {
    event.summary = '[' + username + '] ' + event.summary;
    event.organizer = {
    id: TEAM_CALENDAR_ID,
    };
    event.attendees = [];
    console.log('Importing: %s', event.summary);
    try {
        Calendar.Events.import(event, TEAM_CALENDAR_ID);
    } catch (e) {
        console.error('Error attempting to import event: %s. Skipping.',
            e.toString());
    }
}

/**
 * In a given user's calendar, look for occurrences of the given keyword
 * in events within the specified date range and return any such events
 * found.
 * @param {Session.User} user The user to retrieve events for.
 * @param {string} keyword The keyword to look for.
 * @param {Date} start The starting date of the range to examine.
 * @param {Date} end The ending date of the range to examine.
 * @param {Date} optSince A date indicating the last time this script was run.
 * @return {Calendar.Event[]} An array of calendar events.
 */
function findEvents(user, keyword, start, end) {
    var params = {
        q: keyword,
        timeMin: formatDateAsRFC3339(start),
        timeMax: formatDateAsRFC3339(end),
        showDeleted: true,
    };

    var pageToken = null;
    var events = [];
    do {
        params.pageToken = pageToken;
        var response;
    try {
        response = Calendar.Events.list(user.getEmail(), params);
    } catch (e) {
        console.error('Error retrieving events for %s, %s: %s; skipping',
            user, keyword, e.toString());
        continue;
    }
    events = events.concat(response.items.filter(function(item) {
        return shoudImportEvent(user, keyword, item);
    }));
        pageToken = response.nextPageToken;
    } while (pageToken);
    return events;
}

/**
 * Determines if the given event should be imported into the shared team
 * calendar.
 * @param {Session.User} user The user that is attending the event.
 * @param {string} keyword The keyword being searched for.
 * @param {Calendar.Event} event The event being considered.
 * @return {boolean} True if the event should be imported.
 */
function shoudImportEvent(user, keyword, event) {
    // Filter out events where the keyword did not appear in the summary
    // (that is, the keyword appeared in a different field, and are thus
    // is not likely to be relevant).
    if (event.summary.toLowerCase().indexOf(keyword) < 0) {
        return false;
    }
    if (!event.organizer || event.organizer.email == user.getEmail()) {
    // If the user is the creator of the event, always import it.
        return true;
    }
    // Only import events the user has accepted.
    if (!event.attendees) return false;
        var matching = event.attendees.filter(function(attendee) {
        return attendee.self;
    });
        return matching.length > 0 && matching[0].responseStatus == 'accepted';
}

/**
 * Return an RFC3339 formated date String corresponding to the given
 * Date object.
 * @param {Date} date a Date.
 * @return {string} a formatted date string.
 */
function formatDateAsRFC3339(date) {
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString();
}


module.exports = {
    getUsers,
    getWeeks,
    eventsToDays,
    getOOO
}