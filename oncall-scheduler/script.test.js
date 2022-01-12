const { getWeeks } = require("./script")

describe("script", () => {
    it("getWeeks returns", () => {
        expect(getWeeks()).toBeDefined()
    })
})