# Holiday calendar

## Prerequistes

* Google team calendar ID
    * onCall triage calendar
* Google group email
    * Group email including all team members to get OOO for.
* Google Apps Script

## How it works

Altered the Google Apps Script sample for populating a [team vacation calendar](https://developers.google.com/apps-script/samples/automations/vacation-calendar) using out of office events in Google Calendar.

Disregards timezones so OOO days appear as single days rather than 24 hours blocks which may end up spanning across multiple days depending on the timezones e.g. 5am previous day to 5am next day or 11pm previous day to 11pm next day.

## Usage

1. Follow the steps for the populating a [team vacation calendar](https://developers.google.com/apps-script/samples/automations/vacation-calendar)
1. Copy the code from the `script.js` file
1. Paste the code into the new Google Apps Script project
1. Fill in the `TEAM_CALENDAR_ID` and `GROUP_EMAIL`
1. (Optional) Adjust the script [settings](#settings), if needed
1. [Run](https://developers.google.com/apps-script/samples/automations/vacation-calendar#step_3_populate_the_calendar) the script

### Settings

The script can be tweaked to support different use cases.

\* is required to be given

| Setting                      | Description                                                                            |
| ---------------------------- | --------------------------------------------------------------------------------       |
| TEAM_CALENDAR_ID*            | Google calendar ID linked to onCall triage                                             |
| GROUP_EMAIL*                 | Google group email containing members to be added to rotation                          |
| KEYWORDS                     | Keywords to determine OOO events in Google calendar                                    |
| MONTHS_IN_ADVANCE            | Months in advance to generate the weekly rotation for                                  |