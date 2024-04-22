"use strict";

/** @global */
class Packet {
    /**    
     * @typedef  {Object}           params      
     * @property {string}           task        command
     * @property {string}           response    response (optional)
     * @property {NODE}             src         source
     * @property {NODE[]}           dest        destinations
     * @property {NODE | NODE[]}    ignore      ignore List
     * @property {DIRECTION}        gate        the gate which the packet came through
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
        /** @type {DIRECTION} */
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

/** @global */
class Gate {

    constructor(pos) {
        /** @type {DIRECTION} */
        this.pos = pos;
        /** @type {Set<NODE>} */
        this.__toward = new Set();
        /** @type {COMPONENT}} */
        this.connect = null;
    }

    get bound() {return this.toward.length ? true : false}

    get toward() {return Array.from(this.__toward)}

    set toward(iter) {this.__toward = new Set(iter)}

    static opposite(dir) {
        switch (dir) {
            case N: return S;
            case S: return N;
            case E: return W;
            case W: return E;
            default: throw Error('invalid direction.')
        }
    }

}

/** @global */
class UNIT {

    /**
     * @typedef  {Object}   axis
     * @property {number}   axis.row
     * @property {number}   axis.col
     * @param {axis} axis
     **/
    constructor(axis) {
        /** @type {axis} */
        this.axis = axis;
        this.gates = {
            N: new Gate(N),
            S: new Gate(S),
            E: new Gate(E),
            W: new Gate(W),
        };
    }

    get gateway() {return Object.values(this.gates).filter((gate) => gate.bound)}

    get info() { /** abstract property */ }
    
    /**
     * @param {DIRECTION}   pos
     * @param {NODE}        node
     * @param {COMPONENT}       closest
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
                suspend: suspend // 給 PIPE 看的
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

/** @global */
class NODE extends UNIT {

    static #stateList = [ENABLE, DISABLE, STANDBY, LOCKED];

    /**
     * @typedef     {Object}            NodeInfo
     * @property    {String}                name
     * @property    {String[]?}             import
     * @property    {String[]?}             export
     * @property    {String[]?}             block
     * @property    {String}                demand
     * @property    {Number}                cost
     * @property    {Object}                archetype
     * @property    {ARCHETYPES}                archetype.name
     * @property    {Number}                    archetype.req
     * @property    {Object}                display
     * @property    {String}                    display.name
     * @property    {String | undefined}        display.combo
     * @property    {String}                    display.icon
     * @property    {Number}                    display.row
     * @property    {Number}                    display.col
     * @property    {String[]}              draft
     * 
     * @param {CLASSES} clsname
     * @param {NodeInfo}   info
     */
    constructor(clsname, info) {
        const axis = {
            row: info.display.row,
            col: info.display.col
        };
        super(axis);
        /** @type {NodeInfo} */
        this.proto = info;
        /** @type {String} */
        this.name = info.name;
        /** @type {CLASSES} */
        this.class = clsname;
        /** @type {Tooltip} */
        this.tooltip = new Tooltip(this);
        /** @type {HTMLTableCellElement} */
        this.parentElement = undefined;
        /** @type {HTMLButtonElement} */
        this.buttonElement = document.createElement('button');
        /** @type {DOMTokenList} */
        this.classList = this.buttonElement.classList;

        // Set "standby" if is the first node else "disable"
        this.classList.add(((axis.row === 1) && (axis.col === 4)) ? STANDBY : DISABLE);
        this.buttonElement.appendChild(generateElement(`<img class="${info.display.icon}">`));
        
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
        /** @type {Tree} */
        const tree = routemap[this.class];
        this.proto.draft.forEach((path) => {

            let row = this.proto.display.row;
            let col = this.proto.display.col;
            let obj = this;
            
            Array.from(path).forEach((dir) => {

                switch (dir) {
                    case N: row--; break;
                    case S: row++; break;
                    case E: col++; break;
                    case W: col--; break;
                    default: throw Error(`invalid direction "${dir}" detected in the draft of <${this.name}> under ${this.class}.`);
                }

                /** @type {PIPE} */
                const branch = (tree.read(row, col) instanceof PIPE) ? tree[row][col] : new PIPE(this.axis);

                branch.bind(Gate.opposite(dir), this, obj);

                tree[row][col] = obj = branch;

            });
        });
    }

    /** @param {STATES} state  */
    state(state) {

        if (state !== undefined) {
            if (!NODE.#stateList.includes(state)) throw Error(`invalid state of Node was detected at <${this.name}>`);

            const history = Array.from(this.classList);

            NODE.#stateList.forEach((name) => {
                switch (name) {
                    case LOCKED:
                        if (name === state) this.classList.toggle(LOCKED);
                        break;
                    default:
                        if (name !== state) this.classList.remove(name);
                        else this.classList.add(name);
                }
            });

            switch (state) {
                case ENABLE:
                    if (!history.includes(ENABLE)) this.#update(ENABLE);
                    break;
                case DISABLE:
                case STANDBY:
                    if (history.includes(ENABLE)) this.#update(DISABLE);
                    break;
            }

        }
        return this.classList;

    }
    
    click() {
        if (this.#examine()) {
            switch (true) {

                case this.classList.contains(ENABLE):
                    this.state(STANDBY);
                    random([audio.high, audio.medium, audio.low]).play(0.8, 0.5);
                    this.transmit({
                        packet: new Packet({
                            task: STANDBY,
                            src: this,
                            RID: route
                        })
                    });
                    break;

                case this.classList.contains(STANDBY):
                    this.state(ENABLE);
                    random([audio.high, audio.medium, audio.low]).play(0.8, 1.5);
                    this.transmit({
                        packet: new Packet({
                            task: ENABLE,
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
            case this.classList.contains(ENABLE): {
                return true;
            }
            case this.classList.contains(DISABLE): {
                return false;
            }
            case this.classList.contains(LOCKED): {
                const locker = Array.from(dataset.block[this.name])
                                    .filter((node) => node.classList.contains(ENABLE))
                                    .map((node) => `<${node.name}>`);
                console.warn(`<${this.name}> This ability was locked by ${chain(locker)}!`);
                return false;
            }
            case this.tooltip.demand?.classList.contains('symbol-deny'): {
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

    /** @param { "enable" | "disable" } state */
    #update(state) {
        const dataset = routedata[this.class];
        const self = this.proto;
        switch (state) {
            case ENABLE:
                // update remain apoint value in Orb
                // Orb will handle the part of update the tooltip state all the Nodes have
                dataset.cost.value -= self.cost;

                // update current archetype points in Archetype
                // Archetype will handle the part of update the tooltip state all the Nodes have
                if (self.archetype?.name) dataset.archetype[self.archetype.name].value += 1;
                
                // update tooltip footer "Required Ability" status of all Nodes which rely on this node
                dataset.demand[self.name]?.forEach(/** @param {NODE} node*/(node) => {
                    node.tooltip.demand.className = 'symbol-checkmark';
                });

                // add html 'locked' class to state of all Nodes which is locked by this node
                dataset.block[self.name]?.forEach(/** @param {NODE} node*/(node) => {
                    node.buttonElement.classList.add(LOCKED);
                });
                break;

            case DISABLE:
                // update remain apoint value in Orb
                // Orb will handle the part of update the tooltip state all the Nodes have
                dataset.cost.value += self.cost;

                // update current archetype points in Archetype
                // Archetype will handle the part of update the tooltip state all the Nodes have
                if (self.archetype?.name) dataset.archetype[self.archetype.name].value -= 1;
                
                // update tooltip footer "Required Ability" status of all Nodes which rely on this node
                dataset.demand[self.name]?.forEach(/** @param {NODE} node*/(node) => {
                    node.tooltip.demand.className = 'symbol-deny';
                });

                // remove html 'locked' class to state of all Nodes which is locked by this node
                dataset.block[self.name]?.forEach(/** @param {NODE} node*/(node) => {
                    node.buttonElement.classList.remove(LOCKED);
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
            console.info(`Origin packet: ${packet.parse}`);

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
        const logs_reachable = routelogs.prop(REACHABLE, {}, packet.RID)[this.name];

        console.groupCollapsed(`${this.info} start handling the task "${packet.task}".`);
        
        switch (packet.task) {
            
            case STANDBY:
            case DISABLE: {
                response = null;
                switch (true) {
                    case this.classList.contains(DISABLE): break;
                    case this.classList.contains(STANDBY):
                    case this.classList.contains(ENABLE): {
                        const input = this.importNode.filter((node) => (node.classList.contains(ENABLE)));
                        if (input) /* has other active node connecting */ {
                            const sibling = [this.proto.import, this.proto.export].every((arr) => arr?.includes(packet.router.name) ?? true);
                            const children = this.exportNode.filter((node) => !this.proto.import?.includes(node.name));
                            const ignore = [...children, ...packet.ignore];
                            
                            if (input.length > 1) {
                                ignore.push(packet.router);
                            } else if (sibling) {
                                ignore.push(this);
                            }
                            
                            const reachable = this.proto.import ? (
                                logs_reachable ?? this.transmit({
                                    gateway: this.importGate.filter((gate) => gate.toward.some((node) => node.classList.contains(ENABLE))),
                                    suspend: true,
                                    packet: new Packet({
                                        task: REACHABLE,
                                        src: packet.src,
                                        ignore: ignore,
                                        RID: packet.RID
                                    })
                                })
                            ) : true;
                            console.info(`reachable? ${reachable}\n`, `routelogs: ${str(routelogs)}`);
                            routelogs.edit(REACHABLE, this.name, reachable, packet.RID);
                            
                            if (reachable) break;
                        }

                        this.state(DISABLE);
                        this.transmit({
                            gateway: this.exportGate,
                            suspend: false,
                            packet: new Packet({
                                task: DISABLE,
                                src: this,
                                RID: packet.RID
                            })
                        })

                    }
                }
                break;
            }

            case ENABLE: {
                response = null;
                switch (true) {
                    case this.classList.contains(DISABLE): {
                        if (this.proto.import?.includes(packet.router.name)) this.state(STANDBY);
                        break;
                    }
                    case this.classList.contains(STANDBY): break;
                    case this.classList.contains(ENABLE): break;
                }
                break;
            }
            
            case REACHABLE: {
                response = false;
                switch (true) {
                    case this.classList.contains(DISABLE): break;
                    case this.classList.contains(STANDBY): break;
                    case this.classList.contains(ENABLE): {
                        const input = this.importNode.filter((node) => (node.classList.contains(ENABLE)));
                        if (input) /* has other active node connecting */ {
                            const sibling = [this.proto.import, this.proto.export].every((arr) => arr?.includes(packet.router.name) ?? true);
                            const children = this.exportNode.filter((node) => !this.proto.import?.includes(node.name));
                            const ignore = [...children, ...packet.ignore];
                            
                            if (input.length > 1) {
                                ignore.push(packet.router);
                            } else if (sibling) {
                                ignore.push(this);
                            }
                            
                            response = this.proto.import ? (
                                logs_reachable ?? this.transmit({
                                    gateway: this.importGate.filter((gate) => gate.toward.some((node) => node.classList.contains(ENABLE))),
                                    suspend: true,
                                    packet: new Packet({
                                        task: REACHABLE,
                                        src: packet.src,
                                        ignore: ignore,
                                        RID: packet.RID
                                    })
                                })
                            ) : true;
                            console.info(`reachable? ${response}\n`, `routelogs: ${str(routelogs)}`);
                            routelogs.edit(REACHABLE, this.name, response, packet.RID);
                            
                            if (response) break;
                        }

                        this.state(DISABLE);
                        this.transmit({
                            gateway: this.exportGate,
                            suspend: false,
                            packet: new Packet({
                                task: DISABLE,
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

/** @global */
class PIPE extends UNIT {
    #upperImg;
    #lowerImg;

    /** @param {axis} axis */
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

    get info() {return `Pipe [${this.axis.row}-${this.axis.col}]`}

    /**
     * @param {DIRECTION} pos 
     * @param {NODE} node 
     * @param {COMPONENT} closest
     */
    bind(pos, node, closest) {
        super.bind(pos, node, closest);
        this.#update();

        this.gateway.filter((gate) => gate.connect instanceof NODE)
                    .forEach((gate) => {
                        const /** @type {NODE} */ node = gate.connect;
                        const /** @type {DIRECTION} */ pos = Gate.opposite(gate.pos);
                        const family = unique([node.proto.import, node.proto.export].flat());
                        node.gates[pos].connect ??= this;
                        node.gates[pos].toward = (
                            this.gateway.flatMap((_gate) => _gate.toward)
                                        .filter((_node) => family.includes(_node.name))
                        );
                    });
    }

    #update() {
        const seq = {N: 0, S: 1, E: 2, W: 3};
        
        /** @param {DIRECTION} arg1 @param {DIRECTION} arg2 */
        const rule = (arg1, arg2) => (seq[arg1] > seq[arg2]) ? 1 : ((seq[arg1] < seq[arg2]) ? -1 : 0);
        
        /** @param {Gate[]} gates */
        const stringify = (gates) => gates.map((gate) => gate.pos).sort(rule).join('');
        
        let /** @type {string} */ active;
        active = (active = stringify(
            Object.values(this.gates)
                  .filter((gate) => gate.toward.some((node) => node.classList.contains(ENABLE)))
        )).length > 1 ? active : "";

        const base = `br_${stringify(this.gateway)}`;
        this.#upperImg.className = `${base} ${active}`;
        this.#lowerImg.className = base;
    }

    /**
     * @typedef {Object} PIPE_transmitParams
     * @property {Packet}   packet      original packet
     * @property {boolean}  suspend     stop transmit chain if met criteria in any response (optional, default `false`)
     * @param   {PIPE_transmitParams}
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