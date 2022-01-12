function getWeeks(start = new Date(), end = new Date(2022, 11, 31)) { 
    const weeks = []
    var week = []

    // loop through days
    for (var d = start; d < end; d.setDate(d.getDate() + 1)) {
        // if the day is a week day
        const day = d.getDay()
        if (day > 0 && day < 6) {
            var date = d
            date.setHours(0,0,0,0)

            week.push(new Date(date))

            // chunk week days for Mon to Fri
            if (day === 5) {
                weeks.push(week)
                week = []
            }
        }
    }

    if (week.length > 0) {
        weeks.push(week)
    }

    return weeks
}

module.exports = {
    getWeeks
}