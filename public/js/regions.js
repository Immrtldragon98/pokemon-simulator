export const regions = [
    {
        name: "Kanto",
        unlocked: true,
        gyms: [
            { name: "Brock", badge: "Boulder Badge", team: ["Golem", "Steelix", "Tyranitar"], defeated: false },
            { name: "Misty", badge: "Cascade Badge", team: ["Starmie", "Gyarados", "Lapras"], defeated: false }
        ],
        eliteFour: ["Charizard", "Blastoise", "Venusaur", "Tyranitar", "Gyarados", "Garchomp"]
    },
    {
        name: "Johto",
        unlocked: false,
        gyms: [
            { name: "Falkner", badge: "Zephyr Badge", team: ["Pikachu", "Charizard", "Gyarados"], defeated: false },
            { name: "Bugsy", badge: "Hive Badge", team: ["Venusaur", "Sceptile", "Tyranitar"], defeated: false }
        ],
        eliteFour: ["Steelix", "Tyranitar", "Metagross", "Garchomp", "Charizard", "Blaziken"]
    },
    {
        name: "Hoenn",
        unlocked: false,
        gyms: [
            { name: "Roark", badge: "Stone Badge", team: ["Golem", "Steelix", "Tyranitar"], defeated: false },
            { name: "Brawly", badge: "Knuckle Badge", team: ["Lucario", "Blaziken", "Tyranitar"], defeated: false }
        ],
        eliteFour: ["Sceptile", "Blaziken", "Swampert", "Metagross", "Garchomp", "Tyranitar"]
    },
    {
        name: "Sinnoh",
        unlocked: false,
        gyms: [
            { name: "Byron", badge: "Mine Badge", team: ["Steelix", "Metagross", "Golem"], defeated: false },
            { name: "Candice", badge: "Icicle Badge", team: ["Lapras", "Starmie", "Gyarados"], defeated: false }
        ],
        eliteFour: ["Infernape", "Electivire", "Lucario", "Garchomp", "Dragonite", "Mega Gengar"]
    }
];
