const script = require("./script")
const weekDates = require("./__fixtures__/weekDates")
const events = require("./__fixtures__/events")
const google = require("./__fixtures__/google")
const { Chance } = require("chance")

describe("script", () => {
    afterEach(() => {
        jest.resetAllMocks()
    })

    describe("getUsers", () => {
        beforeEach(() => {
            jest.spyOn(google.GroupsApp, 'getGroupByEmail').mockReturnValue({
                getUsers: () => google.users(2)
            })
        })
    
        it("returns all users when there are no excluded members passed in", () => {
            expect(script.getUsers().map(u => u.getUsername())).toEqual([
                "taylor.swift",
                "nicki.minaj"
            ])
        })

        it("returns all users when there are no excluded members", () => {
            expect(script.getUsers([]).map(u => u.getUsername())).toEqual([
                "taylor.swift",
                "nicki.minaj"
            ])
        })

        it("returns users without excluded members when there are excluded members", () => {
            expect(script.getUsers(["nicki.minaj"]).map(u => u.getUsername())).toEqual(["taylor.swift"])
        })
    })
    
    describe("getOOO", () => {
        it("returns OOO with OOO events", () => {
            const expectedDaysOff = events.calendarListResponses()[1]
            mockEventsListForUsers(2)

            expect(script.getOOO(google.users(2))).toEqual({
                "taylor.swift": expectedDaysOff,
                "nicki.minaj": expectedDaysOff,
            })
        })

        it("returns OOO without including cancelled events", () => {
            mockEventsListForUsers(2, "cancelled")

            expect(script.getOOO(google.users(2))).toEqual({
                "taylor.swift": [],
                "nicki.minaj": [],
            })
        })

        it("returns empty OOO for all users when no OOO events are returned", () => {
            mockEventsListForUsers(2, undefined, [])

            expect(script.getOOO(google.users(2))).toEqual({
                "taylor.swift": [],
                "nicki.minaj": [],
            })
        })
    })

    describe("eventsToDays", () => {
        it("returns single day off for a Monday to Tuesday OOO event", () => {
            expect(script.eventsToDays([
                events.OOOEvent()
            ])).toEqual([new Date('2022-01-17T12:00:00+00:00')])
        })

        it("returns two days off for a Monday to Wednesday OOO event", () => {
            expect(script.eventsToDays([
                events.OOOEvent("2022-01-17", "2022-01-19"),
            ])).toEqual([
                new Date('2022-01-17T12:00:00+00:00'),
                new Date('2022-01-18T12:00:00+00:00')
            ])
        })

        it("returns three days off for a Monday to Thursday OOO event", () => {
            expect(script.eventsToDays([
                events.OOOEvent("2022-01-17", "2022-01-20"),
            ])).toEqual([
                new Date('2022-01-17T12:00:00+00:00'),
                new Date('2022-01-18T12:00:00+00:00'),
                new Date('2022-01-19T12:00:00+00:00')
            ])
        })

        it("returns five days off for a Monday to Saturday OOO event", () => {
            expect(script.eventsToDays([
                events.OOOEvent("2022-01-03", "2022-01-08"),
            ])).toEqual(weekDates.timeOffset(weekDates.weekdaysForOneWeek()[0]))
        })

        it("returns five days off for a Monday to Sunday OOO event", () => {
            expect(script.eventsToDays([
                events.OOOEvent("2022-01-03", "2022-01-09"),
            ])).toEqual(weekDates.timeOffset(weekDates.weekdaysForOneWeek()[0]))
        })

        it("returns five days off for a Monday to Monday OOO event", () => {
            expect(script.eventsToDays([
                events.OOOEvent("2022-01-03", "2022-01-10"),
            ])).toEqual(weekDates.timeOffset(weekDates.weekdaysForOneWeek()[0]))
        })

        it("does not return days off for a Saturday to Sunday OOO event", () => {
            expect(script.eventsToDays([
                events.OOOEvent("2022-01-01", "2022-01-02"),
            ])).toEqual([])
        })

        it("does not return days off for a Saturday to Monday OOO event", () => {
            expect(script.eventsToDays([
                events.OOOEvent("2022-01-01", "2022-01-03"),
            ])).toEqual([])
        })

        it("returns days off for two midweek OOO events", () => {
            expect(script.eventsToDays([
                events.OOOEvent("2022-01-03", "2022-01-05"),
                events.OOOEvent("2022-01-05", "2022-01-08"),
            ])).toEqual(weekDates.timeOffset(weekDates.weekdaysForOneWeek()[0]))
        })

        it("returns days off for two week-long OOO events", () => {
            expect(script.eventsToDays([
                events.OOOEvent("2022-01-01", "2022-01-08"),
                events.OOOEvent("2022-01-10", "2022-01-17"),
            ])).toEqual(weekDates.timeOffset(weekDates.weekdaysForTwoWeeks().flat()))
        })
    })
    describe("getWeeks", () => {

        describe("one year", () => {
            it("returns correct dates for year of 2022", () => {
                const startDate = new Date('2022-01-01')
                const endDate = new Date('2023-01-01')

                expect(script.getWeeks(startDate, endDate)).toEqual(weekDates.weekdaysFor2022)
            })
        })

        describe("one week", () => {
            it("returns correct dates given start day of Monday and end day of Friday", () => {
                const startDate = new Date('2022-01-03')
                const endDate = new Date('2022-01-07')
        
                expect(script.getWeeks(startDate, endDate)).toEqual(weekDates.weekdaysForOneWeek())
            })
    
            it("returns correct dates given start day of Monday and end day of Saturday", () => {
                const startDate = new Date('2022-01-01')
                const endDate = new Date('2022-01-08')
        
                expect(script.getWeeks(startDate, endDate)).toEqual(weekDates.weekdaysForOneWeek())
            })
        
            it("returns correct dates given start day of Monday and end day of Sunday", () => {
                const startDate = new Date('2022-01-03')
                const endDate = new Date('2022-01-09')
        
                expect(script.getWeeks(startDate, endDate)).toEqual(weekDates.weekdaysForOneWeek())
            })
    
            it("returns correct dates given start day of Monday and end day of Wednesday", () => {
                const startDate = new Date('2022-01-10')
                const endDate = new Date('2022-01-12')
        
                expect(script.getWeeks(startDate, endDate)).toEqual(weekDates.weekdaysFromStartToMidForOneWeek)
            })

            it("returns correct dates given start day of Wednesday and end day of Friday", () => {
                const startDate = new Date('2022-01-12')
                const endDate = new Date('2022-01-14')
        
                expect(script.getWeeks(startDate, endDate)).toEqual(weekDates.weekdaysFromMidToEndForOneWeek)
            })

            it("returns correct dates given start day of Wednesday and end day of Saturday", () => {
                const startDate = new Date('2022-01-12')
                const endDate = new Date('2022-01-15')
        
                expect(script.getWeeks(startDate, endDate)).toEqual(weekDates.weekdaysFromMidToEndForOneWeek)
            })

            it("returns correct dates given start day of Wednesday and end day of Sunday", () => {
                const startDate = new Date('2022-01-12')
                const endDate = new Date('2022-01-16')
        
                expect(script.getWeeks(startDate, endDate)).toEqual(weekDates.weekdaysFromMidToEndForOneWeek)
            })
        })

        describe("two weeks", () => {
            it("returns correct dates given start date of Monday and end date of Friday", () => {
                const startDate = new Date('2022-01-03')
                const endDate = new Date('2022-01-14')
        
                expect(script.getWeeks(startDate, endDate)).toEqual(weekDates.weekdaysForTwoWeeks())
            })
        
            it("returns correct dates given start date of Monday and end date of Saturday", () => {
                const startDate = new Date('2022-01-03')
                const endDate = new Date('2022-01-15')
        
                expect(script.getWeeks(startDate, endDate)).toEqual(weekDates.weekdaysForTwoWeeks())
            })
        
            it("returns correct dates given start date of Monday and end date of Sunday", () => {
                const startDate = new Date('2022-01-03')
                const endDate = new Date('2022-01-16')
        
                expect(script.getWeeks(startDate, endDate)).toEqual(weekDates.weekdaysForTwoWeeks())
            })

            it("returns correct dates given start date of Monday and end date of Wednesday", () => {
                const startDate = new Date('2022-01-03')
                const endDate = new Date('2022-01-12')
        
                expect(script.getWeeks(startDate, endDate)).toEqual(weekDates.weekdaysFromStartToMidForTwoWeeks)
            })

            it("returns correct dates given start date of Wednesday and end date of Friday", () => {
                const startDate = new Date('2022-01-05')
                const endDate = new Date('2022-01-14')
        
                expect(script.getWeeks(startDate, endDate)).toEqual(weekDates.weekdaysFromMidToEndForTwoWeeks)
            })

            it("returns correct dates given start date of Wednesday and end date of Saturday", () => {
                const startDate = new Date('2022-01-05')
                const endDate = new Date('2022-01-15')
        
                expect(script.getWeeks(startDate, endDate)).toEqual(weekDates.weekdaysFromMidToEndForTwoWeeks)
            })

            it("returns correct dates given start date of Wednesday and end date of Sunday", () => {
                const startDate = new Date('2022-01-05')
                const endDate = new Date('2022-01-16')
        
                expect(script.getWeeks(startDate, endDate)).toEqual(weekDates.weekdaysFromMidToEndForTwoWeeks)
            })

            it("returns correct dates given start date of Wednesday and end date of Wednesday", () => {
                const startDate = new Date('2022-01-05')
                const endDate = new Date('2022-01-12')
        
                expect(script.getWeeks(startDate, endDate)).toEqual(weekDates.weekdaysFromMidToMidForTwoWeeks)
            })
        })
    })

    describe("scheduler", () => {
        beforeEach(() => {
            mockEventsListForUsers()
        })

        it("returns schedule with no overlapping OOO", () => {
            const expectedDaysOff = events.calendarListResponses()[1]
            const ooo = {
                "taylor.swift": expectedDaysOff,
                "nicki.minaj": expectedDaysOff,
                "ariana.grande": expectedDaysOff,
                "hayley.kiyoko": expectedDaysOff
            }

            // there are no OOO that conflicts with the rotation so schedule is as normal
            expect(script.scheduler(ooo, weekDates.weekdaysFor2022.slice(0,3))).toEqual([
                [
                    "taylor.swift",
                    "nicki.minaj",
                ],
                [
                    "ariana.grande",
                    "hayley.kiyoko",
                ],
                [
                    "taylor.swift",
                    "nicki.minaj",
                ]
            ])
        })

        it("returns schedule with overlapping OOO under the max days allowed", () => {
            const expectedDaysOff = events.calendarListResponses()[1]
            const ooo = {
                "taylor.swift": [
                    new Date('2022-01-03')
                  ],
                "nicki.minaj": expectedDaysOff,
                "ariana.grande": expectedDaysOff,
                "hayley.kiyoko": expectedDaysOff
            }

            // taylor.swift has a single OOO where they are unavailable for the rotation but it is
            // under the max days allowed so they are still included in that week's rotation
            expect(script.scheduler(ooo, weekDates.weekdaysFor2022.slice(0,3))).toEqual([
                [
                    "taylor.swift",
                    "nicki.minaj",
                ],
                [
                    "ariana.grande",
                    "hayley.kiyoko",
                ],
                [
                    "taylor.swift",
                    "nicki.minaj",
                ]
            ])
        })
    
        it("returns schedule with overlapping OOO over the max days allowed", () => {
            const expectedDaysOff = events.calendarListResponses()[1]
            const ooo = {
                "taylor.swift": [
                    new Date('2022-01-03'),
                    new Date('2022-01-04'),
                    new Date('2022-01-05'),
                    new Date('2022-01-06'),
                    new Date('2022-01-07'),
                  ],
                "nicki.minaj": expectedDaysOff,
                "ariana.grande": expectedDaysOff,
                "hayley.kiyoko": expectedDaysOff
            }

            // taylor.swift has OOsO where they are unavailable for the rotation and it is
            // over the max days allowed so they are no longer included in that week's rotation
            expect(script.scheduler(ooo, weekDates.weekdaysFor2022.slice(0,3))).toEqual([
                [
                    "nicki.minaj",
                    "ariana.grande",
                ],
                [
                    "taylor.swift",
                    "hayley.kiyoko",
                ],
                [
                    "nicki.minaj",
                    "ariana.grande"
                ]
            ])
        })

        it("returns empty schedule when no one is available", () => {
            const overlappingOOO = [
                new Date('2022-01-03'),
                new Date('2022-01-04'),
                new Date('2022-01-05'),
                new Date('2022-01-06'),
                new Date('2022-01-07'),
              ]

            const ooo = {
                "taylor.swift": overlappingOOO,
                "nicki.minaj": overlappingOOO,
                "ariana.grande": overlappingOOO,
                "hayley.kiyoko": overlappingOOO
            }

            expect(script.scheduler(ooo, weekDates.weekdaysFor2022.slice(0,3))).toEqual([
                [],
                [
                    "hayley.kiyoko",
                    "ariana.grande"
                ],
                [
                    "nicki.minaj",
                    "taylor.swift"
                ]
            ])
        })
    })

    describe("deleteEvents", () => {
        it("calls Calendar.Events.remove with single id", () => {
            const removeCall = jest.spyOn(google.Calendar.Events, 'remove')
            const id = Chance().guid()
            script.deleteEvents([id])
            
            expect(removeCall).toHaveBeenCalledWith("<ENTER_TEAM_CALENDAR_ID_HERE>", id)
        })

        it("calls Calendar.Events.remove with multiple ids", () => {
            const removeCall = jest.spyOn(google.Calendar.Events, 'remove')
            const ids = new Array(5).fill(null).map(()=> (Chance().guid()))
            script.deleteEvents(ids)

            ids.forEach(id => expect(removeCall).toHaveBeenCalledWith("<ENTER_TEAM_CALENDAR_ID_HERE>", id))
        })

        it("does not call Calendar.Events.remove for no ids", () => {
            const removeCall = jest.spyOn(google.Calendar.Events, 'remove')

            script.deleteEvents([])
            
            expect(removeCall).not.toHaveBeenCalled()
        })
    })

    describe("insertEvents", () => {
        it("calls Calender.Events.insert with single username", () => {
            const insertCall = jest.spyOn(google.Calendar.Events, 'insert')
            script.insertEvents(["some.name"], "2022-01-01T00:00:00Z", "2022-01-02T00:00:00Z")

            expect(insertCall).toHaveBeenCalledWith({
                summary: "some.name@grafana.com",
                organizer: {
                    id: "<ENTER_TEAM_CALENDAR_ID_HERE>",
                },
                attendees: [],
                start: {
                    date: "2022-01-01"
                },
                end: {
                    date: "2022-01-02"
                }
            }, "<ENTER_TEAM_CALENDAR_ID_HERE>")
        })

        it("calls Calender.Events.insert with multiple usernames", () => {
            const insertCall = jest.spyOn(google.Calendar.Events, 'insert')
            script.insertEvents(["some.name", "other.name"], "2022-01-01T00:00:00Z", "2022-01-02T00:00:00Z")

            expect(insertCall).toHaveBeenCalledWith({
                summary: "some.name@grafana.com",
                organizer: {
                    id: "<ENTER_TEAM_CALENDAR_ID_HERE>",
                },
                attendees: [],
                start: {
                    date: "2022-01-01"
                },
                end: {
                    date: "2022-01-02"
                }
            }, "<ENTER_TEAM_CALENDAR_ID_HERE>")

            expect(insertCall).toHaveBeenCalledWith({
                summary: "other.name@grafana.com",
                organizer: {
                    id: "<ENTER_TEAM_CALENDAR_ID_HERE>",
                },
                attendees: [],
                start: {
                    date: "2022-01-01"
                },
                end: {
                    date: "2022-01-02"
                }
            }, "<ENTER_TEAM_CALENDAR_ID_HERE>")
        })

        it("does not call Calender.Events.insert with no username", () => {
            const insertCall = jest.spyOn(google.Calendar.Events, 'insert')
            script.insertEvents([], "2022-01-01T00:00:00Z", "2022-01-02T00:00:00Z")

            expect(insertCall).not.toHaveBeenCalled()
        })
    })

    describe("updateCalendar", () => {
        it("does not call Calendar.Events.remove with no events that need to be deleted from the Calendar.Events.list call", () => {
            const removeEventsCall = jest.spyOn(google.Calendar.Events, 'remove')

            const response = events.calendarListResponsesForUpdateCalendar([])

            jest.spyOn(google.Calendar.Events, 'list')
                .mockReturnValue(response)
            script.updateCalendar(new Date("2022-01-03"), new Date("2022-01-08"), [])

            expect(removeEventsCall).not.toHaveBeenCalled()
        })

        it("calls Calendar.Events.remove with event that needs to be deleted from the Calendar.Events.list call", () => {
            const removeEventsCall = jest.spyOn(google.Calendar.Events, 'remove')

            const response = events.calendarListResponsesForUpdateCalendar()

            jest.spyOn(google.Calendar.Events, 'list')
                .mockReturnValue(response)
            script.updateCalendar(new Date("2022-01-03"), new Date("2022-01-08"), [Chance().email()])

            expect(removeEventsCall).toHaveBeenCalledWith("<ENTER_TEAM_CALENDAR_ID_HERE>", response.items[0].id)
        })

        it("calls Calendar.Events.insert with event that needs to be inserted", () => {
            const insertEventsCall = jest.spyOn(google.Calendar.Events, 'insert')

            const response = events.calendarListResponsesForUpdateCalendar()

            jest.spyOn(google.Calendar.Events, 'list')
                .mockReturnValue(response)
            script.updateCalendar(new Date("2022-01-03"), new Date("2022-01-08"), [Chance().email()])

            expect(insertEventsCall).toHaveBeenCalledTimes(1)
        })
    })
})

const mockEventsListForUsers = (numUsers = google.users().length, status, items) => {
    const response = events.calendarListResponses(status, items)[0]

    let spy = jest.spyOn(google.Calendar.Events, 'list')

    for (var i = 0; i < numUsers; i++){
        spy = spy.mockReturnValueOnce(response[0])
        .mockReturnValueOnce(response[1])
        .mockReturnValueOnce(response[2])
        .mockReturnValueOnce(response[3])
        .mockReturnValueOnce(response[4])
        .mockReturnValueOnce(response[5])
    }
}