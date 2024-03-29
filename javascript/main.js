'use strict';

/** @type {['zh-TW', 'en']} */
const languages = ['zh-TW', 'en'];
let using = 0;

/**
 * @typedef {('en' | 'zh-TW')}              Languages
 * @typedef  {("N" | "S" | "E" | "W")}      Direction
 * @typedef  {(NODE | WIRE)}              Units
 * @typedef  {('enable' | 'disable' | 'standby' | 'lock')}  States
 * @typedef  {('archer' | 'warrior' | 'mage' | 'assassin' | 'shaman')}  Classes
 * @typedef  {('Boltslinger' | 'Sharpshooter' | 'Trapper' | 'Fallen' | 'Battle Monk' | 'Paladin' | 'Riftwalker' | 'Light Bender' | 'Arcanist' | 'Shadestepper' | 'Trickster' | 'Acrobat' | 'Summoner' | 'Ritualist' | 'Acolyte')}   Archetypes
 **/

function main() {
    Action.register();
    document.addEventListener('DOMContentLoaded', () => {
        console.info('routemap:', routemap);
        console.info('routelogs:', routelogs);
        console.info('routedata:', routedata);
        console.info('using:', languages[using]);
    });
}

function generateElement(stringHTML) {
    const fragment = document.createDocumentFragment();
    const block = document.createElement('div');
    block.innerHTML = stringHTML;
    for (const child of block.childNodes) {fragment.appendChild(child)}
    return fragment;
}

class Action {

    static register() {

        document.getElementById('lang-config')
                .addEventListener('change', EventHandler.changeLangEvent);

        Object.values(EventHandler.tabs).forEach((tab) => {
            tab.addEventListener('click', EventHandler.tabInteractEvent);
        });

        return this;
    }

    /** @param {Classes} clsname */
    static buildTree(clsname) {
        const dataset = database[clsname];
        const tree = routemap[clsname];

        for (const data of Object.values(dataset)) {
            console.groupCollapsed(`<${data.name}>`);

            const node = new NODE(clsname, data);
            const [x, y] = data.axis;
            
            try {
                tree[y].splice(x, 1, node);
            } catch {
                tree[y] = Tree.newline(x, 1, node);
            }
            

            console.groupEnd();
        }

        for (let y = tree.length; tree.length % 6; y++) {
            tree[y] = Tree.newline();
        }

        return this; 
    }

    /** @param {Classes} clsname */
    static renderTree(clsname) {
        const tree = routemap[clsname];
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
                    switch (str([row, col])) {
                        case '[0,3]': {
                            td.appendChild(generateElement(`<img class="misc arrow_up">`));
                            break;
                        }
                        case '[0,5]': {
                            td.appendChild(generateElement(`<img class="misc arrow_down">`));
                            break;
                        }
                        case '[0,4]': {
                            orb.parentElement = td;
                            td.appendChild(orb.html);
                            break;
                        }
                        case '[2,2]':
                        case '[2,4]':
                        case '[2,6]': {
                            const atype = atypes.shift();
                            atype.parentElement = td;
                            td.appendChild(atype.html);
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
                    if (elem instanceof UNIT) switch (true) {

                        case elem instanceof NODE:
                            elem.parentElement = td;
                            td.addEventListener('click', EventHandler.nodeInteractEvent);

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
}

class EventHandler {
    /** @type {HTMLCollectionOf<HTMLButtonElement>}*/
    static tabs = document.getElementById('tab').getElementsByClassName('tab_button');

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
            clsdata.cost.parentElement?.replaceChildren(clsdata.cost.html);
            for (const atype of Object.values(clsdata.archetype)) {
                atype.parentElement?.replaceChildren(atype.html);
            }
        }

        // tab buttons
        for (const button of Object.values(EventHandler.tabs)) {
            button.textContent = translate[languages[using]][button.dataset.class];
        }

    }
}

/* -------------------------------- */

class SoundEffect extends Audio {

    /** @param {string} filename */
    constructor(filename) {
        super("../resources/audios/" + filename);
        this.controls = false;
        this.preload = true;
        this.preservesPitch = false;
    }

    /**
     * @param {number} volume
     * @param {number} speed
     **/
    play(volume, speed) {
        clearInterval(this.interval);

        this.pause();
        this.currentTime = 0;
        this.volume = volume;
        this.playbackRate = speed;
        super.play();

        this.interval = setInterval(() => {
            if (this.volume >= 0.1) {
                this.volume -= 0.1;
            } else {
                this.volume = 0;
                clearInterval(this.interval);
            }
        }, 100);
    }
}

class Packet {
    /**    
     * @typedef  {Object}           params      
     * @property {string}           task        command
     * @property {string}           response    response (optional)
     * @property {NODE}             src         source
     * @property {NODE[]}           dest        destinations
     * @property {NODE | NODE[]}    ignore      ignore List
     * @property {Direction}        gate        the gate which the packet came through
     * @property {NODE}             router      transmitter
     * @property {number}           RID         Main-Route ID (Global ID)
     * 
     * @param {params}
     */
    constructor({task, src, dest, ignore, gate, router, RID}) {
        /** @type {string} */
        this.task = task;
        /** @type {NODE} */
        this.src = src;
        /** @type {NODE[]} */
        this.dest = new Set((dest instanceof NODE) ? [dest] : dest);
        /** @type {Set<NODE>} */
        this.ignore = new Set((ignore instanceof NODE) ? [ignore] : ignore);
        /** @type {Direction} */
        this.gate = gate;
        /** @type {NODE} */
        this.router = router;
        /** @type {number} */
        this.RID = RID;
    }

    get params() {
        return {
            task: this.task,
            src: this.src,
            dest: this.dest,
            ignore: this.ignore,
            gate: this.gate,
            router: this.router,
            RID: this.RID
        }
    }

    get parse() {
        const std = (value) => (typeof value == 'string' || value instanceof String) ? `"${value}"` : `${value}`;
        return '{\n' +
        `\ttask: ${std(this.task)}\n` +
        `\tsource: ${std(this.src?.name)}\n` +
        `\tdestination: [${Array.from(this.dest, (node) => std(node.name)).join(', ')}]\n` +
        `\tignore: [${Array.from(this.ignore, (node) => std(node.name)).join(', ')}]\n` +
        `\tgate: ${std(this.gate)}\n` +
        `\trouter: ${std(this.router?.name)}\n` +
        `\tRoute-ID: ${this.RID}\n` +
        '}';
    }

    /** @param {params} args */
    config(args) {
        if (args.task !== undefined) this.task = args.task;
        if (args.src !== undefined) this.src = args.src;
        if (args.dest !== undefined) this.dest = new Set((args.dest instanceof NODE) ? [args.dest] : args.dest);
        if (args.ignore !== undefined) this.ignore = new Set((args.ignore instanceof NODE) ? [args.ignore] : args.ignore);
        if (args.gate !== undefined) this.gate = args.gate;
        if (args.router !== undefined) this.router = args.router;
        if (args.RID !== undefined) this.RID = args.RID;

        return this;
    }

}

class Gate {

    constructor(pos) {
        /** @type {Direction} */
        this.pos = pos;
        /** @type {Set<NODE>} */
        this.__toward = new Set();
        /** @type {Units}} */
        this.connect = null;
    }

    get bound() {return this.toward.length ? true : false}

    get toward() {return Array.from(this.__toward)}

    set toward(iter) {this.__toward = new Set(iter)}

    static opposite(dir) {
        switch (dir) {
            case 'N': return 'S';
            case 'S': return 'N';
            case 'E': return 'W';
            case 'W': return 'E';
            default: throw Error('invalid direction.')
        }
    }

}

class UNIT {

    constructor(axis) {
        this.axis = axis;
        this.gates = {
            N: new Gate('N'),
            S: new Gate('S'),
            E: new Gate('E'),
            W: new Gate('W'),
        };
    }

    get gateway() {return Object.values(this.gates).filter((gate) => gate.bound)}

    get info() { /** abstract property */ }
    
    /**
     * @param {Direction}   pos
     * @param {NODE}        node
     * @param {Units}       closest
     */
    bind(pos, node, closest) {
        const gate = this.gates[pos];
        gate.__toward.add(node);
        try {
            if ((gate.connect !== null) && (gate.connect !== closest)) {
                throw Error(`Suspecious overwrite the "connect" property, occurred at [${this.axis}]`);
            } else {
                gate.connect ??= closest;
            }
        } catch {
            console.error(routemap)
        }
    }

    /**
     * @typedef {Object} UNIT_transmitParams
     * @property {Packet}   packet      original packet
     * @property {Gate[]}   gateway     output gate
     * @property {boolean}  suspend     stop transmit chain if met criteria in any response (optional, default `false`)
     * @param   {UNIT_transmitParams}
     * @return  {boolean?}
     **/
    transmit({packet, gateway, suspend=false}) {
        let response = null;

        for (const gate of gateway) {

            if (gate.toward.every((node) => packet.ignore.has(node))) continue;

            const subpack = (gateway.length > 1) ? new Packet(packet.params).config({
                router: (this instanceof NODE) ? this : packet.router,
                gate: Gate.opposite(gate.pos)
            }) : packet.config({
                router: (this instanceof NODE) ? this : packet.router,
                gate: Gate.opposite(gate.pos)
            });

            console.groupCollapsed(`${this.info} (Gate ${gate.pos}) send a packet!`);
            console.info(`packet: ${subpack.parse}`);

            const signal = gate.connect.transmit({
                packet: subpack,
                suspend: suspend // 給 WIRE 看的
            })

            response ||= signal;

            console.groupEnd();
            console.info(`${this.info} (Gate ${gate.pos}) received: ${response}`);

            if (suspend && response) break;

        }

        response ??= packet.task.endsWith('?') ? false : null;

        return response;

    };

}

class NODE extends UNIT{

    static #stateList = ['enable', 'disable', 'standby', 'lock'];

    /**
     * @typedef     {Object}      ndata
     * @property    {String}      ndata.name
     * @property    {String}      ndata.combo
     * @property    {number}      ndata.level
     * @property    {String[]}    ndata.import
     * @property    {String[]}    ndata.export
     * @property    {number}      ndata.cost
     * @property    {String[]}    ndata.lock
     * @property    {String}      ndata.rely
     * @property    {Object}      ndata.archetype
     * @property    {Archetypes}  ndata.archetype.name
     * @property    {number}      ndata.archetype.req
     * @property    {number[]}    ndata.axis
     * @property    {String[]}    ndata.draft
     * 
     * @param {Classes} clsname
     * @param {ndata}   info
     */
    constructor(clsname, info) {
        super(info.axis);
        /** @type {ndata} */
        this.proto = info;
        /** @type {String} */
        this.name = info.name;
        /** @type {Classes} */
        this.class = clsname;
        /** @type {Tooltip} */
        this.tooltip = new Tooltip(this);
        /** @type {HTMLTableCellElement} */
        this.parentElement = undefined;
        /** @type {HTMLButtonElement} */
        this.buttonElement = document.createElement('button');
        /** @type {DOMTokenList} */
        this.classList = this.buttonElement.classList;
        this.classList.add((str(info.axis) === '[4,1]') ? 'standby' : 'disable');
        this.buttonElement.appendChild(generateElement(`<img class="${info.level ? `button_${info.level}` : `button_${clsname}`}">`));

        this.#buildpath();
    }

    /** @return {DocumentFragment} */
    get html() {
        const fragment = document.createDocumentFragment();
        fragment.appendChild(this.buttonElement);
        fragment.appendChild(this.tooltip.html);
        return fragment;
    }

    /** @return {Gate[]} */
    get importGate() {return this.gateway.filter((gate) => gate.toward.some((node) => this.proto.import?.includes(node.name)))}

    /** @return {Gate[]} */
    get exportGate() {return this.gateway.filter((gate) => gate.toward.some((node) => this.proto.export?.includes(node.name)))}

    /** @return {NODE[]} */
    get family() {return unique(this.gateway.flatMap((gate) => gate.toward))}

    /** @return {NODE[]} */
    get importNode() {return this.family.filter((node) => this.proto.import?.includes(node.name))}

    /** @return {NODE[]} */
    get exportNode() {return this.family.filter((node) => this.proto.export?.includes(node.name))}

    get info() {return `<${this.name}> [${this.buttonElement.className}]`}

    #buildpath() {
        const tree = routemap[this.class];

        this.proto.draft.forEach((path) => {

            let [x, y] = this.proto.axis;
            let obj = this;
            
            Array.from(path).forEach((dir) => {

                switch (dir) {
                    case 'N': y--; break;
                    case 'S': y++; break;
                    case 'E': x++; break;
                    case 'W': x--; break;
                    default: throw Error(`invalid direction "${dir}" detected in the draft of <${this.name}> under ${this.class}.`);
                }

                /** @type {WIRE} */
                const branch = (tree.read(y, x) instanceof WIRE) ? tree[y][x] : new WIRE([x, y]);

                branch.bind(Gate.opposite(dir), this, obj);

                tree[y][x] = obj = branch;

            });
        });
    }

    /** @param {States} state  */
    state(state) {

        if (state !== undefined) {
            if (!NODE.#stateList.includes(state)) throw Error(`invalid state of Node was detected at <${this.proto.name}>`);

            const history = Array.from(this.classList);

            NODE.#stateList.forEach((name) => {
                switch (name) {
                    case 'lock':
                        if (name === state) this.classList.toggle('lock');
                        break;
                    default:
                        if (name !== state) this.classList.remove(name);
                        else this.classList.add(name);
                }
            });

            switch (state) {
                case 'enable':
                    if (!history.includes('enable')) this.#update('enable');
                    break;
                case 'disable':
                case 'standby':
                    if (history.includes('enable')) this.#update('disable');
                    break;
            }

        }
        return this.classList;

    }
    
    click() {
        if (this.#examine()) {
            switch (true) {

                case this.classList.contains('enable'):
                    this.state('standby');
                    random([audio.high, audio.medium, audio.low]).play(0.8, 0.5);
                    this.transmit({
                        packet: new Packet({
                            task: 'standby',
                            src: this,
                            RID: route
                        })
                    });
                    break;

                case this.classList.contains('standby'):
                    this.state('enable');
                    random([audio.high, audio.medium, audio.low]).play(0.8, 1.5);
                    this.transmit({
                        packet: new Packet({
                            task: 'enable',
                            src: this,
                            RID: route
                        })
                    });
                    break;

                default:
                    throw Error(`unexpected state of Node was detected at <${this.proto.name}>`);
            }
        }
    }

    #examine() {
        const dataset = routedata[this.class];
        const chain =/** @param {string[]} arr */(arr) => {
            const _last = arr.pop();
            return (arr.length > 1) ? [arr.join(', '), _last].join(' and ') : _last;
        };

        switch (true) {
            case this.classList.contains('disable'): {
                return false;
            }
            case this.classList.contains('lock'): {
                const locker = Array.from(dataset.lock[this.name])
                                    .filter((node) => node.classList.contains('enable'))
                                    .map((node) => `<${node.name}>`);
                console.warn(`<${this.name}> This ability was locked by ${chain(locker)}!`);
                return false;
            }
            case this.tooltip.rely?.classList.contains('symbol-deny'): {
                console.warn(`<${this.name}> this ability is dependent on <${this.proto.rely}> !`)
                return false;
            }
            case this.tooltip.cost?.classList.contains('symbol-deny'): {
                console.warn(`<${this.name}> Not enough points to unlock this ability!`)
                return false;
            }
            case this.tooltip.atype?.classList.contains('symbol-deny'): {
                console.warn(`<${this.name}> Not enough "${this.proto.archetype.name}" archetype to unlock this ability!`)
                return false;
            }
        }

        return true;
    }

    /** @param {("enable" | "disable")} state */
    #update(state) {
        const dataset = routedata[this.class];
        const self = this.proto;
        switch (state) {
            case 'enable':
                // update remain apoint value in Orb
                // Orb will handle the part of update the tooltip state all the Nodes have
                dataset.cost.value -= self.cost;

                // update current archetype points in Archetype
                // Archetype will handle the part of update the tooltip state all the Nodes have
                if (self.archetype?.name) dataset.archetype[self.archetype.name].value += 1;
                
                // update tooltip footer "Required Ability" status of all Nodes which rely on this node
                dataset.rely[self.name]?.forEach(/** @param {NODE} node*/(node) => {
                    node.tooltip.rely.className = 'symbol-checkmark';
                });

                // add html 'lock' class to state of all Nodes which is locked by this node
                dataset.lock[self.name]?.forEach(/** @param {NODE} node*/(node) => {
                    node.buttonElement.classList.add('lock');
                });
                break;

            case 'disable':
                // update remain apoint value in Orb
                // Orb will handle the part of update the tooltip state all the Nodes have
                dataset.cost.value += self.cost;

                // update current archetype points in Archetype
                // Archetype will handle the part of update the tooltip state all the Nodes have
                if (self.archetype?.name) dataset.archetype[self.archetype.name].value -= 1;
                
                // update tooltip footer "Required Ability" status of all Nodes which rely on this node
                dataset.rely[self.name]?.forEach(/** @param {NODE} node*/(node) => {
                    node.tooltip.rely.className = 'symbol-deny';
                });

                // remove html 'lock' class to state of all Nodes which is locked by this node
                dataset.lock[self.name]?.forEach(/** @param {NODE} node*/(node) => {
                    node.buttonElement.classList.remove('lock');
                });
                break;

        }
    }

    /**
     * @typedef {Object} NODE_transmitParams
     * @property {Packet}   packet      packet you want to send
     * @property {Gate[]}   gateway     Gate filter (optional, default `all`)
     * @property {boolean}  suspend     stop transmit chain if met criteria in any response (optional, default `false`)
     * @param   {NODE_transmitParams}
     * @return  {boolean?}
     **/
    transmit({packet, gateway=this.gateway, suspend=false}) {

        let response = null;
        
        if ((packet.router !== this) && (packet.router !== undefined)) /* received */ {

            console.groupCollapsed(`${this.info} (Gate ${packet.gate}) received packet.`);
            console.info(`packet: ${packet.parse}`);
            
            response = this.#manager(packet);

            console.groupEnd();
            console.info(`${this.info} (Gate ${packet.gate}) return: ${response}`);

        } else /* send */ {

            const RID = packet.RID;
            const SID = routelogs.prop('serial', 0);
            routelogs[RID].serial++;

            console.groupCollapsed(`${this.info} Route ${RID}.${SID} start. (task: "${packet.task}")`);

            response = super.transmit({
                packet: packet,
                gateway: gateway,
                suspend: suspend
            });

            console.groupEnd();
            console.info(`${this.info} Route ${RID}.${SID} end. response: ${response}`);

            if (SID === 0) {
                delete routelogs[RID];
                route++;
            }

        }

        return response;
        
    }

    /**
     * @param {Packet} packet
     * @return {boolean?}
     **/
    #manager(packet) {
        
        /** @type {boolean?} */
        let response;
        /** @type {boolean | undefined} */
        const logs_reachable = routelogs.prop('reachable?', {}, packet.RID)[this.name];

        console.groupCollapsed(`${this.info} start handling the task "${packet.task}".`);
        
        switch (packet.task) {
            
            case 'standby':
            case 'disable': {
                response = null;
                switch (true) {
                    case this.classList.contains('disable'): break;
                    case this.classList.contains('standby'):
                    case this.classList.contains('enable'): {
                        const input = this.importNode.filter((node) => (node.classList.contains('enable')));
                        if (input) /* has other active node connecting */ {
                            const sibling = [this.proto.import, this.proto.export].every((arr) => arr?.includes(packet.router.name) ?? true);
                            const reachable = this.proto.import ? (
                                logs_reachable ?? this.transmit({
                                    gateway: this.importGate.filter((gate) => gate.toward.some((node) => node.classList.contains('enable'))),
                                    suspend: true,
                                    packet: new Packet({
                                        task: 'reachable?',
                                        src: packet.src,
                                        ignore: sibling ? [this, ...packet.ignore] : packet.ignore,
                                        RID: packet.RID
                                    })
                                })
                            ) : true;
                            console.info(`reachable? ${reachable}\n`, `routelogs: ${str(routelogs)}`);
                            routelogs.edit('reachable?', this.name, reachable, packet.RID);
                            
                            if (reachable) break;
                        }

                        this.state('disable');
                        this.transmit({
                            gateway: this.exportGate,
                            suspend: false,
                            packet: new Packet({
                                task: 'disable',
                                src: this,
                                RID: packet.RID
                            })
                        })

                    }
                }
                break;
            }

            case 'enable': {
                response = null;
                switch (true) {
                    case this.classList.contains('disable'): {
                        if (this.proto.import?.includes(packet.router.name)) this.state('standby');
                        break;
                    }
                    case this.classList.contains('standby'): break;
                    case this.classList.contains('enable'): break;
                }
                break;
            }
            
            case 'reachable?': {
                response = false;
                switch (true) {
                    case this.classList.contains('disable'): break;
                    case this.classList.contains('standby'): break;
                    case this.classList.contains('enable'): {
                        const input = this.importNode.filter((node) => (node.classList.contains('enable')));
                        if (input) /* has other active node connecting */ {
                            const sibling = [this.proto.import, this.proto.export].every((arr) => arr?.includes(packet.router.name) ?? true);
                            response = this.proto.import ? (
                                logs_reachable ?? this.transmit({
                                    gateway: this.importGate.filter((gate) => gate.toward.some((node) => node.classList.contains('enable'))),
                                    suspend: true,
                                    packet: new Packet({
                                        task: 'reachable?',
                                        src: packet.src,
                                        ignore: sibling ? [this, ...packet.ignore] : packet.ignore,
                                        RID: packet.RID
                                    })
                                })
                            ) : true;
                            console.info(`reachable? ${response}\n`, `routelogs: ${str(routelogs)}`);
                            routelogs.edit('reachable?', this.name, response, packet.RID);
                            
                            if (response) break;
                        }

                        this.state('disable');
                        this.transmit({
                            gateway: this.exportGate,
                            suspend: false,
                            packet: new Packet({
                                task: 'disable',
                                src: this,
                                RID: packet.RID
                            })
                        })

                    }
                }
                break;
            }

        }

        console.groupEnd();
        console.info(`${this.info} task "${packet.task}" was over. return: ${response}`);
        return response;
    }

}

class WIRE extends UNIT {
    #upperImg;
    #lowerImg;

    constructor(axis) {
        super(axis);
        this.#upperImg = document.createElement('img');
        this.#lowerImg = document.createElement('img');
        this.#upperImg.style.zIndex = 1;
        this.#lowerImg.style.zIndex = 0;
    }

    get html() {
        const fragment = document.createDocumentFragment();
        fragment.appendChild(this.#upperImg);
        fragment.appendChild(this.#lowerImg);
        return fragment;
    }

    get info() {return `Wire [${this.axis}]`}

    /**
     * @param {Direction} pos 
     * @param {NODE} node 
     * @param {Units} closest
     */
    bind(pos, node, closest) {
        super.bind(pos, node, closest);
        this.#update();

        this.gateway.filter((gate) => gate.connect instanceof NODE)
                    .forEach((gate) => {
                        const /** @type {NODE} */ node = gate.connect;
                        const /** @type {Direction} */ pos = Gate.opposite(gate.pos);
                        const family = unique([node.proto.import, node.proto.export].flat());
                        node.gates[pos].connect ??= this;
                        node.gates[pos].toward = (
                            this.gateway.flatMap((_gate) => _gate.toward)
                                        .filter((_node) => family.includes(_node.name))
                        );
                    });
    }

    #update() {
        const seq = {'N': 0, 'S': 1, 'E': 2, 'W': 3};
        
        /** @param {Direction} arg1 @param {Direction} arg2 */
        const rule = (arg1, arg2) => (seq[arg1] > seq[arg2]) ? 1 : ((seq[arg1] < seq[arg2]) ? -1 : 0);
        
        /** @param {Gate[]} gates */
        const stringify = (gates) => gates.map((gate) => gate.pos).sort(rule).join('');
        
        let /** @type {string} */ active;
        active = (active = stringify(
            Object.values(this.gates)
                  .filter((gate) => gate.toward.some((node) => node.classList.contains('enable')))
        )).length > 1 ? active : "";

        const base = `br_${stringify(this.gateway)}`;
        this.#upperImg.className = `${base} ${active}`;
        this.#lowerImg.className = base;
    }

    /**
     * @typedef {Object} WIRE_transmitParams
     * @property {Packet}   packet      original packet
     * @property {boolean}  suspend     stop transmit chain if met criteria in any response (optional, default `false`)
     * @param   {WIRE_transmitParams}
     * @return  {boolean?}
     **/
    transmit({packet, suspend=false}) {
        
        console.groupCollapsed(`${this.info} (Gate ${packet.gate}) received packet.`);

        const response = super.transmit({
            packet: packet,
            gateway: this.gateway.filter((gate) => gate.pos !== packet.gate),
            suspend: suspend
        });

        this.#update();
        console.groupEnd();
        console.info(`${this.info} (Gate ${packet.gate}) return: ${response}`);

        return response;

    }

}

class Archetype extends Set {
    /** @type {HTMLSpanElement} */  #image;
    /** @type {HTMLSpanElement} */  #tooltip;
    /** @type {HTMLSpanElement} */  #head;
    /** @type {html} */             #body;
    /** @type {HTMLSpanElement} */  #foot;
    /** @type {HTMLSpanElement} */  #value;
    /** @type {number} */           #_value;
    /** @type {HTMLSpanElement} */  #prefix;
    /** @type {HTMLSpanElement} */  #suffix;

    /**
     * @param {Archetypes}  name
     * @param {Classes}     clsname
     **/
    constructor(name, clsname) {
        super();
        /** @type {Archetypes} */
        this.name = name;
        /** @type {Classes} */
        this.class = clsname;
        /** @type {HTMLTableCellElement} */
        this.parentElement = undefined;
        
        this.#_value = 0;
        this.#tooltip = document.createElement('span');
        this.#body = languages.reduce((object, lang) => ({...object, [lang]: document.createElement('span')}), {});
        this.#image = document.createElement('img');
        switch (this.name) {
            case 'Boltslinger':
            case 'Battle Monk':
                this.color = 'yellow';
                break;
            case 'Sharpshooter':
            case 'Arcanist':
            case 'Trickster':
                this.color = 'pink';
                break;
            case 'Trapper':
            case 'Ritualist':
                this.color = 'green';
                break;
            case 'Fallen':
            case 'Shadestepper':
            case 'Acolyte':
                this.color = 'red';
                break;
            case 'Paladin':
            case 'Riftwalker':
                this.color = 'blue';
                break;
            case 'Light Bender':
            case 'Acrobat':
                this.color = 'white';
                break;
            case 'Summoner':
                this.color = 'gold';
                break;
        }
        this.#tooltip.classList.add('tooltip');
        this.#image.classList.add('archetype');
        this.#image.classList.add(this.color);
        this.#__head__();
        this.#__body__();
        this.#__foot__();
    }

    /** @return {number} */
    get value() {
        return this.#_value;
    }

    /** @param {number} _val Integer only */
    set value(_val) {
        this.#_value = _val;
        this.#value.textContent = _val;
        this.forEach(/** @param {NODE} node*/(node) => {
            if (node.tooltip.atype) node.tooltip.atype_value = _val;
        });
    }

    #__head__() {
        this.#head = document.createElement('span');
        this.#head.className = `color-${this.color} style-bold`;
        this.#head.textContent = `${this.name} Archetype`;
        this.#head.style.display = 'block';
        this.#head.style.fontSize = '1.4em';
        this.#head.style.lineHeight = '1.4em';
        return this;
    }

    #__body__() {
        languages.forEach(/** @param {Languages} lang */async (lang) => {
            const text = await window.fetch(`https://raw.githubusercontent.com/qiuzilay/Website-Code/main/atree%20v3/resources/texts/${lang}/${this.class}/Archetype%20-%20${this.name}.txt`)
                                        .catch((error) => console.error(error))
                                        .then(/** @param {Response} response */ (response) => response.ok ? response.text() : void(0));
            this.#body[lang].style.display = 'block';
            this.#body[lang].style.marginTop = '1em';
            this.#body[lang].appendChild(Tooltip.analyst(text));
        });
    }

    #__foot__() {
        this.#foot = document.createElement('span');
        this.#foot.className = 'symbol-checkmark';
        this.#foot.style.display = 'block';
        this.#foot.style.marginTop = '1em';
        this.#foot.dataset.update = 'atype_unlocked';

        this.#prefix = document.createTextNode('');

        this.#value = document.createElement('span');
        this.#value.dataset.value = 'atype_unlocked';
        this.#value.textContent = 0;

        this.#suffix = document.createTextNode('/');

        this.#foot.replaceChildren(this.#prefix, this.#value, this.#suffix);
    }

    get html() {
        const lang = translate[languages[using]];
        const fragment = document.createDocumentFragment();

        this.#prefix.textContent = lang.atype_unlocked;
        this.#suffix.textContent = `/${this.size}`;
        
        this.#tooltip.replaceChildren(
            this.#head,
            this.#body[languages[using]],
            this.#foot
        );
        
        fragment.appendChild(this.#image);
        fragment.appendChild(this.#tooltip);

        return fragment;
    }
}

class Orb extends Array {
    #image;
    #tooltip;
    #header;
    #descr;
    #suffix;
    #rmain;
    #info;
    #value;
    #_value;

    /** @param {Classes} clsname*/
    constructor(clsname) {
        super();
        
        /** @type {Classes} */
        this.class = clsname;
        /** @type {HTMLTableCellElement} */
        this.parentElement = undefined;
        this.#_value = 45;

        this.#image = document.createElement('img');
        this.#image.className = 'misc orb';
        
        this.#tooltip = document.createElement('span');
        this.#tooltip.className = 'tooltip';
        
        this.#header = document.createElement('span');
        this.#header.className = 'color-dark_aqua style-bold style-larger';
        this.#header.style.display = 'block';
        this.#header.style.lineHeight = '1.4em';

        this.#descr = document.createElement('span');
        this.#descr.className = 'color-gray';
        this.#descr.style.display = 'block';
        
        this.#value = document.createElement('span');
        this.#value.dataset.value = 'apoint';
        this.#value.textContent = this.#_value;

        this.#suffix = document.createElement('span');
        this.#suffix.className = 'color-gray';

        this.#rmain = document.createElement('span');
        this.#rmain.className = 'color-aqua';
        this.#rmain.style.display = 'block';
        this.#rmain.style.marginTop = '1em';
        
        this.#info = document.createElement('span');
        this.#info.className = 'color-dark_gray';
        this.#info.style.display = 'block';
        this.#info.style.lineHeight = 'normal';

        this.#tooltip.appendChild(this.#header);
        this.#tooltip.appendChild(this.#descr);
        this.#tooltip.appendChild(this.#rmain);
        this.#tooltip.appendChild(this.#info);
    }

    /** @return {number} */
    get value() {
        return this.#_value;
    }

    /** @param {number} _val Integer only */
    set value(_val) {
        const incre = this.#_value < _val;
        this.#value.textContent = this.#_value = _val;
        this.filter((_, cost) => incre ? (cost <= _val) : (cost > _val))
            .forEach(
                /** @param {Set<NODE>} group */
                (group, _) => {
                    group.forEach((node) => {
                        node.tooltip.cost.className = incre ? 'symbol-checkmark' : 'symbol-deny';
                    });
                }
            );
    }

    get html() {
        const lang = translate[languages[using]];
        const fragment = document.createDocumentFragment();

        this.#header.textContent = lang.apoint;
        this.#descr.textContent = lang.apoint_descr;
        this.#suffix.replaceChildren(this.#value, '/45');
        this.#rmain.replaceChildren(`\u2726 ${lang.apoint_rmain}`, this.#suffix);
        this.#info.textContent = [lang.apoint_info1, lang.apoint_info2].join('\n');
        
        fragment.appendChild(this.#image);
        fragment.appendChild(this.#tooltip);

        return fragment;
    }
}

class Tooltip {
    /** @type {HTMLSpanElement} */  #tooltip;
    /** @type {HTMLSpanElement} */  #head;
    /** @type {html}            */  #body;
    /** @type {HTMLSpanElement} */  #foot;
    /** @type {HTMLSpanElement} */  #lock;
    /** @type {Text}            */  #lock_prefix;
    /** @type {HTMLSpanElement} */  #cost;
    /** @type {Text}            */  #cost_prefix;
    /** @type {HTMLSpanElement} */  #rely;
    /** @type {Text}            */  #rely_prefix;
    /** @type {HTMLSpanElement} */  #atype;
    /** @type {Text}            */  #atype_prefix;
    /** @type {HTMLSpanElement} */  #atype_value;
    static #regex = {
        reset: new RegExp(/\u00A7r/, 'gus'),
        general: new RegExp(/\u00A7\S/, 'us'),
        text: new RegExp(/\u00A7\S(.+)/, 'us')
    };

    /**
     * @typedef {Object} html
     * @property {HTMLSpanElement} en
     * @property {HTMLSpanElement} zh-TW
     * @param {NODE} node
     **/
    constructor(node) {
        /** @type {NODE} */
        this.master = node;

        this.#tooltip = document.createElement('span');
        this.#tooltip.className = 'tooltip';
        this.#body = languages.reduce((object, lang) => ({...object, [lang]: document.createElement('span')}), {});
        this.#__head__();
        this.#__body__();
        this.#__foot__();        
    }
    
    get cost() {return this.#cost}

    get rely() {return this.#rely}

    get atype() {return this.#atype}

    get atype_value() {
        return this.#atype_value ? parseInt(this.#atype_value.textContent) : undefined;
    }

    /** @param {number} _val */
    set atype_value(_val) {
        this.#atype_value.textContent = _val;
        this.#atype.className = (_val >= this.master.proto.archetype.req) ? 'symbol-checkmark' : 'symbol-deny';
    }

    get html() {
        const lang = translate[languages[using]];
        const node = this.master.proto;

        if (this.#lock_prefix) this.#lock_prefix.textContent = lang.lock;
        if (this.#cost_prefix) this.#cost_prefix.textContent = lang.cost;
        if (this.#rely_prefix) this.#rely_prefix.textContent = lang.rely;
        if (this.#atype_prefix) this.#atype_prefix.textContent = lang.atype(node.archetype.name);
        this.#tooltip.replaceChildren(
            this.#head,
            this.#body[languages[using]],
            this.#foot
        );
        return this.#tooltip;
    }

    #__head__() {
        const node = this.master.proto;

        this.#head = document.createElement('span');
        this.#head.className = 'tooltip-header';

        const name = document.createElement('span');
        name.className = 'style-bold';
        name.textContent = node.realname ?? node.name;
        name.style.display = 'block';
        name.style.fontSize = '1.4em';
        name.style.lineHeight = '1.4em';
        switch (node.level) {
            case 0: name.classList.add('color-green'); break;
            case 1: name.classList.add('color-white'); break;
            case 2: name.classList.add('color-gold'); break;
            case 3: name.classList.add('color-pink'); break;
            case 4: name.classList.add('color-red'); break;
        }
        this.#head.appendChild(name);

        if (node.combo) {
            const combo = document.createElement('span');
            combo.style.display = 'block';

            const descr = document.createElement('span');
            descr.className = 'color-gold';
            descr.textContent = 'Click Combo: ';

            const click = Array.from(node.combo).map((button) => {
                const span = document.createElement('span');
                span.className = 'color-pink';
                switch (button) {
                    case 'L': span.textContent = 'LEFT'; break;
                    case 'R': span.textContent = 'RIGHT'; break;
                }
                return span.outerHTML;
            }).join('-');

            combo.innerHTML = descr.outerHTML + click;
            this.#head.appendChild(combo);
            // const innerHTML =
            //     '<span class="color-gray" display="block">' +
            //         '<span class="color-gold"> Click Combo: </span>' +
            //         Array.from(node.combo).map((button) => {
            //             switch (button) {
            //                 case 'L': return '<span class="color-pink">LEFT</span>'
            //                 case 'R': return '<span class="color-pink">RIGHT</span>'
            //             }
            //         }).join('-') +
            //     '</span>';
            //
            //this.#head.appendChild(generateElement(innerHTML));
        }
    }

    #__body__() {
        const node = this.master;
        languages.forEach(/** @param {Languages} lang */async (lang) => {
            let text;
            try {
                // throw new Error(`<${this.master.name}> Fetching was blocked!`);
                text = await window.fetch(`https://raw.githubusercontent.com/qiuzilay/Website-Code/main/atree%20v3/resources/texts/${lang}/${node.class}/${node.name}.txt`)
                                            .catch((error) => console.error(error))
                                            .then(/** @param {Response} response */ (response) => response.ok ? response.text() : void(0));
            } catch (E) {
                console.info(E);
            } finally {
                this.#body[lang].appendChild(Tooltip.analyst(text));
                this.#body[lang].className = `tooltip-body ${lang}`;
                this.#body[lang].style.display = 'block';
                this.#body[lang].style.marginTop = '1em';
            }
        });
    }

    #__foot__() {
        const node = this.master.proto;
        const data = routedata[this.master.class];
        this.#foot = document.createElement('span');
        this.#foot.className = 'tooltip-footer';

        if (node.lock) {
            this.#lock = document.createElement('span');
            this.#lock.className = 'color-red';
            this.#lock.style.display = 'block';
            this.#lock.style.marginTop = '1em';
            
            this.#lock_prefix = document.createTextNode('');

            this.#lock.appendChild(this.#lock_prefix);
            
            node.lock.forEach((name) => {
                this.#lock.appendChild(
                    generateElement(`<span style="display: block;">- <span class="color-gray">${name}</span></span>`)
                );
            });

            this.#foot.appendChild(this.#lock);

            node.lock.forEach((name) => {
                try {
                    data.lock[name].add(this.master);
                } catch {
                    data.lock[name] = new Set([this.master]);
                }
            })
        }

        if (node.archetype?.name) {
            const atype = data.archetype[node.archetype.name];
            const archetype = document.createElement('span');
            archetype.style.display = 'block';
            archetype.style.marginTop = '1em';
            archetype.className = `style-bold style-larger color-${atype.color}`;
            archetype.textContent = `${node.archetype.name} Archetype`;
            this.#foot.appendChild(archetype);

            atype.add(this.master);
        }
        
        if (node.cost) {
            this.#cost = document.createElement('span');
            this.#cost.classList.add('symbol-checkmark');
            this.#cost.style.display = 'block';
            this.#cost.style.marginTop = '1em';
            this.#cost.dataset.update = 'cost';

            this.#cost_prefix = document.createTextNode('');
            
            const value = document.createElement('span');
            value.dataset.value = 'cost';
            value.textContent = node.cost;
            
            this.#cost.append(this.#cost_prefix, value);
            this.#foot.appendChild(this.#cost);
            try {
                data.cost[node.cost].add(this.master);
            } catch {
                data.cost[node.cost] = new Set([this.master]);
            }
        }

        if (node.rely) {
            this.#rely = document.createElement('span');
            this.#rely.style.display = 'block';
            this.#rely.className = 'symbol-deny';
            this.#rely.dataset.update = 'rely';

            this.#rely_prefix = document.createTextNode('');

            const relied = document.createElement('span');
            relied.dataset.value = 'rely';
            relied.textContent = node.rely;
            
            this.#rely.append(this.#rely_prefix, relied);
            this.#foot.appendChild(this.#rely);
            try {
               data.rely[node.rely].add(this.master);
            } catch {
               data.rely[node.rely] = new Set([this.master]);
            }
        }

        if (node.archetype?.req) {
            this.#atype = document.createElement('span');
            this.#atype.className = 'symbol-deny';
            this.#atype.style.display = 'block';
            this.#atype.dataset.update = 'archetype';

            this.#atype_prefix = document.createTextNode('');

            this.#atype_value = document.createElement('span');
            this.#atype_value.dataset.value = 'archetype';
            this.#atype_value.textContent = '0';

            this.#atype.append(this.#atype_prefix, this.#atype_value, `/${node.archetype.req}`);
            this.#foot.appendChild(this.#atype);
        }
    }


    /**
     * @param {string} string
     * @return {string}
     **/
    static analyst(string) {
        
        function analyzer(subtext) {
            const [outer, inner, _] = subtext.split(Tooltip.#regex.text);
            const bin = document.createDocumentFragment();
            if (outer) {bin.appendChild(document.createTextNode(outer))}
            if (inner) {
                const style = Tooltip.palette(subtext.match(Tooltip.#regex.general)?.shift());
                style.appendChild(analyzer(inner));
                bin.appendChild(style);
            }
            return bin;
        }

        const fragment = document.createDocumentFragment();
        
        string?.split(Tooltip.#regex.reset).forEach((text) => {
            if (text) fragment.appendChild(analyzer(text));
        });

        return fragment;
    }

    /**
     * @param {string} hashtag
     * @return {HTMLSpanElement}
     **/
    static palette(hashtag) {
        const span = document.createElement('span');
        switch (hashtag) {
            case '\u00A70': span.classList.add('color-black'); break;
            case '\u00A71': span.classList.add('color-dark_blue'); break;
            case '\u00A72': span.classList.add('color-dark_green'); break;
            case '\u00A73': span.classList.add('color-dark_aqua'); break;
            case '\u00A74': span.classList.add('color-dark_red'); break;
            case '\u00A75': span.classList.add('color-dark_purple'); break;
            case '\u00A76': span.classList.add('color-gold'); break;
            case '\u00A77': span.classList.add('color-gray'); break;
            case '\u00A78': span.classList.add('color-dark_gray'); break;
            case '\u00A79': span.classList.add('color-blue'); break;
            case '\u00A7a': span.classList.add('color-green'); break;
            case '\u00A7b': span.classList.add('color-aqua'); break;
            case '\u00A7c': span.classList.add('color-red'); break;  
            case '\u00A7d': span.classList.add('color-pink'); break;
            case '\u00A7e': span.classList.add('color-yellow'); break;
            case '\u00A7f': span.classList.add('color-white'); break;
            case '\u00A7l': span.classList.add('style-bold'); break;
            case '\u00A7n': span.classList.add('style-underline'); break;
            case '\u00A7o': span.classList.add('style-smaller'); break;
            case '\u00A7h': span.classList.add('style-larger'); break;
            case '\u00A7I': span.classList.add('style-oblique'); break;
            case '\u00A7B': span.classList.add('style-wrapper'); break;
            case '\u00A7U': span.classList.add('symbol-neutral'); break;
            case '\u00A7E': span.classList.add('symbol-earth'); break; 
            case '\u00A7T': span.classList.add('symbol-thunder'); break; 
            case '\u00A7W': span.classList.add('symbol-water'); break; 
            case '\u00A7F': span.classList.add('symbol-fire'); break;
            case '\u00A7A': span.classList.add('symbol-air'); break;
            case '\u00A7M': span.classList.add('symbol-mana'); break;
            case '\u00A7Y': span.classList.add('symbol-checkmark'); break;
            case '\u00A7N': span.classList.add('symbol-deny'); break;
            case '\u00A7S': span.classList.add('symbol-sword'); break;
            case '\u00A7D': span.classList.add('symbol-duration'); break;
            case '\u00A7R': span.classList.add('symbol-range'); break;
            case '\u00A7O': span.classList.add('symbol-aoe'); break;
            case '\u00A7H': span.classList.add('symbol-heart'); break;
            case '\u00A7V': span.classList.add('symbol-shield'); break;
            case '\u00A7G': span.classList.add('symbol-gap'); break;
        }
        return span;
    }

}

class Tree extends Array {
    /**
     * @param {number} row 
     * @param {number} col
     * @return {?Units}
     **/
    read(row, col) {
        while (this.length <= row) {this[this.length] ||= Tree.newline()}
        return this[row][col];
    }

    static newline(column, delcount, value) {
        const line = new Array(9).fill(null);
        if ([column, delcount, value].every((arg) => arg !== undefined)) line.splice(column, delcount, value);
        return line;
    }
}

var route = 0;
const str = JSON.stringify;
/**
 * @function
 * @template T
 * @param {T[]} arr
 * @return {T[]}
 **/
const unique = (arr) => Array.from(new Set(arr));
/**
 * @function
 * @template T
 * @param {T[]} arr
 * @return {T}
 **/
const random = (arr) => arr[Math.floor(Math.random() * arr.length)];
const audio = {
    high: new SoundEffect('end_portal_high.wav'),
    medium: new SoundEffect('end_portal_medium.wav'),
    low: new SoundEffect('end_portal_low.wav'),
    levelup: new SoundEffect('levelup.wav')
};
const translate = {
    "zh-TW": {
        cost: "技能點數\uFF1A",
        rely: "技能需求\uFF1A",
        lock: "衝突技能\uFF1A",
        atype: /** @param {String} type */ (type) => `最低 ${type} Archetype 點數需求\uFF1A`,
        atype_unlocked: "已解鎖技能\uFF1A",
        apoint: "技能點",
        apoint_descr: "技能點可以用來解鎖新的技能",
        apoint_rmain: "剩餘點數\uFF1A",
        apoint_info1: "\uFF08左鍵點擊複製分享連結\uFF09",
        apoint_info2: "\uFF08Shift+左鍵重置技能樹\uFF09",
        archer: "弓箭手",
        warrior: "戰士",
        mage: "法師",
        assassin: "刺客",
        shaman: "薩滿"
    },
    "en": {
        cost: "Ability Points: ",
        rely: "Required Ability: ",
        lock: "Unlocking will block: ",
        atype: /** @param {String} type */ (type) => `Min ${type} Archetype: `,
        atype_unlocked: "Unlocked Abilities: ",
        apoint: "Ability Points",
        apoint_descr: "Ability Points are used to unlock new abilities",
        apoint_rmain: "Available Points: ",
        apoint_info1: "(Left-Click to copy URL to clipboard)",
        apoint_info2: "(Shift + Left-Click to reset Ability Tree)",
        archer: "Archer",
        warrior: "Warrior",
        mage: "Mage",
        assassin: "Assassin",
        shaman: "Shaman"
    }
};
const routedata = {
    archer: {
        cost: new Orb('archer'),
        /** @type {Object<string, Set<NODE>>} */lock: {},
        /** @type {Object<string, Set<NODE>>} */rely: {},
        archetype: {
            "Boltslinger": new Archetype('Boltslinger', 'archer'),
            "Trapper": new Archetype('Trapper', 'archer'),
            "Sharpshooter": new Archetype('Sharpshooter', 'archer')
        }
    },
    warrior: {
        cost: new Orb('warrior'),
        /** @type {Object<string, Set<NODE>>} */lock: {},
        /** @type {Object<string, Set<NODE>>} */rely: {},
        archetype: {
            "Fallen": new Archetype('Fallen', 'warrior'),
            "Battle Monk": new Archetype('Battle Monk', 'warrior'),
            "Paladin": new Archetype('Paladin', 'warrior')
        }
    },
    mage: {
        cost: new Orb('mage'),
        /** @type {Object<string, Set<NODE>>} */lock: {},
        /** @type {Object<string, Set<NODE>>} */rely: {},
        archetype: {
            "Riftwalker": new Archetype('Riftwalker', 'mage'),
            "Light Bender": new Archetype('Light Bender', 'mage'),
            "Arcanist": new Archetype('Arcanist', 'mage')
        }
    },
    assassin: {
        cost: new Orb('assassin'),
        /** @type {Object<string, Set<NODE>>} */lock: {},
        /** @type {Object<string, Set<NODE>>} */rely: {},
        archetype: {
            "Shadestepper": new Archetype('Shadestepper', 'assassin'),
            "Trickster": new Archetype('Trickster', 'assassin'),
            "Acrobat": new Archetype('Acrobat', 'assassin')
        }
    },
    shaman: {
        cost: new Orb('shaman'),
        /** @type {Object<string, Set<NODE>>} */lock: {},
        /** @type {Object<string, Set<NODE>>} */rely: {},
        archetype: {
            "Summoner": new Archetype('Summoner', 'shaman'),
            "Ritualist": new Archetype('Ritualist', 'shaman'),
            "Acolyte": new Archetype('Acolyte', 'shaman')
        }
    }
}
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
const routemap = {
    "archer": new Tree(),
    "warrior": new Tree(),
    "mage": new Tree(),
    "assassin": new Tree(),
    "shaman": new Tree()
};
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