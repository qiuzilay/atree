"use strict";

/** @global */
const atree = {
    "archer": {},
    "warrior": {
        "Bash": {
            "name": "Bash",
            "import": null,
            "export": ["Spear Proficiency I"],
            "block": null,
            "required": null,
            "cost": 1,
            "archetype": null,
            "display": {
                "name": "Bash",
                "combo": "RLR",
                "icon": "button_warrior",
                "row": 1,
                "col": 4
            },
            "draft": ["S"]
        },
        "Spear Proficiency I": {
            "name": "Spear Proficiency I",
            "import": ["Bash"],
            "export": ["Double Bash", "Cheaper Bash I"],
            "block": null,
            "required": null,
            "cost": 1,
            "archetype": null,
            "display": {
                "name": "Spear Proficiency I",
                "icon": "button_1",
                "row": 3,
                "col": 4
            },
            "draft": ["N", "S", "W"]
        },
        "Cheaper Bash I": {
            "name": "Cheaper Bash I",
            "import": ["Spear Proficiency I"],
            "export": null,
            "block": null,
            "required": null,
            "cost": 1,
            "archetype": null,
            "display": {
                "name": "Cheaper Bash",
                "icon": "button_1",
                "row": 3,
                "col": 2
            },
            "draft": ["E"]
        },
        "Double Bash": {
            "name": "Double Bash",
            "import": ["Spear Proficiency I"],
            "export": ["Charge"],
            "block": null,
            "required": null,
            "cost": 1,
            "archetype": null,
            "display": {
                "name": "Double Bash",
                "icon": "button_2",
                "row": 5,
                "col": 4
            },
            "draft": ["N", "S"]
        },
        "Charge": {
            "name": "Charge",
            "import": ["Double Bash"],
            "export": ["Vehement", "Tougher Skin"],
            "block": null,
            "required": null,
            "cost": 1,
            "archetype": null,
            "display": {
                "name": "Charge",
                "combo": "RRR",
                "icon": "button_warrior",
                "row": 7,
                "col": 4
            },
            "draft": ["N", "E", "W"]
        },
        "Vehement": {
            "name": "Vehement",
            "import": ["Charge"],
            "export": ["Uppercut"],
            "block": ["Tougher Skin"],
            "required": null,
            "cost": 1,
            "archetype": {
                "name": "Fallen",
                "req": 0
            },
            "display": {
                "name": "Vehement",
                "icon": "button_1",
                "row": 7,
                "col": 2
            },
            "draft": ["E", "S"]
        },
        "Tougher Skin": {
            "name": "Tougher Skin",
            "import": ["Charge"],
            "export": ["War Scream"],
            "block": ["Vehement"],
            "required": null,
            "cost": 1,
            "archetype": {
                "name": "Paladin",
                "req": 0
            },
            "display": {
                "name": "Tougher Skin",
                "icon": "button_1",
                "row": 7,
                "col": 6
            },
            "draft": ["W", "S"]
        },
        "Uppercut": {
            "name": "Uppercut",
            "import": ["Cheaper Charge", "Vehement"],
            "export": ["Cheaper Charge", "Heavy Impact", "Earth Mastery", "Thunder Mastery"],
            "blocks": null,
            "required": null,
            "cost": 1,
            "archetype": null,
            "display": {
                "name": "Uppercut",
                "combo": "RLL",
                "icon": "button_warrior",
                "row": 9,
                "col": 2
            },
            "draft": ["N", "SSS", "E", "WWSSS"]
        },
        "Cheaper Charge": {
            "name": "Cheaper Charge",
            "import": ["Uppercut", "War Scream"],
            "export": ["Uppercut", "War Scream", "Thunder Mastery", "Air Mastery", "Water Mastery"],
            "blocks": null,
            "required": null,
            "cost": 1,
            "archetype": null,
            "display": {
                "name": "Cheaper Charge",
                "icon": "button_1",
                "row": 9,
                "col": 4
            },
            "draft": ["SSSSE", "SSSSW", "E", "W"],
        },
        "War Scream": {
            "name": "War Scream",
            "import": ["Cheaper Charge", "Tougher Skin"],
            "export": ["Cheaper Charge", "Air Mastery", "Fire Mastery"],
            "blocks": null,
            "required": null,
            "cost": 1,
            "archetype": null,
            "display": {
                "name": "War Scream",
                "combo": "RRL",
                "icon": "button_warrior",
                "row": 9,
                "col": 6
            },
            "draft": ["N", "SSS", "EESSS", "W"],
        },
        "Heavy Impact": {
            "name": "Heavy Impact",
            "import": ["Uppercut"],
            "export": null,
            "blocks": null,
            "required": null,
            "cost": 1,
            "archetype": null,
            "display": {
                "name": "Heavy Impact",
                "icon": "button_2",
                "row": 10,
                "col": 1
            },
            "draft": ["N"],
        },
        "Earth Mastery": {
            "name": "Earth Mastery",
            "import": ["Uppercut"],
            "export": ["Quadruple Bash"],
            "blocks": null,
            "required": null,
            "cost": 1,
            "archetype": {
                "name": "Fallen",
                "req": 0
            },
            "display": {
                "name": "Earth Mastery",
                "icon": "button_1",
                "row": 13,
                "col": 0
            },
            "draft": ["NNNNE", "S"],
        },
        "Thunder Mastery": {
            "name": "Thunder Mastery",
            "import": ["Cheaper Charge", "Air Mastery", "Uppercut"],
            "export": ["Fireworks", "Air Mastery", "Water Mastery"],
            "blocks": null,
            "required": null,
            "cost": 1,
            "archetype": {
                "name": "Fallen",
                "req": 0
            },
            "display": {
                "name": "Thunder Mastery",
                "icon": "button_1",
                "row": 13,
                "col": 2
            },
            "draft": ["NNN", "S", "EEE", "EENNN"],
        },
        "Air Mastery": {
            "name": "Air Mastery",
            "import": ["Cheaper Charge", "Thunder Mastery", "War Scream"],
            "export": ["Flyby Jab", "Thunder Mastery", "Water Mastery"],
            "blocks": null,
            "required": null,
            "cost": 1,
            "archetype": {
                "name": "Battle Monk",
                "req": 0
            },
            "display": {
                "name": "Air Mastery",
                "icon": "button_1",
                "row": 13,
                "col": 6
            },
            "draft": ["NNN", "S", "WWW", "WWNNN"],
        },
        "Fire Mastery": {
            "name": "Fire Mastery",
            "import": ["War Scream"],
            "export": ["Flaming Uppercut"],
            "blocks": null,
            "required": null,
            "cost": 1,
            "archetype": {
                "name": "Paladin",
                "req": 0
            },
            "display": {
                "name": "Fire Mastery",
                "icon": "button_1",
                "row": 13,
                "col": 8
            },
            "draft": ["NNNNW", "S"],
        },
        "Water Mastery": {
            "name": "Water Mastery",
            "import": ["Cheaper Charge", "Thunder Mastery", "Air Mastery"],
            "export": ["Half-Moon Swipe"],
            "blocks": null,
            "required": null,
            "cost": 1,
            "archetype": {
                "name": "Battle Monk",
                "req": 0
            },
            "display": {
                "name": "Water Mastery",
                "icon": "button_1",
                "row": 14,
                "col": 4
            },
            "draft": ["NNNN", "NE", "NW", "S"],
        },
        "Quadruple Bash": {
            "name": "Quadruple Bash",
            "import": ["Earth Mastery", "Fireworks"],
            "export": ["Bak'al's Grasp", "Fireworks"],
            "blocks": null,
            "required": "Bash",
            "cost": 2,
            "archetype": {
                "name": "Fallen",
                "req": 0
            },
            "display": {
                "name": "Quadruple Bash",
                "icon": "button_2",
                "row": 15,
                "col": 0
            },
            "draft": ["N", "ESSSS"],
        },
        "Fireworks": {
            "name": "Fireworks",
            "import": ["Thunder Mastery", "Quadruple Bash"],
            "export": ["Bak'al's Grasp", "Quadruple Bash"],
            "blocks": null,
            "required": null,
            "cost": 2,
            "archetype": {
                "name": "Fallen",
                "req": 0
            },
            "display": {
                "name": "Fireworks",
                "icon": "button_2",
                "row": 15,
                "col": 2
            },
            "draft": ["N", "WSSSS"],
        },
        "Flyby Jab": {
            "name": "Flyby Jab",
            "import": ["Air Mastery", "Flaming Uppercut"],
            "export": ["Iron Lungs", "Flaming Uppercut"],
            "blocks": null,
            "required": null,
            "cost": 1,
            "archetype": null,
            "display": {
                "name": "Flyby Jab",
                "icon": "button_1",
                "row": 15,
                "col": 6
            },
            "draft": ["N", "E"],
        },
        "Flaming Uppercut": {
            "name": "Flaming Uppercut",
            "import": ["Fire Mastery", "Flyby Jab"],
            "export": ["Iron Lungs", "Flyby Jab"],
            "blocks": null,
            "required": null,
            "cost": 2,
            "archetype": null,
            "display": {
                "name": "Flaming Uppercut",
                "icon": "button_2",
                "row": 15,
                "col": 8
            },
            "draft": ["N", "W"],
        },
        "Half-Moon Swipe": {
            "name": "Half-Moon Swipe",
            "import": ["Water Mastery"],
            "export": ["Air Shout"],
            "blocks": null,
            "required": "Uppercut",
            "cost": 2,
            "archetype": {
                "name": "Battle Monk",
                "req": 1
            },
            "display": {
                "name": "Half-Moon Swipe",
                "icon": "button_2",
                "row": 16,
                "col": 4
            },
            "draft": ["N", "SS"],
        },
        "Iron Lungs": {
            "name": "Iron Lungs",
            "import": ["Flyby Jab", "Flaming Uppercut"],
            "export": ["Mantle of the Bovemists"],
            "blocks": null,
            "required": "War Scream",
            "cost": 1,
            "archetype": {
                "name": "Paladin",
                "req": 0
            },
            "display": {
                "name": "Iron Lungs",
                "icon": "button_1",
                "row": 16,
                "col": 7
            },
            "draft": ["N", "SS"],
        },
        "Generalist": {
            "name": "Generalist",
            "import": ["Air Shout"],
            "export": null,
            "blocks": null,
            "required": null,
            "cost": 2,
            "archetype": {
                "name": "Battle Monk",
                "req": 3
            },
            "display": {
                "name": "Generalist",
                "icon": "button_4",
                "row": 19,
                "col": 2
            },
            "draft": ["E"],
        },
        "Air Shout": {
            "name": "Air Shout",
            "import": ["Half-Moon Swipe"],
            "export": ["Generalist", "Cheaper Uppercut I"],
            "blocks": null,
            "required": "War Scream",
            "cost": 2,
            "archetype": {
                "name": "Battle Monk",
                "req": 0
            },
            "display": {
                "name": "Air Shout",
                "icon": "button_2",
                "row": 19,
                "col": 4
            },
            "draft": ["NN", "W", "WS"],
        },
        "Mantle of the Bovemists": {
            "name": "Mantle of the Bovemists",
            "import": ["Iron Lungs"],
            "export": ["Provoke"],
            "blocks": null,
            "required": "War Scream",
            "cost": 2,
            "archetype": {
                "name": "Paladin",
                "req": 3
            },
            "display": {
                "name": "Mantle of the Bovemists",
                "icon": "button_4",
                "row": 19,
                "col": 7
            },
            "draft": ["NN", "S"],
        },
        "Bak'al's Grasp": {
            "name": "Bak'al's Grasp",
            "import": ["Quadruple Bash", "Fireworks"],
            "export": ["Spear Proficiency II"],
            "blocks": null,
            "required": "War Scream",
            "cost": 2,
            "archetype": {
                "name": "Fallen",
                "req": 2
            },
            "display": {
                "name": "Bak'al's Grasp",
                "icon": "button_4",
                "row": 20,
                "col": 1
            },
            "draft": ["NNNNN", "W"],
        }
    },
    "mage": {},
    "assassin": {},
    "shaman": {}
};