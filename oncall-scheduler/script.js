const { ScriptApp, GroupsApp, PropertiesService, Calendar } = require("./__fixtures__/google")

/**
 * Copy everything between the lines
 * 
 * ===========================================================================================================================================
*/
// Version 1.1.0

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
const KEYWORDS = ['vacation', 'ooh', 'ooo', 'holiday', 'out of office', 'offline', 'frånvarande', 'franvarande'];


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
 * Set the number of months in advance to search for OOO and generate schedule for.
 */
const MONTHS_IN_ADVANCE = 1

/**
 * Set the start date for the rotation.
 * Pass in the date wanted in the format: new Date('2022-01-01')
 */
const START_DATE = new Date()

/**
 * Set how often the script should run to check for new/updated OOO and generate new schedules.
 */
const CADENCE_IN_WEEKS = 4

const OOO = {}

/**
 * Setup the script to run automatically on a regular cadence.
 */
function setup() {
  var triggers = ScriptApp.getProjectTriggers();
  if (triggers.length > 0) {
    throw new Error('Triggers are already setup.');
  }

  // More triggers can be found here: https://developers.google.com/apps-script/reference/script/clock-trigger-builder
  ScriptApp.newTrigger('sync').timeBased().onWeekDay(ScriptApp.WeekDay.FRIDAY).everyWeeks(CADENCE_IN_WEEKS).create();
  // Run the first sync immediately.
  sync();
}

/**
 * Main function for creating a schedule based off OOO and import to Google Calendar.
 */
function sync() {
    const users = getUsers()
    const ooo = getOOO(users)

    const startDate = normalizeDate(START_DATE)
    let endDate = new Date(startDate.valueOf())
    endDate.setMonth(endDate.getMonth() + MONTHS_IN_ADVANCE)

    const weeks = getWeeks(startDate, endDate)
    scheduler(ooo, weeks)
}

/**
 * Checks if a date is a weekday.
 * @param {Date} date The date to check whether it is a weekday or not.
 * @return {boolean} whether it is a weekday or not.
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
 * @param {string[]} excludedMembers The members to exclude from the rotation.
 * @return {Object[]} an array of user objects (see google.users for structure)
 */
function getUsers(excludedMembers) {
  excludedMembers = excludedMembers || EXCLUDE_MEMBERS
  return GroupsApp.getGroupByEmail(GROUP_EMAIL).getUsers().filter(user => !excludedMembers.includes(user.getUsername()));
}

/**
 * Gets OOO for users.
 * @param {Object[]} users The objects of users.
 * @return {{[username]: Date[]}} the OOO of all users.
 */
function getOOO(users) {
    // Define the calendar event date range to search.
    var today = new Date();
    var maxDate = new Date();
    maxDate.setMonth(normalizeDate(START_DATE).getMonth() + MONTHS_IN_ADVANCE);

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

            events.forEach((event) => {
                event.start = offsetDateTime(event.start)
                event.end = offsetDateTime(event.end)
            });

            const oooDays = eventsToDays(events)

            if (oooDays.length > 0) {
                OOO[username] = [...OOO[username], ...oooDays]
            }
        })
    })

    return OOO
}

/**
 * Round the date to offset UTC.
 * @param {Date} date The date to offset.
 * @return {Date} the rounded date.
 */
function normalizeDate(date) {
    // add 12 hours to round the date if needed
    date.setHours(date.getHours() + 12)

    return date
}

/**
 * Formats date frames to individual days.
 * @param {Object[]} events The OOO events from Google Calendar.
 * @return {Date[]} single days off.
 */
function eventsToDays(events) {
    const daysOff = []

    for (var event of events) {
        const start = normalizeDate(new Date(event.start.date))
        const end = normalizeDate(new Date(event.end.date))
        const exclusiveEnd = previousDay(end)
            
        for (start; start <= exclusiveEnd; nextDay(start)) {
            if (weekday(start)) {
                daysOff.push(new Date(start))
            }
        }
    }

    return daysOff
}

/**
 * Uses OOO to generate a schedule.
 * @param {Date} ooo The start date of the weeks.
 * @param {Date} weeks The end date of the weeks.
 * @param {number} numberInRotation The size of the weekly rotation.
 * @return {string[][]} a schedule array containining arrays of weekly rotations.
 */
function scheduler(ooo, weeks, numberInRotation = NUMBER_IN_ROTATION_PER_WEEK) {
    const users = Object.keys(ooo)
    const schedule = []

    for (let week of weeks) {
        var daysOff = 0
        var count = 0
        var deferredUsers = []
        const rotation = []

        const numberOfUsers = users.length

        while (count < numberOfUsers) {
            if (rotation.length === numberInRotation) {
                break
            }

            const user = users.shift()

            // check overlap of OOO
            for (day of week) {
                if (ooo[user].find(date => date.getFullYear() === day.getFullYear() && date.getMonth() === day.getMonth() && date.getDate() === day.getDate())) {
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
 * @param {Date} start The start date of the weeks.
 * @param {Date} end The end date of the weeks.
 * @return {Date[][]} an array of arrays containing the weekdays.
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
 * @param {Date} date The date to add a day to.
 * @return {Date} the day after the date.
 */
function nextDay(date) {
    return new Date(date.setDate(date.getDate() + 1))
}

/**
 * Subtracts a day from the date.
 * Used for when dates are inclusive so one day less is needed.
 * @param {Date} date The date to substract a day from.
 * @return {Date} the day before the date.
 */
function previousDay(date) {
    return new Date(date.setDate(date.getDate() - 1))
}

/**
 * Imports the given event from the user's calendar into the shared team
 * calendar.
 * @param {Date} start The start date of the week.
 * @param {Date} end The end date of the week.
 * @param {string[]} rotation The rotation for the week.
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
 * @param {string[]} toDelete The calendar event IDs to delete.
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
 * @param {string[]} usernames The usernames to insert events for.
 * @param {string} start The start date of the event to be inserted.
 * @param {string} end The end date of the event to be inserted (inclusive).
 */
function insertEvents(usernames, start, end) {
    const endDate = new Date(end).toISOString()

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
            console.log(`Scheduling ${ev.summary} for ${dateString(start)} to ${dateString(endDate)}`)
        } catch (e) {
            console.error('Error attempting to insert event: %s. Skipping.',
                e.toString());
        }
    })
}

/**
 * Get the date and ignore the timestamp.
 * @param {string} date The date in string format.
 * @return {string} a date string without the timestamp.
 */
function dateString(date) {
    return date.split("T")[0]
}

/**
 * Offset the timezone to avoid OOO days spanning across more days
 * @param {Object} eventStartOrEnd The date from a Google Calendar event.
 * @return {Object} a formatted date time that is offset.
 */
function offsetDateTime(eventStartOrEnd) {
    if (!eventStartOrEnd.dateTime) {
        return eventStartOrEnd
    }

    if (!eventStartOrEnd.dateTime.includes('00:00:00')) {
        return eventStartOrEnd
    }

    return {
        date: dateString(eventStartOrEnd.dateTime)
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