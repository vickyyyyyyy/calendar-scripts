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
 * Set the number of months in advance to search for OOO and generate schedule for.
 */
const MONTHS_IN_ADVANCE = 6

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

/**
 * Look through the group members' public calendars and add any
 * 'vacation' or 'out of office' events to the team calendar.
 */
function sync() {
  // Define the calendar event date range to search.
  var today = new Date();
  var maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + MONTHS_IN_ADVANCE);

  // Determine the time the the script was last run.
  var lastRun = PropertiesService.getScriptProperties().getProperty('lastRun');
  lastRun = lastRun ? new Date(lastRun) : null;

  // Get the list of users in the Google Group.
  var users = GroupsApp.getGroupByEmail(GROUP_EMAIL).getUsers();

  // For each user, find events having one or more of the keywords in the event
  // summary in the specified date range. Import each of those to the team
  // calendar.
  var count = 0;
  users.forEach(function(user) {
    var username = user.getEmail().split('@')[0];
    KEYWORDS.forEach(function(keyword) {
      var events = findEvents(user, keyword, today, maxDate, lastRun);
      events.forEach(function(event) {
        event.start = offsetDateTime(event.start)
        event.end = offsetDateTime(event.end)
  
        importEvent(username, event);
        count++;
      }); // End foreach event.
    }); // End foreach keyword.
  }); // End foreach user.

  PropertiesService.getScriptProperties().setProperty('lastRun', today);
  console.log('Imported ' + count + ' events');
}

/**
 * Offset the timezone to avoid OOO days spanning across more days
 */
function offsetDateTime(eventStartOrEnd) {
  if (!eventStartOrEnd.dateTime) {
    return eventStartOrEnd
  }

  if (!eventStartOrEnd.dateTime.includes('00:00:00')) {
    return eventStartOrEnd
  }

  return {
    date: eventStartOrEnd.dateTime.split("T")[0]
  }
}

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