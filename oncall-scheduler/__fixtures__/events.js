const { Chance } = require("chance")

const OOOEvent = (start = "2022-01-17T00:00:00-05:00", end = "2022-01-18T00:00:00-05:00") => ({ privateCopy: true,
    summary: 'OOO',
    eventType: 'outOfOffice',
    created: Chance().date({string: true}),
    iCalUID: Chance().url(),
    htmlLink: Chance().url(),
    visibility: 'public',
    end: 
     { dateTime: end,
       timeZone: 'America/New_York' },
    organizer: 
     { email: Chance().email(),
       displayName: 'Unknown Organizer' },
    status: 'confirmed',
    reminders: { useDefault: true },
    sequence: 0,
    attendees: [ [Object] ],
    kind: 'calendar#event',
    etag: Chance().guid(),
    id: Chance().guid(),
    updated: Chance().date({string: true}),
    start: 
     { timeZone: 'America/New_York',
       dateTime: start },
    creator: { email: Chance().email(), self: true } })

module.exports = {
    OOOEvent
}