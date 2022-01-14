const { eventsToDays, getWeeks } = require("./script")
const weekDates = require("./__fixtures__/weekDates")
const events = require("./__fixtures__/events")

describe("script", () => {
    describe("eventsToDays", () => {
        it("returns single day off for a Monday to Tuesday OOO event", () => {
            expect(eventsToDays([
                events.OOOEvent()
            ])).toEqual([
                new Date(2022, 0, 17)
            ])
        })

        it("returns two days off for a Monday to Wednesday OOO event", () => {
            expect(eventsToDays([
                events.OOOEvent("2022-01-17T00:00:00-05:00", "2022-01-19T00:00:00-05:00"),
            ])).toEqual([
                new Date(2022, 0, 17),
                new Date(2022, 0, 18)
            ])
        })

        it("returns three days off for a Monday to Thursday OOO event", () => {
            expect(eventsToDays([
                events.OOOEvent("2022-01-17T00:00:00-05:00", "2022-01-20T00:00:00-05:00"),
            ])).toEqual([
                new Date(2022, 0, 17),
                new Date(2022, 0, 18),
                new Date(2022, 0, 19)
            ])
        })

        it("returns five days off for a Monday to Saturday OOO event", () => {
            expect(eventsToDays([
                events.OOOEvent("2022-01-03T00:00:00-05:00", "2022-01-08T00:00:00-05:00"),
            ])).toEqual(...weekDates.weekdaysForOneWeek)
        })

        it("returns five days off for a Monday to Sunday OOO event", () => {
            expect(eventsToDays([
                events.OOOEvent("2022-01-03T00:00:00-05:00", "2022-01-09T00:00:00-05:00"),
            ])).toEqual(...weekDates.weekdaysForOneWeek)
        })

        it("returns five days off for a Monday to Monday OOO event", () => {
            expect(eventsToDays([
                events.OOOEvent("2022-01-03T00:00:00-05:00", "2022-01-10T00:00:00-05:00"),
            ])).toEqual(...weekDates.weekdaysForOneWeek)
        })

        it("does not return days off for a Saturday to Sunday OOO event", () => {
            expect(eventsToDays([
                events.OOOEvent("2022-01-01T00:00:00-05:00", "2022-01-02T00:00:00-05:00"),
            ])).toEqual([])
        })

        it("does not return days off for a Saturday to Monday OOO event", () => {
            expect(eventsToDays([
                events.OOOEvent("2022-01-01T00:00:00-05:00", "2022-01-03T00:00:00-05:00"),
            ])).toEqual([])
        })

        it("returns days off for two midweek OOO events", () => {
            expect(eventsToDays([
                events.OOOEvent("2022-01-03T00:00:00-05:00", "2022-01-05T00:00:00-05:00"),
                events.OOOEvent("2022-01-05T00:00:00-05:00", "2022-01-08T00:00:00-05:00"),
            ])).toEqual(...weekDates.weekdaysForOneWeek)
        })

        it("returns days off for two week-long OOO events", () => {
            expect(eventsToDays([
                events.OOOEvent("2022-01-01T00:00:00-05:00", "2022-01-08T00:00:00-05:00"),
                events.OOOEvent("2022-01-10T00:00:00-05:00", "2022-01-17T00:00:00-05:00"),
            ])).toEqual(weekDates.weekdaysForTwoWeeks.flat())
        })
    })
    describe("getWeeks", () => {

        describe("no input", () => {
            beforeAll(() => {
                jest.useFakeTimers('modern');
                jest.setSystemTime(new Date(2022, 0, 1));
            });
            
            afterAll(() => {
                jest.useRealTimers();
            });
    
            it("returns correct dates for year of 2022", () => {
                expect(getWeeks()).toEqual(weekDates.weekdaysFor2022)
            })
        })

        describe("one week", () => {
            it("returns correct dates given start day of Monday and end day of Friday", () => {
                const startDate = new Date(2022, 0, 3)
                const endDate = new Date(2022, 0, 7)
        
                expect(getWeeks(startDate, endDate)).toEqual(weekDates.weekdaysForOneWeek)
            })
    
            it("returns correct dates given start day of Monday and end day of Saturday", () => {
                const startDate = new Date(2022, 0, 3)
                const endDate = new Date(2022, 0, 8)
        
                expect(getWeeks(startDate, endDate)).toEqual(weekDates.weekdaysForOneWeek)
            })
        
            it("returns correct dates given start day of Monday and end day of Sunday", () => {
                const startDate = new Date(2022, 0, 3)
                const endDate = new Date(2022, 0, 9)
        
                expect(getWeeks(startDate, endDate)).toEqual(weekDates.weekdaysForOneWeek)
            })
    
            it("returns correct dates given start day of Monday and end day of Wednesday", () => {
                const startDate = new Date(2022, 0, 10)
                const endDate = new Date(2022, 0, 12)
        
                expect(getWeeks(startDate, endDate)).toEqual(weekDates.weekdaysFromStartToMidForOneWeek)
            })

            it("returns correct dates given start day of Wednesday and end day of Friday", () => {
                const startDate = new Date(2022, 0, 12)
                const endDate = new Date(2022, 0, 14)
        
                expect(getWeeks(startDate, endDate)).toEqual(weekDates.weekdaysFromMidToEndForOneWeek)
            })

            it("returns correct dates given start day of Wednesday and end day of Saturday", () => {
                const startDate = new Date(2022, 0, 12)
                const endDate = new Date(2022, 0, 15)
        
                expect(getWeeks(startDate, endDate)).toEqual(weekDates.weekdaysFromMidToEndForOneWeek)
            })

            it("returns correct dates given start day of Wednesday and end day of Sunday", () => {
                const startDate = new Date(2022, 0, 12)
                const endDate = new Date(2022, 0, 16)
        
                expect(getWeeks(startDate, endDate)).toEqual(weekDates.weekdaysFromMidToEndForOneWeek)
            })
        })

        describe("two weeks", () => {
            it("returns correct dates given start date of Monday and end date of Friday", () => {
                const startDate = new Date(2022, 0, 3)
                const endDate = new Date(2022, 0, 14)
        
                expect(getWeeks(startDate, endDate)).toEqual(weekDates.weekdaysForTwoWeeks)
            })
        
            it("returns correct dates given start date of Monday and end date of Saturday", () => {
                const startDate = new Date(2022, 0, 3)
                const endDate = new Date(2022, 0, 15)
        
                expect(getWeeks(startDate, endDate)).toEqual(weekDates.weekdaysForTwoWeeks)
            })
        
            it("returns correct dates given start date of Monday and end date of Sunday", () => {
                const startDate = new Date(2022, 0, 3)
                const endDate = new Date(2022, 0, 16)
        
                expect(getWeeks(startDate, endDate)).toEqual(weekDates.weekdaysForTwoWeeks)
            })

            it("returns correct dates given start date of Monday and end date of Wednesday", () => {
                const startDate = new Date(2022, 0, 3)
                const endDate = new Date(2022, 0, 12)
        
                expect(getWeeks(startDate, endDate)).toEqual(weekDates.weekdaysFromStartToMidForTwoWeeks)
            })

            it("returns correct dates given start date of Wednesday and end date of Friday", () => {
                const startDate = new Date(2022, 0, 5)
                const endDate = new Date(2022, 0, 14)
        
                expect(getWeeks(startDate, endDate)).toEqual(weekDates.weekdaysFromMidToEndForTwoWeeks)
            })

            it("returns correct dates given start date of Wednesday and end date of Saturday", () => {
                const startDate = new Date(2022, 0, 5)
                const endDate = new Date(2022, 0, 15)
        
                expect(getWeeks(startDate, endDate)).toEqual(weekDates.weekdaysFromMidToEndForTwoWeeks)
            })

            it("returns correct dates given start date of Wednesday and end date of Sunday", () => {
                const startDate = new Date(2022, 0, 5)
                const endDate = new Date(2022, 0, 16)
        
                expect(getWeeks(startDate, endDate)).toEqual(weekDates.weekdaysFromMidToEndForTwoWeeks)
            })

            it("returns correct dates given start date of Wednesday and end date of Wednesday", () => {
                const startDate = new Date(2022, 0, 5)
                const endDate = new Date(2022, 0, 12)
        
                expect(getWeeks(startDate, endDate)).toEqual(weekDates.weekdaysFromMidToMidForTwoWeeks)
            })
        })
    })
})