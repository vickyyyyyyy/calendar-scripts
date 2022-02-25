# onCall Scheduler

## Prerequistes

* Google team calendar ID
    * onCall triage calendar
* Google group email
    * Group email including all team members to be added to the rotation
* Google Apps Script

## How it works

Inspired by the Google Apps Script sample for populating a [team vacation calendar](https://developers.google.com/apps-script/samples/automations/vacation-calendar) using out of office events in Google Calendar.

The script schedules weekly rotations with members from the Google group email specified while taking into consideration their vacation/holidays (determined by out of office events added to their personal Grafana Google calendar).

Monday to Friday events are added to the Google team calendar given with their Grafana email so onCall can pick them up for triage.

## Usage

1. Go to [Google Apps Script](https://script.google.com/home) and create a new project
1. Copy the code needed from the `script.js` file (see comments for which lines to copy)
1. Paste the code into the new Google Apps Script project
1. Fill in the `TEAM_CALENDAR_ID` and `GROUP_EMAIL`
1. Adjust the script [settings](#settings), if needed
1. [Run](https://developers.google.com/apps-script/samples/automations/vacation-calendar#step_3_populate_the_calendar) the script

### Settings

The script can be tweaked to support different use cases.

\* is required to be given

| Setting                      | Description                                                                            |
| ---------------------------- | --------------------------------------------------------------------------------       |
| TEAM_CALENDAR_ID*            | Google calendar ID linked to onCall triage                                             |
| GROUP_EMAIL*                 | Google group email containing members to be added to rotation                          |
| KEYWORDS                     | Keywords to determine OOO events in Google calendar                                    |
| EXCLUDE_MEMBERS              | Members in the Google group email that we do not want to include in the rotation       |
| NUMBER_IN_ROTATION_PER_WEEK  | Number of members to have on rotation                                                  |
| MAX_DAYS_OFF_IN_A_WEEK       | Maximum OOO days off a member can have to still be eligible for the weekly rotation    |
| MONTHS_IN_ADVANCE            | Months in advance to generate the weekly rotation for                                  |
| START_DATE                   | Start date of the rotation schedule                                                    |

## Installation
The script is intended to be copied to Google Apps Script but can be locally installed to run the tests for any new changes.

```bash
npm install
```

## Testing

```bash
npm run test
```

## Limitations
The following are not currently supported:

### Round robin rotations

With multiple users on rotation per week, there is the likelihood that these groups are always scheduled together.

### Recurring OOO events

The structure of Google's recurring events are in a format where only the first event is returned (with a `recurrence` property stating the cadence).

The script only parses individual events and does not support checking for recurring events based on this property.

### Deterministic schedule

Google returns the users from email groups in an unsorted list which causes different rotations to be generated each time the script is run.