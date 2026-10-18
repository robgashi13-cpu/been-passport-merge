// @ts-nocheck
// Precise CAMEO classification for GDELT 2.0 export rows (shared by WanderPass and the box dashboard).
// Uses the FULL event code (not just the root) plus actor type codes, so routine police/crime/political
// reporting is no longer labelled "military". Only events with real military markers become
// "conflict"/"military": artillery/air strikes/occupation/blockade codes, or a MIL/REB/INS/SEP/UAF actor.
//
// GDELT 2.0 export columns used: 5/15 actor code, 6/16 actor name, 7/17 actor country, 12-14/22-24 actor
// type codes, 26 EventCode, 27 EventBaseCode, 28 EventRootCode, 52 ActionGeo_FullName, 59 DATEADDED.

const ARMED = new Set(['MIL', 'REB', 'INS', 'SEP', 'UAF']); // military, rebels, insurgents, separatists, unaligned armed forces
const COP = new Set(['COP']);

// code -> [category, human label, verb phrase for the "what happened" sentence]
// category: conflict | attack | military | protest | unrest ; null = not shown on the map
const CODES = {
  // 13 threaten — only threats of force are kept
  '138': ['unrest', 'Threat of force', 'threatened to use force against'],
  '1381': ['unrest', 'Threat of attack', 'threatened to attack'],
  '1382': ['unrest', 'Threat of occupation', 'threatened to occupy'],
  '1383': ['unrest', 'Threat of unconventional violence', 'threatened violence against'],
  '1384': ['unrest', 'Threat of conventional attack', 'threatened a military attack on'],
  '1385': ['unrest', 'Threat of mass violence', 'threatened mass violence against'],
  // 14 protest
  '140': ['protest', 'Political dissent', 'protested against'],
  '141': ['protest', 'Demonstration / rally', 'demonstrated or rallied against'],
  '1411': ['protest', 'Demonstration for leadership change', 'demonstrated for a change in leadership of'],
  '1412': ['protest', 'Demonstration for policy change', 'demonstrated for policy change by'],
  '1413': ['protest', 'Demonstration for rights', 'demonstrated for rights against'],
  '1414': ['protest', 'Demonstration for institutional change', 'demonstrated for change against'],
  '142': ['protest', 'Hunger strike', 'went on hunger strike against'],
  '143': ['protest', 'Strike / boycott', 'went on strike or boycotted'],
  '144': ['protest', 'Protest blockade / obstruction', 'blocked or obstructed'],
  '145': ['protest', 'Violent protest / riot', 'rioted or protested violently against'],
  // 15 posture — police posture is NOT military
  '150': ['unrest', 'Show of force', 'demonstrated police or military power against'],
  '152': ['military', 'Military alert raised', 'raised military alert against'],
  '154': ['military', 'Armed forces mobilized', 'mobilized armed forces against'],
  // 17 coerce
  '171': ['unrest', 'Property seized / damaged', 'seized or damaged property of'],
  '1711': ['unrest', 'Property confiscated', 'confiscated property of'],
  '1712': ['unrest', 'Property destroyed', 'destroyed property of'],
  '173': ['unrest', 'Arrest / detention', 'arrested or detained'],
  '174': ['unrest', 'Expulsion / deportation', 'expelled or deported'],
  '175': ['unrest', 'Violent repression', 'used violent repression against'],
  '176': ['unrest', 'Cyber attack', 'carried out a cyber attack on'],
  // 18 assault (non-military violence)
  '180': ['attack', 'Violent attack', 'attacked'],
  '181': ['attack', 'Abduction / hostage-taking', 'abducted or took hostage'],
  '182': ['attack', 'Physical assault', 'physically assaulted'],
  '1821': ['attack', 'Sexual assault', 'sexually assaulted'],
  '1822': ['attack', 'Torture', 'tortured'],
  '1823': ['attack', 'Killing by physical assault', 'killed'],
  '183': ['attack', 'Bombing', 'carried out a bombing against'],
  '1831': ['attack', 'Suicide bombing', 'carried out a suicide bombing against'],
  '1832': ['attack', 'Vehicle bombing', 'carried out a vehicle bombing against'],
  '1833': ['attack', 'Roadside bombing', 'carried out a roadside bombing against'],
  '1834': ['attack', 'Location bombing', 'bombed a location of'],
  '184': ['attack', 'Human shield', 'used as human shields'],
  '185': ['attack', 'Assassination attempt', 'attempted to assassinate'],
  '186': ['attack', 'Assassination', 'assassinated'],
  // 19 fight — only unambiguous military methods are conflict on their own
  '190': ['attack', 'Reported use of force', 'used force against'],
  '191': ['conflict', 'Blockade', 'imposed a blockade on'],
  '192': ['conflict', 'Occupation of territory', 'occupied territory of'],
  '193': ['attack', 'Armed clash (small arms)', 'fought with small arms against'],
  '194': ['conflict', 'Artillery / tank fire', 'fired artillery or tanks at'],
  '195': ['conflict', 'Airstrike', 'carried out an airstrike on'],
  '1951': ['conflict', 'Precision airstrike', 'carried out a precision airstrike on'],
  '1952': ['conflict', 'Drone strike', 'carried out a drone strike on'],
  '196': ['conflict', 'Ceasefire violation', 'violated a ceasefire with'],
  // 20 mass violence
  '200': ['conflict', 'Mass violence', 'used mass violence against'],
  '201': ['conflict', 'Mass expulsion', 'carried out a mass expulsion of'],
  '202': ['conflict', 'Mass killing', 'carried out mass killings of'],
  '203': ['conflict', 'Ethnic cleansing', 'carried out ethnic cleansing against'],
  '204': ['conflict', 'Weapons of mass destruction', 'used weapons of mass destruction against'],
  '2041': ['conflict', 'Chemical / biological / radiological attack', 'used CBR weapons against'],
  '2042': ['conflict', 'Nuclear weapon detonation', 'detonated a nuclear weapon against'],
};
const MILITARY_WHEN_ARMED = { '190': 'Military force', '193': 'Armed fighting (small arms)', '180': 'Armed attack', '183': 'Bombing' };

const titleCase = (s) => (s || '').toLowerCase().replace(/\b([a-z])/g, (m) => m.toUpperCase()).replace(/\bUs\b/g, 'US').replace(/\bUk\b/g, 'UK').replace(/\bUn\b/g, 'UN').replace(/\bEu\b/g, 'EU').replace(/\bNato\b/g, 'NATO');

function actor(c, base) {
  const name = c[base + 1] || '';
  const types = [c[base + 7], c[base + 8], c[base + 9]].filter(Boolean);
  const code = c[base] || '';
  const armed = types.some((t) => ARMED.has(t)) || /(MIL|REB|INS|SEP|UAF)/.test(code.slice(3));
  const police = types.some((t) => COP.has(t)) || /COP/.test(code.slice(3));
  return { name: titleCase(name), country: c[base + 2] || null, types, armed, police };
}

/** Returns null when the row should not be shown, else { type, label, verb, severity, a1, a2, armed }. */
export function classifyCameo(c) {
  const code = c[26] || '';
  const base = c[27] || '';
  const def = CODES[code] || CODES[base];
  if (!def) return null;
  const a1 = actor(c, 5), a2 = actor(c, 15);
  const armed = a1.armed || a2.armed;
  let [type, label, verb] = def;
  const k = CODES[code] ? code : base;
  if (MILITARY_WHEN_ARMED[k] && armed) { type = 'conflict'; label = MILITARY_WHEN_ARMED[k]; }
  if (k === '190' && !armed && (a1.police || a2.police)) label = 'Police use of force';
  // mass-violence and military-method codes without any armed actor are frequently mis-coded crime or rhetoric
  if (type === 'conflict' && !armed && /^(200|201|202|203|196)$/.test(k)) { type = 'attack'; }
  const severity = type === 'conflict' ? 3 : type === 'attack' ? (/^(183|186|1823|202)/.test(k) ? 3 : 2) : k === '145' || k === '175' ? 2 : 1;
  return { type, label, verb, severity, a1, a2, armed, code };
}

/** Plain-language sentence from the coded fields (no AI). */
export function whatHappened(cls, place, iso) {
  const who = cls.a1.name || (cls.a1.country ? `Actors from ${cls.a1.country}` : 'Unidentified actors');
  const whom = cls.a2.name || '';
  let verb = cls.verb;
  if (!whom) verb = verb.replace(/\s+(against|on|of|with|at)$/, '').replace(/ (by|for)$/, '');
  const d = iso ? new Date(iso) : null;
  const when = d && !isNaN(d) ? ` on ${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })}` : '';
  return `${who} ${verb}${whom ? ' ' + whom : ''}${place ? ` in ${place}` : ''}${when} (as coded by GDELT from news reports).`;
}
