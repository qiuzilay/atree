"use strict";

/** @global */
const languages = ["zh-TW", "en"];
/** @global */
let using = 0;

/**
 * @global
 * @typedef  { "en" | "zh-TW" }           LANGUAGES
 * @typedef  { "N" | "S" | "E" | "W" }    DIRECTION
 * @typedef  { NODE | PIPE }              COMPONENT
 * @typedef  { "enable" | "disable" | "standby" | "lock" }              STATES
 * @typedef  { "archer" | "warrior" | "mage" | "assassin" | "shaman" }  CLASSES
 * @typedef  { "Boltslinger" | "Sharpshooter" | "Trapper" | "Fallen" | "Battle Monk" | "Paladin" | "Riftwalker" | "Light Bender" | "Arcanist" | "Shadestepper" | "Trickster" | "Acrobat" | "Summoner" | "Ritualist" | "Acolyte" }   ARCHETYPES
 **/
/** @global */
function main() {
    Action.register();
    document.addEventListener('DOMContentLoaded', () => {
        console.info('routemap:', routemap);
        console.info('routelogs:', routelogs);
        console.info('routedata:', routedata);
        console.info('using:', languages[using]);
    });
}
/** @global */
function generateElement(stringHTML) {
    const fragment = document.createDocumentFragment();
    const block = document.createElement('div');
    block.innerHTML = stringHTML;
    for (const child of block.childNodes) fragment.appendChild(child);
    return fragment;
}

/** @global */
class Action {

    static register() {

        document.getElementById('lang-config')
                .addEventListener('change', EventHandler.changeLangEvent);

        Object.values(TABELEMENTS).forEach((tab) => {
            tab.addEventListener('click', EventHandler.tabInteractEvent);
        });

        return this;
    }

    /** @param {CLASSES} clsname */
    static buildTree(clsname) {

        const dataset = atree[clsname];
        const tree = routemap[clsname];

        for (const data of Object.values(dataset)) {
            console.groupCollapsed(`<${data.name}>`);

            const node = new NODE(clsname, data);
            const row = data.display.row;
            const col = data.display.col;
            
            tree[row]?.splice(col, 1, node) ?? (tree[row] = Tree.newline(col, 1, node));

            console.groupEnd();
        }

        for (let row = tree.length; tree.length % 6; row++)
            tree[row] = Tree.newline();

        return this;

    }

    /** @param {CLASSES} clsname */
    static renderTree(clsname) {
        const page = document.querySelector(`div#main div#${clsname}.page`);

        /* ------ render footer ------ */ {
            const table = page.querySelector(`.frame.foot table`);
            const fragment = document.createDocumentFragment();
            const atypes = Object.values(routedata[clsname].archetype);
            const orb = routedata[clsname].cost;
            
            for (let row = 0; row < 4; row++) {
                const tr = document.createElement('tr');
                for (let col = 0; col < 9; col++) {
                    const td = document.createElement('td');
                    td.oncontextmenu = (event) => false;
                    switch (str([row, col])) {
                        case '[0,3]': {
                            td.appendChild(generateElement(`<span class="misc-arrow_up"></span>`));
                            break;
                        }
                        case '[0,5]': {
                            td.appendChild(generateElement(`<span class="misc-arrow_down"></span>`));
                            break;
                        }
                        case '[0,4]': {
                            orb.parentElement = td;
                            td.appendChild(orb.html);
                            td.addEventListener('click', EventHandler.orbInteractEvent);
                            td.addEventListener('touchstart', EventHandler.orbTouchStartEvent);
                            td.addEventListener('touchend', EventHandler.orbTouchEndEvent);
                            td.addEventListener('mouseenter', EventHandler.nodeHoverEvent);
                            td.addEventListener('mouseleave', EventHandler.nodeUnhoverEvent);
                            break;
                        }
                        case '[2,2]':
                        case '[2,4]':
                        case '[2,6]': {
                            const atype = atypes.shift();
                            atype.parentElement = td;
                            td.appendChild(atype.html);
                            td.addEventListener('mouseenter', EventHandler.nodeHoverEvent);
                            td.addEventListener('mouseleave', EventHandler.nodeUnhoverEvent);
                            break;
                        }
                    }
                    tr.appendChild(td);
                }
                fragment.appendChild(tr);
            }

            table.replaceChildren(fragment);
        }

        /* ------ render body ------ */ {
            const table = page.querySelector(`.frame.body table`);
            const fragment = document.createDocumentFragment();
            const tree = routemap[clsname];

            for (const row of tree) {
                const tr = document.createElement('tr');
                for (const elem of row) {
                    const td = document.createElement('td');
                    // td.oncontextmenu = (event) => false;
                    if (elem instanceof UNIT) switch (true) {

                        case elem instanceof NODE:
                            elem.parentElement = td;
                            td.addEventListener('click', EventHandler.nodeInteractEvent);
                            td.addEventListener('mouseenter', EventHandler.nodeHoverEvent);
                            td.addEventListener('mouseleave', EventHandler.nodeUnhoverEvent);

                        default:
                            td.appendChild(elem.html);

                    }
                    tr.appendChild(td);
                }
                fragment.appendChild(tr);
            }

            table.replaceChildren(fragment);
        }

        return this;
    }

    /** @param {CLASSES} clsname */
    static resetTree(clsname) {
        console.warn(`reset ${clsname}!`);
    }

    /** @param {CLASSES} clsname */
    static encodeTree(clsname) {
        const tree = routemap[clsname];
        const url = new URL(window.location.origin);
        url.search = new URLSearchParams({
            lang: languages[using],
            class: clsname,
            version: '1.0.0'
        });
        url.hash = tree.encode();
        console.info(window.location);
        console.info(url);
        console.info(`URL: ${url.toString()}`);
        navigator.clipboard.writeText(url);

    }

}

/** @global */
class EventHandler {
    static #timeoutID = null;

    /** @param {Event} event*/
    static tabInteractEvent(event) {
        const/** @type {HTMLButtonElement} */tab = event.target;
        Action.buildTree(tab.dataset.class);
        Action.renderTree(tab.dataset.class);
        tab.removeEventListener('click', EventHandler.tabInteractEvent);
    }

    /** @param {Event} event*/
    static nodeInteractEvent(event) {

        if (event.target !== event.currentTarget) return;

        /** @type {HTMLTableCellElement} */
        const target = event.target;
        const axis = {
            x: target.cellIndex,
            y: target.parentNode.rowIndex
        };
        
        routemap[page][axis.y][axis.x].click();

    }

    /** @param {Event} event */
    static orbInteractEvent(event) {
        const /** @type {Orb} */ orb = routedata[page].cost;
        if (orb.confirming || event.shiftKey) EventHandler.resetTreeEvent(event);
        else Action.encodeTree(page);
    }

    /** @param {Event} event */
    static orbTouchStartEvent(event) {
        EventHandler.#timeoutID = setTimeout(EventHandler.resetTreeEvent, 1000, event);
    }

    /** @param {Event} event */
    static orbTouchEndEvent(event) {
        clearTimeout(EventHandler.#timeoutID);
    }

    /** @param {Event} event */
    static resetTreeEvent(event) {
        const /** @type {HTMLTableCellElement} */ td = event.target;
        const /** @type {Orb} */ orb = routedata[page].cost;

        if (!orb.confirming) return orb.confirm();

        orb.restore();
        Action.resetTree(page);
    }

    /** @param {Event} event*/
    static changeLangEvent(event) {
        using = parseInt(event.target.value);
        
        // re-mapping ability tree main body
        for (const clsmap of Object.values(routemap)) {
            for (const row of clsmap) {
                for (const node of row) {
                    if ((node instanceof NODE)) node.parentElement?.replaceChildren(node.html);
                }
            }
        }

        // archetypes & orbs
        for (const clsdata of Object.values(routedata)) {
            // clsdata.cost.parentElement?.replaceChildren(clsdata.cost.html);
            clsdata.cost.refresh();
            for (const atype of Object.values(clsdata.archetype)) {
                atype.parentElement?.replaceChildren(atype.html);
            }
        }

        // tab buttons
        for (const button of Object.values(TABELEMENTS)) {
            button.textContent = dict[languages[using]][button.dataset.class];
        }

    }

    /** @param {Event} event */
    static nodeHoverEvent(event) {
        /** @type {HTMLSpanElement} */
        const tooltip = event.target.querySelector('span.tooltip');
        if (tooltip) {
            const rect = tooltip.getBoundingClientRect();
            const width = document.documentElement.clientWidth || window.innerWidth || document.body.clientWidth;
            /* console.info(
                `window.innerWidth: ${window.innerWidth}\n` +
                `documentElement.clientWidth: ${document.documentElement.clientWidth}\n` +
                `body.clientWidth: ${document.body.clientWidth}`,
                rect
            ); */
            if (rect.right > width) tooltip.classList.add('reverse');
        }
    }

    /** @param {Event} event */
    static nodeUnhoverEvent(event) {
        /** @type {HTMLSpanElement} */
        const tooltip = event.target.querySelector('span.tooltip');
        tooltip.classList.remove('reverse');
    }

}

/* -------------------------------- */

/** @global */
var route = 0;
/** @global */
const str = JSON.stringify;
/**
 * @global
 * @function
 * @template T
 * @param {T[]} arr
 * @return {T[]}
 **/
const unique = (arr) => Array.from(new Set(arr));
/**
 * @global
 * @function
 * @template T
 * @param {T[]} arr
 * @return {T}
 **/
const random = (arr) => arr[Math.floor(Math.random() * arr.length)];
/** @global */
const audio = {
    high: new SoundEffect('end_portal_high.wav'),
    medium: new SoundEffect('end_portal_medium.wav'),
    low: new SoundEffect('end_portal_low.wav'),
    levelup: new SoundEffect('levelup.wav')
};
/** @global */
const routedata = {
    archer: {
        cost: new Orb('archer'),
        /** @type {Object<string, Set<NODE>>} */block: {},
        /** @type {Object<string, Set<NODE>>} */required: {},
        archetype: {
            "Boltslinger": new Archetype('Boltslinger', 'archer'),
            "Trapper": new Archetype('Trapper', 'archer'),
            "Sharpshooter": new Archetype('Sharpshooter', 'archer')
        }
    },
    warrior: {
        cost: new Orb('warrior'),
        /** @type {Object<string, Set<NODE>>} */block: {},
        /** @type {Object<string, Set<NODE>>} */required: {},
        archetype: {
            "Fallen": new Archetype('Fallen', 'warrior'),
            "Battle Monk": new Archetype('Battle Monk', 'warrior'),
            "Paladin": new Archetype('Paladin', 'warrior')
        }
    },
    mage: {
        cost: new Orb('mage'),
        /** @type {Object<string, Set<NODE>>} */block: {},
        /** @type {Object<string, Set<NODE>>} */required: {},
        archetype: {
            "Riftwalker": new Archetype('Riftwalker', 'mage'),
            "Light Bender": new Archetype('Light Bender', 'mage'),
            "Arcanist": new Archetype('Arcanist', 'mage')
        }
    },
    assassin: {
        cost: new Orb('assassin'),
        /** @type {Object<string, Set<NODE>>} */block: {},
        /** @type {Object<string, Set<NODE>>} */required: {},
        archetype: {
            "Shadestepper": new Archetype('Shadestepper', 'assassin'),
            "Trickster": new Archetype('Trickster', 'assassin'),
            "Acrobat": new Archetype('Acrobat', 'assassin')
        }
    },
    shaman: {
        cost: new Orb('shaman'),
        /** @type {Object<string, Set<NODE>>} */block: {},
        /** @type {Object<string, Set<NODE>>} */required: {},
        archetype: {
            "Summoner": new Archetype('Summoner', 'shaman'),
            "Ritualist": new Archetype('Ritualist', 'shaman'),
            "Acolyte": new Archetype('Acolyte', 'shaman')
        }
    }
};
/** @global */
const routelogs = {
    /**
     * @template T
     * @param {string} propName  property name
     * @param {T}      init      initial property value if null or undefined (optional)
     * @param {number} RID
     * @return {T}
     **/
    prop: function (propName, init, RID=route) {
        return (this[RID] ??= {})[propName] ??= init;
    },
    /**
     * @template T
     * @param {string} taskName 
     * @param {string} nodeName 
     * @param {T}      value 
     * @param {number} RID 
     * @return {T}
     */
    edit: function (taskName, nodeName, value, RID=route) {
        ((this[RID] ??= {})[taskName] ??= {})[nodeName] = value;
        return this[RID][taskName][nodeName];
    }
};
/** @global */
const routemap = {
    /** @type {(NODE|PIPE|null)[][]} */
    "archer": new Tree(),
    /** @type {(NODE|PIPE|null)[][]} */
    "warrior": new Tree(),
    /** @type {(NODE|PIPE|null)[][]} */
    "mage": new Tree(),
    /** @type {(NODE|PIPE|null)[][]} */
    "assassin": new Tree(),
    /** @type {(NODE|PIPE|null)[][]} */
    "shaman": new Tree()
};
/** @global */
const database = {
    "archer": {},
    "warrior": {
        "Bash": {
            "name": "Bash",
            "combo": "RLR",
            "level": 0,
            "import": null,
            "export": ["Spear Proficiency I"],
            "cost": 1,
            "axis": [4, 1],
            "draft": ["S"]
        },
        "Spear Proficiency I": {
            "name": "Spear Proficiency I",
            "level": 1,
            "import": ["Bash"],
            "export": ["Double Bash", "Cheaper Bash I"],
            "cost": 1,
            "axis": [4, 3],
            "draft": ["N", "S", "W"]
        },
        "Cheaper Bash I": {
            "name": "Cheaper Bash I",
            "realname": "Cheaper Bash",
            "level": 1,
            "import": ["Spear Proficiency I"],
            "export": null,
            "cost": 1,
            "axis": [2, 3],
            "draft": ["E"]
        },
        "Double Bash": {
            "name": "Double Bash",
            "level": 2,
            "import": ["Spear Proficiency I"],
            "export": ["Charge"],
            "cost": 1,
            "axis": [4, 5],
            "draft": ["N", "S"]
        },
        "Charge": {
            "name": "Charge",
            "combo": "RRR",
            "level": 0,
            "import": ["Double Bash"],
            "export": ["Vehement", "Tougher Skin"],
            "cost": 1,
            "axis": [4, 7],
            "draft": ["N", "E", "W"]
        },
        "Vehement": {
            "name": "Vehement",
            "level": 1,
            "import": ["Charge"],
            "export": ["Uppercut"],
            "cost": 1,
            "lock": ["Tougher Skin"],
            "rely": null,
            "archetype": {"name": "Fallen", "req": 0},
            "axis": [2, 7],
            "draft": ["E", "S"]
        },
        "Tougher Skin": {
            "name": "Tougher Skin",
            "level": 1,
            "import": ["Charge"],
            "export": ["War Scream"],
            "cost": 1,
            "lock": ["Vehement"],
            "rely": null,
            "archetype": {"name": "Paladin", "req": 0},
            "axis": [6, 7],
            "draft": ["W", "S"]
        },
        "Uppercut": {
            "name": "Uppercut",
            "combo": "RLL",
            "level": 0,
            "import": ["Cheaper Charge", "Vehement"],
            "export": ["Cheaper Charge", "Heavy Impact", "Earth Mastery", "Thunder Mastery"],
            "cost": 1,
            "axis": [2, 9],
            "draft": ["N", "SSS", "E", "WWSSS"]
        },
        "Cheaper Charge": {
            "name": "Cheaper Charge",
            "level": 1,
            "import": ["Uppercut", "War Scream"],
            "export": ["Uppercut", "War Scream", "Thunder Mastery", "Air Mastery", "Water Mastery"],
            "cost": 1,
            "axis": [4, 9],
            "draft": ["SSSSE", "SSSSW", "E", "W"]
        },
        "War Scream": {
            "name": "War Scream",
            "combo": "RRL",
            "level": 0,
            "import": ["Cheaper Charge", "Tougher Skin"],
            "export": ["Cheaper Charge", "Air Mastery", "Fire Mastery"],
            "cost": 1,
            "axis": [6, 9],
            "draft": ["N", "SSS", "EESSS", "W"]
        },
        "Heavy Impact": {
            "name": "Heavy Impact",
            "level": 2,
            "import": ["Uppercut"],
            "export": null,
            "cost": 1,
            "axis": [1, 10],
            "draft": ["N"]
        },
        "Earth Mastery": {
            "name": "Earth Mastery",
            "level": 1,
            "import": ["Uppercut"],
            "export": ["Quadruple Bash"],
            "cost": 1,
            "archetype": {"name": "Fallen", "req": 0},
            "axis": [0, 13],
            "draft": ["NNNNE", "S"]
        },
        "Thunder Mastery": {
            "name": "Thunder Mastery",
            "level": 1,
            "import": ["Cheaper Charge", "Air Mastery", "Uppercut"],
            "export": ["Fireworks", "Air Mastery", "Water Mastery"],
            "cost": 1,
            "archetype": {"name": "Fallen", "req": 0},
            "axis": [2, 13],
            "draft": ["NNN", "S", "EEE", "EENNN"]
        },
        "Air Mastery": {
            "name": "Air Mastery",
            "level": 1,
            "import": ["Cheaper Charge", "Thunder Mastery", "War Scream"],
            "export": ["Flyby Jab", "Thunder Mastery", "Water Mastery"],
            "cost": 1,
            "archetype": {"name": "Battle Monk", "req": 0},
            "axis": [6, 13],
            "draft": ["NNN", "S", "WWW", "WWNNN"]
        },
        "Fire Mastery": {
            "name": "Fire Mastery",
            "level": 1,
            "import": ["War Scream"],
            "export": ["Flaming Uppercut"],
            "cost": 1,
            "archetype": {"name": "Paladin", "req": 0},
            "axis": [8, 13],
            "draft": ["NNNNW", "S"]
        },
        "Water Mastery": {
            "name": "Water Mastery",
            "level": 1,
            "import": ["Cheaper Charge", "Thunder Mastery", "Air Mastery"],
            "export": ["Half-Moon Swipe"],
            "cost": 1,
            "archetype": {"name": "Battle Monk", "req": 0},
            "axis": [4, 14],
            "draft": ["NNNN", "NE", "NW", "S"]
        },
        "Quadruple Bash": {
            "name": "Quadruple Bash",
            "level": 2,
            "import": ["Earth Mastery", "Fireworks"],
            "export": ["Bak'al's Grasp", "Fireworks"],
            "cost": 2,
            "rely": "Bash",
            "archetype": {"name": "Fallen", "req": 0},
            "axis": [0, 15],
            "draft": ["N", "ESSSS"]
        },
        "Fireworks": {
            "name": "Fireworks",
            "level": 2,
            "import": ["Thunder Mastery", "Quadruple Bash"],
            "export": ["Bak'al's Grasp", "Quadruple Bash"],
            "cost": 2,
            "archetype": {"name": "Fallen", "req": 0},
            "axis": [2, 15],
            "draft": ["N", "WSSSS"]
        },
        "Flyby Jab": {
            "name": "Flyby Jab",
            "level": 1,
            "import": ["Air Mastery", "Flaming Uppercut"],
            "export": ["Iron Lungs", "Flaming Uppercut"],
            "cost": 1,
            "axis": [6, 15],
            "draft": ["N", "E"]
        },
        "Flaming Uppercut": {
            "name": "Flaming Uppercut",
            "level": 2,
            "import": ["Fire Mastery", "Flyby Jab"],
            "export": ["Iron Lungs", "Flyby Jab"],
            "cost": 2,
            "axis": [8, 15],
            "draft": ["N", "W"]
        },
        "Half-Moon Swipe": {
            "name": "Half-Moon Swipe",
            "level": 2,
            "import": ["Water Mastery"],
            "export": ["Air Shout"],
            "cost": 2,
            "rely": "Uppercut",
            "archetype": {"name": "Battle Monk", "req": 1},
            "axis": [4, 16],
            "draft": ["N", "SS"]
        },
        "Iron Lungs": {
            "name": "Iron Lungs",
            "level": 1,
            "import": ["Flyby Jab", "Flaming Uppercut"],
            "export": ["Mantle of the Bovemists"],
            "cost": 1,
            "rely": "War Scream",
            "archetype": {"name": "Paladin", "req": 0},
            "axis": [7, 16],
            "draft": ["N", "SS"]
        },
        "Generalist": {
            "name": "Generalist",
            "level": 4,
            "import": ["Air Shout"],
            "export": null,
            "cost": 2,
            "archetype": {"name": "Battle Monk", "req": 3},
            "axis": [2, 19],
            "draft": ["E"]
        },
        "Air Shout": {
            "name": "Air Shout",
            "level": 2,
            "import": ["Half-Moon Swipe"],
            "export": ["Generalist", "Cheaper Uppercut I"],
            "cost": 2,
            "rely": "War Scream",
            "archetype": {"name": "Battle Monk", "req": 0},
            "axis": [4, 19],
            "draft": ["NN", "W", "WS"]
        },
        "Mantle of the Bovemists": {
            "name": "Mantle of the Bovemists",
            "level": 4,
            "import": ["Iron Lungs"],
            "export": ["Provoke"],
            "cost": 2,
            "rely": "War Scream",
            "archetype": {"name": "Paladin", "req": 3},
            "axis": [7, 19],
            "draft": ["NN", "S"]
        },
        "Bak'al's Grasp": {
            "name": "Bak'al's Grasp",
            "level": 4,
            "import": ["Quadruple Bash", "Fireworks"],
            "export": ["Spear Proficiency II"],
            "cost": 2,
            "rely": "War Scream",
            "archetype": {"name": "Fallen", "req": 2},
            "axis": [1, 20],
            "draft": ["NNNNN", "W"]
        },
        "Spear Proficiency II": {
            "name": "Spear Proficiency II",
            "level": 1,
            "import": ["Bak'al's Grasp", "Cheaper Uppercut I"],
            "export": ["Precise Strikes", "Cheaper Uppercut I", "Enraged Blow"],
            "cost": 1,
            "axis": [0, 21],
            "draft": ["N", "SSS", "EE"]
        },
        "Cheaper Uppercut I": {
            "name": "Cheaper Uppercut I",
            "realname": "Cheaper Uppercut",
            "level": 1,
            "import": ["Spear Proficiency II", "Aerodynamics", "Air Shout"],
            "export": ["Spear Proficiency II", "Aerodynamics", "Precise Strikes", "Counter", "Flying Kick"],
            "cost": 1,
            "rely": "Uppercut",
            "axis": [3, 21],
            "draft": ["NN", "SSS", "E", "WW"]
        },
        "Aerodynamics": {
            "name": "Aerodynamics",
            "level": 2,
            "import": ["Provoke", "Cheaper Uppercut I"],
            "export": ["Provoke", "Cheaper Uppercut I", "Counter", "Manachism"],
            "cost": 2,
            "archetype": {"name": "Battle Monk", "req": 0},
            "axis": [5, 21],
            "draft": ["E", "W"]
        },
        "Provoke": {
            "name": "Provoke",
            "level": 2,
            "import": ["Mantle of the Bovemists", "Aerodynamics"],
            "export": ["Mantle of the Bovemists", "Aerodynamics", "Manachism", "Sacred Surge"],
            "cost": 2,
            "rely": "War Scream",
            "axis": [7, 21],
            "draft": ["N", "ESSS", "W"]
        },
        "Precise Strikes": {
            "name": "Precise Strikes",
            "level": 1,
            "import": ["Spear Proficiency II", "Cheaper Uppercut I"],
            "export": null,
            "cost": 1,
            "axis": [1, 22],
            "draft": ["NE"]
        },
        "Counter": {
            "name": "Counter",
            "level": 2,
            "import": ["Cheaper Uppercut I", "Aerodynamics", "Manachism"],
            "export": ["Manachism"],
            "cost": 2,
            "archetype": {"name": "Battle Monk", "req": 0},
            "axis": [4, 22],
            "draft": ["N", "E"]
        },
        "Manachism": {
            "name": "Manachism",
            "level": 3,
            "import": ["Aerodynamics", "Provoke", "Counter"],
            "export": ["Counter"],
            "cost": 2,
            "archetype": {"name": "Paladin", "req": 3},
            "axis": [6, 22],
            "draft": ["N", "W"]
        },
        "Enraged Blow": {
            "name": "Enraged Blow",
            "level": 3,
            "import": ["Spear Proficiency II"],
            "export": ["Intoxicating Blood", "Boiling Blood"],
            "cost": 2,
            "rely": "Bak'al's Grasp",
            "archetype": {"name": "Fallen", "req": 0},
            "axis": [0, 25],
            "draft": ["NNN", "S", "ESS"]
        },
        "Flying Kick": {
            "name": "Flying Kick",
            "level": 2,
            "import": ["Cheaper Uppercut I", "Stronger Mantle"],
            "export": ["Stronger Mantle", "Riposte", "Cheaper War Scream I", "Ragnarokkr"],
            "cost": 2,
            "archetype": {"name": "Battle Monk", "req": 1},
            "axis": [3, 25],
            "draft": ["NNN", "SS", "ES", "EE"]
        },
        "Stronger Mantle": {
            "name": "Stronger Mantle",
            "level": 1,
            "import": ["Flying Kick", "Sacred Surge"],
            "export": ["Flying Kick", "Sacred Surge", "Riposte", "Cheaper War Scream I"],
            "cost": 1,
            "rely": "Mantle of the Bovemists",
            "archetype": {"name": "Paladin", "req": 0},
            "axis": [6, 25],
            "draft": ["E", "WWS"]
        },
        "Sacred Surge": {
            "name": "Sacred Surge",
            "level": 3,
            "import": ["Provoke", "Stronger Mantle"],
            "export": ["Stronger Mantle", "Stronger Bash"],
            "cost": 2,
            "archetype": {"name": "Paladin", "req": 5},
            "axis": [8, 25],
            "draft": ["NNNN", "S", "W"]
        },
        "Riposte": {
            "name": "Riposte",
            "level": 1,
            "import": ["Flying Kick", "Stronger Mantle"],
            "export": null,
            "cost": 1,
            "rely": "Counter",
            "axis": [5, 26],
            "draft": ["NW"]
        },
        "Intoxicating Blood": {
            "name": "Intoxicating Blood",
            "level": 2,
            "import": ["Enraged Blow"],
            "export": null,
            "cost": 2,
            "rely": "Bak'al's Grasp",
            "archetype": {"name": "Fallen", "req": 5},
            "axis": [0, 27],
            "draft": ["N"]
        },
        "Cheaper War Scream I": {
            "name": "Cheaper War Scream I",
            "realname": "Cheaper War Scream",
            "level": 1,
            "import": ["Cleansing Breeze", "Flying Kick", "Stronger Mantle"],
            "export": ["Cleansing Breeze", "Collide" ,"Ragnarokkr", "Whirlwind Strike"],
            "cost": 1,
            "rely": "War Scream",
            "axis": [4, 27],
            "draft": ["NNE", "SSS", "E", "WN"]
        },
        "Cleansing Breeze": {
            "name": "Cleansing Breeze",
            "level": 1,
            "import": ["Stronger Bash", "Cheaper War Scream I"],
            "export": ["Stronger Bash", "Cheaper War Scream I", "Collide", "Rejuvenating Skin"],
            "cost": 1,
            "archetype": {"name": "Paladin", "req": 0},
            "axis": [6, 27],
            "draft": ["E", "W"]
        },
        "Stronger Bash": {
            "name": "Stronger Bash",
            "level": 1,
            "import": ["Cleansing Breeze", "Sacred Surge"],
            "export": ["Cleansing Breeze", "Rejuvenating Skin"],
            "cost": 1,
            "axis": [8, 27],
            "draft": ["N", "W"]
        },
        "Boiling Blood": {
            "name": "Boiling Blood",
            "level": 2,
            "import": ["Ragnarokkr", "Enraged Blow"],
            "export": ["Ragnarokkr", "Comet", "Uncontainable Corruption"],
            "cost": 2,
            "axis": [1, 28],
            "draft": ["NNN", "E", "WSS"]
        },
        "Ragnarokkr": {
            "name": "Ragnarokkr",
            "level": 3,
            "import": ["Boiling Blood", "Cheaper War Scream I", "Flying Kick"],
            "export": ["Boiling Blood", "Comet"],
            "cost": 2,
            "rely": "War Scream",
            "archetype": {"name": "Fallen", "req": 0},
            "axis": [3, 28],
            "draft": ["NN", "W"]
        },
        "Collide": {
            "name": "Collide",
            "level": 2,
            "import": ["Cheaper War Scream I", "Cleansing Breeze"],
            "export": null,
            "cost": 2,
            "rely": "Flying Kick",
            "archetype": {"name": "Battle Monk", "req": 4},
            "axis": [5, 28],
            "draft": ["N"]
        },
        "Rejuvenating Skin": {
            "name": "Rejuvenating Skin",
            "level": 4,
            "import": ["Cleansing Breeze", "Stronger Bash"],
            "export": ["Mythril Skin"],
            "cost": 2,
            "archetype": {"name": "Paladin", "req": 5},
            "axis": [7, 28],
            "draft": ["N", "SS"]
        },
        "Comet": {
            "name": "Comet",
            "level": 2,
            "import": ["Boiling Blood", "Ragnarokkr"],
            "export": null,
            "cost": 2,
            "rely": "Fireworks",
            "archetype": {"name": "Fallen", "req": 0},
            "axis": [2, 29],
            "draft": ["N"]
        },
        "Uncontainable Corruption": {
            "name": "Uncontainable Corruption",
            "level": 1,
            "import": ["Radiant Devotee", "Boiling Blood"],
            "export": ["Radiant Devotee", "Armour Breaker", "Massive Bash"],
            "cost": 1,
            "rely": "Bak'al's Grasp",
            "axis": [0, 31],
            "draft": ["NNN", "S", "E"]
        },
        "Radiant Devotee": {
            "name": "Radiant Devotee",
            "level": 1,
            "import": ["Whirlwind Strike", "Uncontainable Corruption"],
            "export": ["Whirlwind Strike", "Uncontainable Corruption", "Armour Breaker"],
            "cost": 1,
            "archetype": {"name": "Battle Monk", "req": 1},
            "axis": [2, 31],
            "draft": ["E", "W"]
        },
        "Whirlwind Strike": {
            "name": "Whirlwind Strike",
            "level": 4,
            "import": ["Radiant Devotee", "Cheaper War Scream I"],
            "export": ["Radiant Devotee", "Spirit of the Rabbit"],
            "cost": 2,
            "rely": "Uppercut",
            "archetype": {"name": "Battle Monk", "req": 6},
            "axis": [4, 31],
            "draft": ["NNN", "S", "W"]
        },
        "Mythril Skin": {
            "name": "Mythril Skin",
            "level": 2,
            "import": ["Rejuvenating Skin"],
            "export": ["Shield Strike", "Sparkling Hope"],
            "cost": 2,
            "archetype": {"name": "Paladin", "req": 6},
            "axis": [7, 31],
            "draft": ["NN", "E", "W"]
        },
        "Armour Breaker": {
            "name": "Armour Breaker",
            "level": 3,
            "import": ["Uncontainable Corruption", "Radiant Devotee"],
            "export": null,
            "cost": 2,
            "rely": "Bak'al's Grasp",
            "archetype": {"name": "Fallen", "req": 0},
            "axis": [1, 32],
            "draft": ["N"]
        },
        "Shield Strike": {
            "name": "Shield Strike",
            "level": 2,
            "import": ["Mythril Skin"],
            "export": ["Cheaper Bash II"],
            "cost": 2,
            "rely": "Mantle of the Bovemists",
            "archetype": {"name": "Paladin", "req": 0},
            "axis": [6, 32],
            "draft": ["N", "ES"]
        },
        "Sparkling Hope": {
            "name": "Sparkling Hope",
            "level": 3,
            "import": ["Mythril Skin"],
            "export": ["Cheaper Bash II"],
            "cost": 2,
            "rely": "Bak'al's Grasp",
            "archetype": {"name": "Paladin", "req": 0},
            "axis": [8, 32],
            "draft": ["N", "WS"]
        },
        "Massive Bash": {
            "name": "Massive Bash",
            "level": 3,
            "import": ["Tempest", "Uncontainable Corruption"],
            "export": ["Tempest", "Massacre", "Cheaper War Scream II"],
            "cost": 2,
            "archetype": {"name": "Fallen", "req": 7},
            "axis": [0, 33],
            "draft": ["N", "SSS", "E"]
        },
        "Tempest": {
            "name": "Tempest",
            "level": 2,
            "import": ["Massive Bash", "Spirit of the Rabbit"],
            "export": ["Massive Bash", "Spirit of the Rabbit", "Axe Kick", "Massacre"],
            "cost": 2,
            "archetype": {"name": "Battle Monk", "req": 0},
            "axis": [2, 33],
            "draft": ["E", "W"]
        },
        "Spirit of the Rabbit": {
            "name": "Spirit of the Rabbit",
            "level": 1,
            "import": ["Tempest", "Whirlwind Strike"],
            "export": ["Tempest", "Axe Kick", "Radiance", "Cyclone"],
            "cost": 1,
            "rely": "Charge",
            "archetype": {"name": "Battle Monk", "req": 5},
            "axis": [4, 33],
            "draft": ["N", "SSS", "E", "W"]
        },
        "Massacre": {
            "name": "Massacre",
            "level": 2,
            "import": ["Massive Bash", "Tempest"],
            "export": null,
            "cost": 2,
            "archetype": {"name": "Fallen", "req": 5},
            "axis": [1, 34],
            "draft": ["N"]
        },
        "Axe Kick": {
            "name": "Axe Kick",
            "level": 1,
            "import": ["Tempest", "Spirit of the Rabbit"],
            "export": null,
            "cost": 1,
            "axis": [3, 34],
            "draft": ["N"]
        },
        "Radiance": {
            "name": "Radiance",
            "level": 3,
            "import": ["Spirit of the Rabbit", "Cheaper Bash II"],
            "export": ["Cheaper Bash II"],
            "cost": 2,
            "archetype": {"name": "Paladin", "req": 3},
            "axis": [5, 34],
            "draft": ["N", "E"]
        },
        "Cheaper Bash II": {
            "name": "Cheaper Bash II",
            "realname": "Cheaper Bash",
            "level": 1,
            "import": ["Radiance", "Shield Strike", "Sparkling Hope"],
            "export": ["Radiance", "Stronger Sacred Surge"],
            "cost": 1,
            "rely": "Bash",
            "axis": [7, 34],
            "draft": ["NN", "SS", "W"]
        },
        "Cheaper War Scream II": {
            "name": "Cheaper War Scream II",
            "realname": "Cheaper War Scream",
            "level": 1,
            "import": ["Massive Bash"],
            "export": ["Better Enraged Blow", "Blood Pact"],
            "cost": 1,
            "rely": "War Scream",
            "axis": [0, 37],
            "draft": ["NNN", "S", "E"]
        },
        "Discombobulate": {
            "name": "Discombobulate",
            "level": 4,
            "import": ["Cyclone"],
            "export": null,
            "cost": 2,
            "archetype": {"name": "Battle Monk", "req": 11},
            "axis": [2, 37],
            "draft": ["E"]
        },
        "Cyclone": {
            "name": "Cyclone",
            "level": 2,
            "import": ["Spirit of the Rabbit"],
            "export": ["Discombobulate", "Thunderclap"],
            "cost": 2,
            "archetype": {"name": "Battle Monk", "req": 0},
            "axis": [4, 37],
            "draft": ["NNN", "W", "E"]
        },
        "Stronger Sacred Surge": {
            "name": "Stronger Sacred Surge",
            "level": 1,
            "import": ["Cheaper Bash II"],
            "export": ["Second Chance"],
            "cost": 1,
            "rely": "Sacred Surge",
            "archetype": {"name": "Paladin", "req": 8},
            "axis": [7, 37],
            "draft": ["NN", "S"]
        },
        "Better Enraged Blow": {
            "name": "Better Enraged Blow",
            "level": 1,
            "import": ["Cheaper War Scream II"],
            "export": null,
            "cost": 1,
            "rely": "Enraged Blow",
            "axis": [1, 38],
            "draft": ["N"]
        },
        "Thunderclap": {
            "name": "Thunderclap",
            "level": 2,
            "import": ["Cyclone"],
            "export": null,
            "cost": 2,
            "rely": "Bash",
            "archetype": {"name": "Battle Monk", "req": 8},
            "axis": [5, 38],
            "draft": ["N"]
        },
        "Blood Pact": {
            "name": "Blood Pact",
            "level": 4,
            "import": ["Cheaper War Scream II"],
            "export": ["Haemorrhage", "Brink of Madness"],
            "cost": 2,
            "archetype": {"name": "Fallen", "req": 10},
            "axis": [0, 39],
            "draft": ["N", "EEEE"]
        },
        "Second Chance": {
            "name": "Second Chance",
            "level": 4,
            "import": ["Stronger Sacred Surge"],
            "export": ["Cheaper Uppercut II", "Martyr"],
            "cost": 2,
            "archetype": {"name": "Paladin", "req": 6},
            "axis": [7, 39],
            "draft": ["N", "E", "W"]
        },
        "Haemorrhage": {
            "name": "Haemorrhage",
            "level": 1,
            "import": ["Blood Pact"],
            "export": null,
            "cost": 1,
            "rely": "Blood Pact",
            "archetype": {"name": "Fallen", "req": 0},
            "axis": [2, 40],
            "draft": ["NW"]
        },
        "Brink of Madness": {
            "name": "Brink of Madness",
            "level": 3,
            "import": ["Blood Pact", "Cheaper Uppercut II"],
            "export": ["Cheaper Uppercut II"],
            "cost": 2,
            "axis": [4, 40],
            "draft": ["NWWW", "E"]
        },
        "Cheaper Uppercut II": {
            "name": "Cheaper Uppercut II",
            "level": 1,
            "import": ["Brink of Madness", "Second Chance"],
            "export": ["Brink of Madness"],
            "cost": 1,
            "rely": "Uppercut",
            "axis": [6, 40],
            "draft": ["N", "W"]
        },
        "Martyr": {
            "name": "Martyr",
            "level": 2,
            "import": ["Second Chance"],
            "export": null,
            "cost": 2,
            "axis": [8, 40],
            "draft": ["N"]
        }
    },
    "mage": {},
    "assassin": {},
    "shaman": {}
};

main();