const USERNAMES = [
    "taylor.swift",
    "nicki.minaj",
]

const users = USERNAMES.map((username) => ({
    toString: () => null,
    getUsername: () => username,
    getUserLoginId: () => null,
    getEmail: () => null
}))

const ScriptApp = {
    getProjectTriggers: () => [],
    newTrigger: () => ({
        timeBased: () => ({
            everyHours: () => ({
                create: () => null
            })
        })
    })
}

const GroupsApp = {
    getGroupByEmail: () => ({
        getUsers: () => users
    })
}

const PropertiesService = {
    getScriptProperties: () => ({
        getProperty: () => new Date()
    })
}

const Calendar = {
    Events: {
        list: () => [],
        import: () => null,
        remove: () => null,
        insert: () => null
    }
}

module.exports = {
    users,
    ScriptApp,
    GroupsApp,
    PropertiesService,
    Calendar
}