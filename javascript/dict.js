"use strict";

/** @global */
const dict = {
    "zh-TW": {
        cost: "技能點數\uFF1A",
        required: "技能需求\uFF1A",
        block: "衝突技能\uFF1A",
        atype: /** @param {String} type */ (type) => `最低 ${type} Archetype 點數需求\uFF1A`,
        atype_unlocked: "已解鎖技能\uFF1A",
        apoint: "技能點",
        apoint_descr: "技能點可以用來解鎖新的技能",
        apoint_rmain: "剩餘點數\uFF1A",
        apoint_info1: "\uFF08左鍵點擊複製分享連結\uFF09",
        apoint_info2: "\uFF08Shift+左鍵重置技能樹\uFF09",
        reset_confirm: "重置技能樹？",
        archer: "弓箭手",
        warrior: "戰士",
        mage: "法師",
        assassin: "刺客",
        shaman: "薩滿"
    },
    "en": {
        cost: "Ability Points: ",
        required: "Required Ability: ",
        block: "Unlocking will block: ",
        atype: /** @param {String} type */ (type) => `Min ${type} Archetype: `,
        atype_unlocked: "Unlocked Abilities: ",
        apoint: "Ability Points",
        apoint_descr: "Ability Points are used to unlock new abilities",
        apoint_rmain: "Available Points: ",
        apoint_info1: "(Left-Click to copy URL to clipboard)",
        apoint_info2: "(Shift + Left-Click to reset Ability Tree)",
        reset_confirm: "Reset the entire Ability Tree?",
        archer: "Archer",
        warrior: "Warrior",
        mage: "Mage",
        assassin: "Assassin",
        shaman: "Shaman"
    }
};