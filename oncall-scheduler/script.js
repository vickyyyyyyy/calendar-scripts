function getNumberOfDays(start, end) {
    const firstDate = new Date(start);
    const secondDate = new Date(end);

    const oneDayInMs = 1000 * 60 * 60 * 24;
    const diffInTime = secondDate.getTime() - firstDate.getTime();
    const diffInDays = Math.round(diffInTime / oneDayInMs);

    return diffInDays;
}

function weekday(date) {
    const day = date.getDay()
    if (day > 0 && day < 6) {
        return day
    }

    return false
}

function eventsToDays(events) {
    const daysOff = []

    for (var event of events) {
        const start = new Date(Date.parse(event.start.dateTime))
        start.setHours(0,0,0,0)
        const end = new Date(Date.parse(event.end.dateTime))
        end.setHours(0,0,0,0)
        
        const numDaysOff = getNumberOfDays(start, end)

        // if this is a single OOO no need to loop
        if (numDaysOff === 1) {
            if (weekday(start)) {
                daysOff.push(start)
            }
        } else {
            
            for (start; start < end; start.setDate(start.getDate() + 1)) {
                if (weekday(start)) {
                    daysOff.push(new Date(start))
                }
            }
        }
    }

    return daysOff
    
}

function getWeeks(start = new Date(), end = new Date(new Date().getFullYear(), 11, 31)) { 
    const weeks = []
    var week = []

    // make this inclusive
    end.setDate(end.getDate() + 1)

    // loop through days
    for (var d = start; d < end; d.setDate(d.getDate() + 1)) {
        const day = weekday(d)
        if (day) {
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
    getWeeks,
    eventsToDays
}