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

const calendarListResponses = (status = "confirmed") => {
  const username = `${Chance().first()}.${Chance().last()}`.toLowerCase()
  const email = `${username}@grafana.com`
  const timeZone = 'Europe/London'
  const updated = Chance().date({string: true})
  const nextSyncToken = Chance().guid()
  const differentNextSyncToken = Chance().guid()
  const etag = Chance().string()

  return [[
    {
      updated,
      summary: email,
      timeZone,
      nextSyncToken,
      items: [],
      accessRole: "owner",
      defaultReminders: [
          {
              minutes: 10,
              method: "popup"
          }
      ],
      kind: "calendar#events",
      etag
  },
  {
      updated,
      items: [],
      accessRole: "owner",
      summary: email,
      timeZone,
      etag,
      kind: "calendar#events",
      defaultReminders: [
          {
              minutes: 10,
              method: "popup"
          }
      ],
      nextSyncToken: differentNextSyncToken
  },
  {
      updated,
      etag,
      items: [],
      summary: email,
      accessRole: "owner",
      timeZone,
      nextSyncToken,
      kind: "calendar#events",
      defaultReminders: [
          {
              method: "popup",
              minutes: 10
          }
      ]
  },
  {
      kind: "calendar#events",
      nextSyncToken,
      updated,
      defaultReminders: [
          {
              minutes: 10,
              method: "popup"
          }
      ],
      accessRole: "owner",
      items: [],
      etag,
      summary: email,
      timeZone
  },
  {
    defaultReminders: [
        {
            minutes: 10,
            method: "popup"
        }
    ],
    items: [
        {
            reminders: {
                useDefault: false
            },
            visibility: "public",
            kind: "calendar#event",
            iCalUID: Chance().guid(),
            status,
            updated,
            id: Chance().guid(),
            attendees: [
                {
                    self: true,
                    email,
                    displayName: email,
                    responseStatus: "accepted"
                }
            ],
            htmlLink: Chance().url(),
            sequence: 0,
            organizer: {
                email: "unknownorganizer@calendar.google.com",
                displayName: "Unknown Organizer"
            },
            etag: Chance().guid(),
            start: {
                timeZone,
                dateTime: "2022-04-11T00:00:00+01:00"
            },
            end: {
                dateTime: "2022-04-16T00:00:00+01:00",
                timeZone
            },
            privateCopy: true,
            summary: "Out of office",
            created: updated,
            eventType: "outOfOffice",
            creator: {
                self: true,
                email
            }
        }
    ],
    etag: Chance().guid(),
    updated,
    accessRole: "owner",
    summary: email,
    kind: "calendar#events",
    nextSyncToken: Chance().guid(),
    timeZone
  },
  {
      accessRole: "owner",
      kind: "calendar#events",
      nextSyncToken,
      updated,
      items: [],
      timeZone,
      defaultReminders: [
          {
              minutes: 10,
              method: "popup"
          }
      ],
      etag,
      summary: email
  }
  ], [
    new Date('2022-04-11'),
    new Date('2022-04-12'),
    new Date('2022-04-13'),
    new Date('2022-04-14'),
    new Date('2022-04-15'),
  ]]
}

const calendarListResponsesForUpdateCalendar = () => {
  const email = `${Chance().first}.${Chance().last()}@grafana.com`

  return {
      summary: Chance().sentence(),
      etag: Chance().guid(),
      timeZone: "Europe/London",
      updated: "2022-01-19T11:11:47.388Z",
      nextSyncToken: Chance().guid(),
      defaultReminders: [],
      accessRole: "owner",
      items: [
          {
              creator: {
                  email
              },
              kind: "calendar#event",
              status: "confirmed",
              summary: email,
              htmlLink: Chance().url(),
              start: {
                  date: "2022-01-03"
              },
              updated: "2022-01-19T11:11:47.388Z",
              reminders: {
                  useDefault: false
              },
              eventType: "default",
              created: "2022-01-19T11:11:47.000Z",
              organizer: {
                  displayName: Chance().sentence(),
                  self: true,
                  email
              },
              sequence: 0,
              iCalUID: Chance().guid(),
              transparency: "transparent",
              id: Chance().guid(),
              end: {
                  date: "2022-01-08"
              },
              etag: Chance().guid()
          }
      ],
      kind: "calendar#events"
  }
 }

module.exports = {
    OOOEvent,
    calendarListResponses,
    calendarListResponsesForUpdateCalendar
}