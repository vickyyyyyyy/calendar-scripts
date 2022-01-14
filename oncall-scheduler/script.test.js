const { getWeeks } = require("./script")
const weekDates = require("./__fixtures__/weekDates")

describe("script", () => {
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