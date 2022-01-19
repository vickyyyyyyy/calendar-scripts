const script = require("./script")
const weekDates = require("./__fixtures__/weekDates")
const events = require("./__fixtures__/events")
const google = require("./__fixtures__/google")
const { Chance } = require("chance")

describe("script", () => {
    afterEach(() => {
        jest.resetAllMocks()
    })

    describe("getOOO", () => {
        it("returns OOO with events", () => {
            const response = events.calendarListResponses()[0]
            const expectedDaysOff = events.calendarListResponses()[1]
            jest.spyOn(google.Calendar.Events, 'list')
                .mockReturnValueOnce(response[0])
                .mockReturnValueOnce(response[1])
                .mockReturnValueOnce(response[2])
                .mockReturnValueOnce(response[3])
                .mockReturnValueOnce(response[4])
                .mockReturnValueOnce(response[5])
                .mockReturnValueOnce(response[0])
                .mockReturnValueOnce(response[1])
                .mockReturnValueOnce(response[2])
                .mockReturnValueOnce(response[3])
                .mockReturnValueOnce(response[4])
                .mockReturnValueOnce(response[5])

            expect(script.getOOO(google.users)).toEqual({
                "taylor.swift": expectedDaysOff,
                "nicki.minaj": expectedDaysOff,
            })
        })
    })

    describe("eventsToDays", () => {
        it("returns single day off for a Monday to Tuesday OOO event", () => {
            expect(script.eventsToDays([
                events.OOOEvent()
            ])).toEqual([new Date('2022-01-17')])
        })

        it("returns two days off for a Monday to Wednesday OOO event", () => {
            expect(script.eventsToDays([
                events.OOOEvent("2022-01-17T00:00:00-05:00", "2022-01-19T00:00:00-05:00"),
            ])).toEqual([
                new Date('2022-01-17'),
                new Date('2022-01-18')
            ])
        })

        it("returns three days off for a Monday to Thursday OOO event", () => {
            expect(script.eventsToDays([
                events.OOOEvent("2022-01-17T00:00:00-05:00", "2022-01-20T00:00:00-05:00"),
            ])).toEqual([
                new Date('2022-01-17'),
                new Date('2022-01-18'),
                new Date('2022-01-19')
            ])
        })

        it("returns five days off for a Monday to Saturday OOO event", () => {
            expect(script.eventsToDays([
                events.OOOEvent("2022-01-03T00:00:00-05:00", "2022-01-08T00:00:00-05:00"),
            ])).toEqual(...weekDates.weekdaysForOneWeek)
        })

        it("returns five days off for a Monday to Sunday OOO event", () => {
            expect(script.eventsToDays([
                events.OOOEvent("2022-01-03T00:00:00-05:00", "2022-01-09T00:00:00-05:00"),
            ])).toEqual(...weekDates.weekdaysForOneWeek)
        })

        it("returns five days off for a Monday to Monday OOO event", () => {
            expect(script.eventsToDays([
                events.OOOEvent("2022-01-03T00:00:00-05:00", "2022-01-10T00:00:00-05:00"),
            ])).toEqual(...weekDates.weekdaysForOneWeek)
        })

        it("does not return days off for a Saturday to Sunday OOO event", () => {
            expect(script.eventsToDays([
                events.OOOEvent("2022-01-01T00:00:00-05:00", "2022-01-02T00:00:00-05:00"),
            ])).toEqual([])
        })

        it("does not return days off for a Saturday to Monday OOO event", () => {
            expect(script.eventsToDays([
                events.OOOEvent("2022-01-01T00:00:00-05:00", "2022-01-03T00:00:00-05:00"),
            ])).toEqual([])
        })

        it("returns days off for two midweek OOO events", () => {
            expect(script.eventsToDays([
                events.OOOEvent("2022-01-03T00:00:00-05:00", "2022-01-05T00:00:00-05:00"),
                events.OOOEvent("2022-01-05T00:00:00-05:00", "2022-01-08T00:00:00-05:00"),
            ])).toEqual(...weekDates.weekdaysForOneWeek)
        })

        it("returns days off for two week-long OOO events", () => {
            expect(script.eventsToDays([
                events.OOOEvent("2022-01-01T00:00:00-05:00", "2022-01-08T00:00:00-05:00"),
                events.OOOEvent("2022-01-10T00:00:00-05:00", "2022-01-17T00:00:00-05:00"),
            ])).toEqual(weekDates.weekdaysForTwoWeeks.flat())
        })
    })
    describe("getWeeks", () => {

        describe("no input", () => {
            beforeAll(() => {
                jest.useFakeTimers('modern');
                jest.setSystemTime(new Date('2022-01-01'));
            });
            
            afterAll(() => {
                jest.useRealTimers();
            });
    
            it("returns correct dates for year of 2022", () => {
                expect(script.getWeeks()).toEqual(weekDates.weekdaysFor2022)
            })
        })

        describe("one week", () => {
            it("returns correct dates given start day of Monday and end day of Friday", () => {
                const startDate = new Date('2022-01-03')
                const endDate = new Date('2022-01-07')
        
                expect(script.getWeeks(startDate, endDate)).toEqual(weekDates.weekdaysForOneWeek)
            })
    
            it("returns correct dates given start day of Monday and end day of Saturday", () => {
                const startDate = new Date('2022-01-01')
                const endDate = new Date('2022-01-08')
        
                expect(script.getWeeks(startDate, endDate)).toEqual(weekDates.weekdaysForOneWeek)
            })
        
            it("returns correct dates given start day of Monday and end day of Sunday", () => {
                const startDate = new Date('2022-01-03')
                const endDate = new Date('2022-01-09')
        
                expect(script.getWeeks(startDate, endDate)).toEqual(weekDates.weekdaysForOneWeek)
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
        
                expect(script.getWeeks(startDate, endDate)).toEqual(weekDates.weekdaysForTwoWeeks)
            })
        
            it("returns correct dates given start date of Monday and end date of Saturday", () => {
                const startDate = new Date('2022-01-03')
                const endDate = new Date('2022-01-15')
        
                expect(script.getWeeks(startDate, endDate)).toEqual(weekDates.weekdaysForTwoWeeks)
            })
        
            it("returns correct dates given start date of Monday and end date of Sunday", () => {
                const startDate = new Date('2022-01-03')
                const endDate = new Date('2022-01-16')
        
                expect(script.getWeeks(startDate, endDate)).toEqual(weekDates.weekdaysForTwoWeeks)
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
        it("returns schedule with no overlapping OOO", () => {
            const expectedDaysOff = events.calendarListResponses()[1]
            const ooo = {
                "taylor.swift": expectedDaysOff,
                "nicki.minaj": expectedDaysOff,
                "ariana.grande": expectedDaysOff,
                "hayley.kiyoko": expectedDaysOff
            }
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
    })


    describe("deleteEvents", () => {
        it("calls Calendar.Events.remove with single id", () => {
            const removeCall = jest.spyOn(google.Calendar.Events, 'remove')
            const id = Chance().guid()
            script.deleteEvents([id])
            
            expect(removeCall).toHaveBeenCalledWith("", id)
        })

        it("calls Calendar.Events.remove with multiple ids", () => {
            const removeCall = jest.spyOn(google.Calendar.Events, 'remove')
            const ids = new Array(5).fill(null).map(()=> (Chance().guid()))
            script.deleteEvents(ids)

            ids.forEach(id => expect(removeCall).toHaveBeenCalledWith("", id))
        })

        it("does not call Calendar.Events.remove for no ids", () => {
            const removeCall = jest.spyOn(google.Calendar.Events, 'remove')

            script.deleteEvents([])
            
            expect(removeCall).not.toHaveBeenCalled()
        })
    })
})