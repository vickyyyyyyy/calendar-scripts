const { ScriptApp, GroupsApp, PropertiesService, Calendar } = require("./__fixtures__/google")

/**
 * Copy everything between the lines
 * 
 * ===========================================================================================================================================
*/

/**
 * Set the ID of the team calendar to add events to. The calendar's ID can be found on the settings page.
 */
const TEAM_CALENDAR_ID = '<ENTER_TEAM_CALENDAR_ID_HERE>';

/**
 * Set the email address of the Google Group that contains everyone in the team.
 * Ensure the group has less than 500 members to avoid timeouts.
 */
const GROUP_EMAIL = '<ENTER_GROUP_EMAIL_HERE>';

/**
 * Set the keywords to filter for OOO events.
 */
const KEYWORDS = ['vacation', 'ooh', 'ooo', 'holiday', 'out of office', 'offline'];


/**
 * Set any members to exclude from the rotation by their username e.g. 'taylor.swift' from 'taylor.swift@grafana.com'.
 */
const EXCLUDE_MEMBERS = [];

/**
 * Set the number of members in the rotation every week.
 */
const NUMBER_IN_ROTATION_PER_WEEK = 2

/**
 * Set the maximum OOO days off a member can have to be disregarded from the weekly rotation.
 */
const MAX_DAYS_OFF_IN_A_WEEK = 1

/**
 * Set the number of months in advance to search for OOO.
 */
const MONTHS_IN_ADVANCE = 6

/**
 * Set the start date for the rotation.
 */
const START_DATE = new Date()

const OOO = {}

/**
 * Setup the script to run automatically on a regular cadence.
 */
function setup() {
  var triggers = ScriptApp.getProjectTriggers();
  if (triggers.length > 0) {
    throw new Error('Triggers are already setup.');
  }
  ScriptApp.newTrigger('sync').timeBased().onWeekDay(ScriptApp.WeekDay.FRIDAY).everyWeeks(3).create();
  // Run the first sync immediately.
  sync();
}

/**
 * Main function for creating a schedule based off OOO and import to Google Calendar.
 */
function sync() {
    const users = getUsers()
    const ooo = getOOO(users)

    let endDate = new Date(START_DATE.valueOf())
    endDate.setMonth(endDate.getMonth() + MONTHS_IN_ADVANCE)

    const weeks = getWeeks(START_DATE, endDate)
    scheduler(ooo, weeks)
}

/**
 * Get the number of days between two dates.
 */
function getNumberOfDays(start, end) {
    const firstDate = new Date(start);
    const secondDate = new Date(end);

    const oneDayInMs = 1000 * 60 * 60 * 24;
    const diffInTime = secondDate.getTime() - firstDate.getTime();
    const diffInDays = Math.round(diffInTime / oneDayInMs);

    return diffInDays;
}

/**
 * Checks if a date is a weekday.
 */
function weekday(date) {
    const day = date.getDay()
    if (day > 0 && day < 6) {
        return day
    }

    return false
}

/**
 * Returns users from the Google Group and ignores excluded members.
 */
function getUsers(excludedMembers) {
  excludedMembers = excludedMembers || EXCLUDE_MEMBERS
  return GroupsApp.getGroupByEmail(GROUP_EMAIL).getUsers().filter(user => !excludedMembers.includes(user.getUsername()));
}

/**
 * Gets OOO for users.
 */
function getOOO(users) {
    // Define the calendar event date range to search.
    var today = new Date();
    var maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + MONTHS_IN_ADVANCE);

    // Determine the time the the script was last run.
    var lastRun = PropertiesService.getScriptProperties().getProperty('lastRun');
    lastRun = lastRun ? new Date(lastRun) : null;

    users.forEach((user) => {
        const username = user.getUsername()
        OOO[username] = []

        KEYWORDS.forEach((keyword) => {
            var events = findEvents(user, keyword, today, maxDate, lastRun);

            // ignore cancelled events
            events = events.filter(event => event.status === "confirmed")

            if (eventsToDays(events).length > 0) {
                OOO[username] = [...OOO[username], ...eventsToDays(events)]
            }
        })
    })

    return OOO
}

/**
 * Formats date frames to individual days.
 */
function eventsToDays(events) {
    const daysOff = []

    for (var event of events) {
        const start = new Date(formatDateAsRFC3339(new Date(event.start.dateTime)))
        const end = new Date(formatDateAsRFC3339(new Date(event.end.dateTime)))
        start.setUTCHours(0)
        end.setUTCHours(0)
        const numDaysOff = getNumberOfDays(start, end)

        // if this is a single OOO no need to loop
        if (numDaysOff === 1) {
            if (weekday(start)) {
                daysOff.push(start)
            }
        } else {
            
            for (start; start < end; nextDay(start)) {
                if (weekday(start)) {
                    daysOff.push(new Date(start))
                }
            }
        }
    }

    return daysOff
}

/**
 * Uses OOO to generate a schedule.
 */
function scheduler(ooo, weeks, numberInRotation = NUMBER_IN_ROTATION_PER_WEEK) {
    const users = Object.keys(ooo)
    const schedule = []

    for (let week of weeks) {
        var daysOff = 0
        var count = 0
        var deferredUsers = []
        const rotation = []

        while (count < users.length) {
            if (rotation.length === numberInRotation) {
                break
            }

            const user = users.shift()

            // check overlap of OOO
            for (day of week) {
                if (ooo[user].find(date => date.getTime() == day.getTime())) {
                    daysOff++
                }
            }

            if (daysOff <= MAX_DAYS_OFF_IN_A_WEEK) {
                // add to rotation and send user to the back
                rotation.push(user)
                users.push(user)

            } else {
                deferredUsers.push(user)
            }

            count++
            daysOff = 0
        }

        schedule.push(rotation)
        deferredUsers.forEach(du => users.unshift(du))
        deferredUsers = []

        // import events
        updateCalendar(week[0], week[week.length-1], rotation)
    }

    return schedule
}

/**
 * Formats weeks by its weekdays. 
 */
function getWeeks(start, end) { 
    const weeks = []
    var week = []

    // make this inclusive
    nextDay(end)

    // loop through days
    for (var d = start; d < end; nextDay(d)) {
        const day = weekday(d)
        if (day) {
            var date = d

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

/**
 * Adds a day to the date.
 * Used for when dates are exclusive so an extra day is needed.
 */
function nextDay(date) {
    return new Date(date.setDate(date.getDate() + 1))
}

/**
 * Imports the given event from the user's calendar into the shared team
 * calendar.
 * @param {string} username The team member that is attending the event.
 * @param {Calendar.Event} event The event to import.
 */
 function updateCalendar(start, end, rotation) {
    let response

    start = new Date(start.getFullYear(), start.getMonth(), start.getDate()).toISOString()
    endDate = new Date(end.getFullYear(), end.getMonth(), end.getDate())
    inclusiveEnd = nextDay(endDate).toISOString()
    end = endDate.toISOString()

    try {
        response = Calendar.Events.list(TEAM_CALENDAR_ID, {
            timeMin: start,
            timeMax: inclusiveEnd,
            showDeleted: false
        });
    } catch (e) {
        console.error('Error attempting to list triage rotation: %s. Skipping.',
            e.toString());
    }

    const toDelete = response.items.map(ev => ev.id)
    deleteEvents(toDelete)

    insertEvents(rotation, start, end)
}

/**
 * Deletes Google Calendar Events by the ID. 
 */
function deleteEvents(toDelete) {
    toDelete.forEach((id) => {
        try {
            Calendar.Events.remove(TEAM_CALENDAR_ID, id)
        } catch {
            console.error('Error attempting to delete triage rotation event: %s. Skipping.',
                e.toString());
        }
    })
}

/**
 * Inserts Google Calendar Events. 
 */
function insertEvents(usernames, start, end) {
    const endDate = nextDay(new Date(end)).toISOString()

    const eventsToInsert = usernames.map(username => ({
        summary: `${username}@grafana.com`,
        organizer: {
            id: TEAM_CALENDAR_ID,
        },
        attendees: [],
        start: {
            date: dateString(start)
        },
        end: {
            date: dateString(endDate)
        }
    }))

    eventsToInsert.forEach((ev) => {
        try {
            Calendar.Events.insert(ev, TEAM_CALENDAR_ID);
        } catch (e) {
            console.error('Error attempting to insert event: %s. Skipping.',
                e.toString());
        }
    })
}

/**
 * Get the date and ignore the timestamp. 
 */
function dateString(date) {
    return date.split("T")[0]
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
    // return new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString()
}

/**
 * End copy here
 * 
 * ===========================================================================================================================================
*/

module.exports = {
    getUsers,
    getWeeks,
    eventsToDays,
    getOOO,
    scheduler,
    deleteEvents,
    insertEvents,
    updateCalendar,
    sync
}