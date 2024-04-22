/** @global */
const TABELEMENTS = document.getElementById('tab').getElementsByClassName('tab_button');
/** @global */
const ENABLE = "enable";
/** @global */
const DISABLE = "disable";
/** @global */
const STANDBY = "standby";
/** @global */
const LOCKED = "locked";
/** @global */
const REACHABLE = "reachable?";
/** @global */
const N = 'N';
/** @global */
const S = 'S';
/** @global */
const E = 'E';
/** @global */
const W = 'W';

// /** @global */
// const REGEX_PROPERTY_FORMAT = new RegExp(/(?:[^\s]*\([^)]+\)[^\s]*)|(?:[^\s]*"[^"]+"[^\s]*)|\S/, "gs")

/** @global */
const REGEX_DELIMITER_SPLIT = new RegExp(/\u00A7r/, 'gus');
/** @global */
const REGEX_SECTION_MATCH = new RegExp(/\u00A7\S/, 'us');
/** @global */
const REGEX_REFINED_SPLIT = new RegExp(/\u00A7\S(.+)/, 'us');