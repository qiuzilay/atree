"use strict";

/** @global */
class SoundEffect extends Audio {

    /** @param {string} filename */
    constructor(filename) {
        super("./resources/audios/" + filename);
        this.controls = false;
        this.preload = true;
        this.preservesPitch = false;
        this.mozPreservesPitch = false;
        this.webkitPreservesPitch = false;
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

/** @global */
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
     * @param {ARCHETYPES}  name
     * @param {CLASSES}     clsname
     **/
    constructor(name, clsname) {
        super();
        /** @type {ARCHETYPES} */
        this.name = name;
        /** @type {CLASSES} */
        this.class = clsname;
        /** @type {HTMLTableCellElement} */
        this.parentElement = undefined;
        
        this.#_value = 0;
        this.#tooltip = document.createElement('span');
        this.#body = languages.reduce((object, lang) => ({...object, [lang]: document.createElement('span')}), {});
        this.#image = document.createElement('span');
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
        this.#image.classList.add(`archetype-${this.color}`);
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
        languages.forEach(/** @param {LANGUAGES} lang */async (lang) => {
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
        const lang = dict[languages[using]];
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

/** @global */
class Orb extends Array {
    #image;
    #tooltip;
    #header;
    #descr;
    #suffix;
    #rmain;
    #rmain_text;
    #info;
    #value;
    #_value;
    #timeoutID;
    static #confirm_tooltip = document.createElement('span');
    static #confirm_text = document.createElement('span');
    static #confirm_image = document.createElement('span');
    static {
        this.#confirm_tooltip.appendChild(this.#confirm_text);
        this.#confirm_tooltip.className = 'tooltip'
        this.#confirm_image.className = 'misc-confirm';
        this.#confirm_text.className = 'color-red style-larger';
        this.#confirm_text.style.display = 'block';
        this.#confirm_text.style.lineHeight = '1.4em';
    }

    /** @param {CLASSES} clsname*/
    constructor(clsname) {
        super();
        
        /** @type {CLASSES} */
        this.class = clsname;
        /** @type {HTMLTableCellElement} */
        this.parentElement = undefined;
        this.confirming = false;
        this.#_value = 45;

        this.#image = document.createElement('span');
        this.#image.className = 'misc-orb';
        
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

        this.#rmain_text = document.createTextNode('');
        
        this.#info = document.createElement('span');
        this.#info.className = 'color-dark_gray';
        this.#info.style.display = 'block';
        this.#info.style.lineHeight = 'normal';

        this.#tooltip.appendChild(this.#header);
        this.#tooltip.appendChild(this.#descr);
        this.#tooltip.appendChild(this.#rmain);
        this.#tooltip.appendChild(this.#info);
    }

    get value() {
        return this.#_value;
    }

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
        const fragment = document.createDocumentFragment();

        this.refresh();
        this.#suffix.replaceChildren(this.#value, '/45');
        this.#rmain.replaceChildren(this.#rmain_text, this.#suffix);
        
        fragment.appendChild(this.#image);
        fragment.appendChild(this.#tooltip);

        return fragment;
    }

    refresh() {
        const lang = dict[languages[using]];
        this.#header.textContent = lang.apoint;
        this.#descr.textContent = lang.apoint_descr;
        this.#rmain_text.textContent = `\u2726 ${lang.apoint_rmain}`;
        this.#info.textContent = [lang.apoint_info1, lang.apoint_info2].join('\n');
        Orb.#confirm_text.textContent = lang.reset_confirm;
    }

    confirm() {
        this.confirming = true;
        this.#timeoutID = setTimeout(() => {
            this.restore();
        }, 3000);
        Orb.#confirm_text.textContent = dict[languages[using]].reset_confirm;
        this.parentElement.replaceChildren(Orb.#confirm_image, Orb.#confirm_tooltip);
    }

    restore() {
        this.confirming = false;
        this.#image.classList.remove('confirm');
        clearTimeout(this.#timeoutID);
        this.parentElement.replaceChildren(this.html);
    }
}

/** @global */
class Tooltip {
    /** @type {HTMLSpanElement} */  #tooltip;
    /** @type {HTMLSpanElement} */  #head;
    /** @type {html}            */  #body;
    /** @type {HTMLSpanElement} */  #foot;
    /** @type {HTMLSpanElement} */  #block;
    /** @type {Text}            */  #block_prefix;
    /** @type {HTMLSpanElement} */  #cost;
    /** @type {Text}            */  #cost_prefix;
    /** @type {HTMLSpanElement} */  #required;
    /** @type {Text}            */  #required_prefix;
    /** @type {HTMLSpanElement} */  #atype;
    /** @type {Text}            */  #atype_prefix;
    /** @type {HTMLSpanElement} */  #atype_value;

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

    get required() {return this.#required}

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
        const lang = dict[languages[using]];
        const node = this.master.proto;

        if (this.#block_prefix) this.#block_prefix.textContent = lang.block;
        if (this.#cost_prefix) this.#cost_prefix.textContent = lang.cost;
        if (this.#required_prefix) this.#required_prefix.textContent = lang.required;
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
        name.textContent = node.display.name;
        name.style.display = 'block';
        name.style.fontSize = '1.4em';
        name.style.lineHeight = '1.4em';
        switch (node.display.icon) {
            case "button_1": name.classList.add('color-white'); break;
            case "button_2": name.classList.add('color-gold'); break;
            case "button_3": name.classList.add('color-pink'); break;
            case "button_4": name.classList.add('color-red'); break;
            default: name.classList.add('color-green');
        }
        this.#head.appendChild(name);

        if (node.display.combo) {
            const combo = document.createElement('span');
            combo.style.display = 'block';

            const descr = document.createElement('span');
            descr.className = 'color-gold';
            descr.textContent = 'Click Combo: ';

            const click = Array.from(node.display.combo).map((button) => {
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
        }
    }

    #__body__() {
        const node = this.master;
        languages.forEach(/** @param {LANGUAGES} lang */async (lang) => {
            let text;
            try {
                // throw new Error(`<${this.master.name}> Fetching was blocked!`);
                text = await window.fetch(`https://raw.githubusercontent.com/qiuzilay/atree/gh-pages/resources/texts/${lang}/${node.class}/${node.name}.txt`)
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

        if (node.block) {
            this.#block = document.createElement('span');
            this.#block.className = 'color-red';
            this.#block.style.display = 'block';
            this.#block.style.marginTop = '1em';
            
            this.#block_prefix = document.createTextNode('');

            this.#block.appendChild(this.#block_prefix);
            
            node.block.forEach((name) => {
                this.#block.appendChild(
                    generateElement(`<span style="display: block;">- <span class="color-gray">${name}</span></span>`)
                );
            });

            this.#foot.appendChild(this.#block);

            node.block.forEach((name) => {
                try {
                    data.block[name].add(this.master);
                } catch {
                    data.block[name] = new Set([this.master]);
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

        if (node.required) {
            this.#required = document.createElement('span');
            this.#required.style.display = 'block';
            this.#required.className = 'symbol-deny';
            this.#required.dataset.update = 'required';

            this.#required_prefix = document.createTextNode('');

            const relied = document.createElement('span');
            relied.dataset.value = 'required';
            relied.textContent = node.required;
            
            this.#required.append(this.#required_prefix, relied);
            this.#foot.appendChild(this.#required);
            try {
               data.required[node.required].add(this.master);
            } catch {
               data.required[node.required] = new Set([this.master]);
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
            const [outer, inner, _] = subtext.split(REGEX_REFINED_SPLIT);
            const bin = document.createDocumentFragment();
            if (outer) {bin.appendChild(document.createTextNode(outer))}
            if (inner) {
                const style = Tooltip.palette(subtext.match(REGEX_SECTION_MATCH)?.shift());
                style.appendChild(analyzer(inner));
                bin.appendChild(style);
            }
            return bin;
        }

        const fragment = document.createDocumentFragment();
        
        string?.split(REGEX_DELIMITER_SPLIT).forEach((text) => {
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

/**
 * @global
 **/
class Tree extends Array {
    /**
     * @param {number} row 
     * @param {number} col
     * @return {?COMPONENT}
     **/
    read(row, col) {
        while (this.length <= row) {this[this.length] ||= Tree.newline()}
        return this[row][col];
    }

    encode() {
        const dtoh = /** @param {number} num */ (num) => num.toString(16).padStart(2, 0);
        const logs = [];
        for (const row of this) {
            for (const elem of row) {
                if ((elem instanceof NODE) && (elem.classList.contains('enable'))) {
                    logs.push(Array.from(elem.axis, dtoh).join(''));
                }
            }
        }
        return logs.join('');
    }

    /**
     * @param {number} column 
     * @param {number} delcount 
     * @param {NODE | PIPE} value 
     * @return 
     */
    static newline(column, delcount, value) {
        const line = new Array(9).fill(null);
        if ([column, delcount, value].every((arg) => arg !== undefined))
            line.splice(column, delcount, value);
        return line;
    }
}