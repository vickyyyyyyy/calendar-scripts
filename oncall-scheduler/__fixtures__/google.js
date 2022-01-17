const USERNAMES = [
    "taylor.swift"
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
        import: () => null
    }
}

module.exports = {
    users,
    ScriptApp,
    GroupsApp,
    PropertiesService,
    Calendar
}