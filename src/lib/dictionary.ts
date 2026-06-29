// ------------------------------------------------------------------ //
// Word validation. The real list is your UK Scrabble file dropped at  //
// public/dictionary.txt (one word per line). It is fetched at runtime  //
// into a Set for O(1) lookups and is NEVER bundled into the JS.        //
//                                                                      //
// If the file is missing we fall back to a small built-in list so the  //
// game is still playable during setup, and surface a banner in the UI. //
// ------------------------------------------------------------------ //

export const MIN_WORD_LENGTH = 3;

// A compact safety net so the app works before you add dictionary.txt.
// Heavy on common short words + plenty of TIM-friendly ones for testing.
const FALLBACK_WORDS = (
  `tim time times timid timer timed mite mites item items emit emits mint mints
   mist mister merit merits remit remits trim trims trio trim mire mime mimic rime
   smit stir stim term terms tier tiers rite rites rise risen ire ides dim dime
   dimer met met met tie ties tin tins tint tints into omit omits site sire
   the and for are but not you all any can her was one our out day get has him his
   how man new now old see two way who boy did its let put say she too use dad mom
   cat cats dog dogs run run sun fun bun ten net pen pet set sit sat hat hot hit
   hut hop top pot pop tap tip rip rap ram rat rot art ant ate eat tea ten end
   ear era are ore oar row raw saw sea see set sew sin son sob sob bad bed big bog
   bug bus cab cap car cod cog cop cot cow cry cub cue cup cut den dew dig dip dot
   dry dub dug ear eel egg ego elf elk elm fan far fat fed fen few fib fig fin fir
   fit fix fob foe fog for fox fry fun fur gag gap gas gel gem get gig gin god got
   gum gun gut guy gym ham hay hem hen hew hid hip hog hub hue hug hum hut ice icy
   ill imp ink inn ion ire irk ivy jab jam jar jaw jay jet jig job jog jot joy jug
   keg key kid kin kit lab lad lag lap law lax lay led leg let lid lip lit lob log
   lot low mad map mar mat maw may men met mix mob mod mop mud mug mum nab nag nap
   nay nib nil nip nit nod nor nut oak oar oat odd ode off oft oil old one orb ore
   our out owe owl own pad pal pan pat paw pay pea peg pen pet pew pie pig pin pit
   pod pot pry pub pug pun pup put rag ram ran rap rat raw ray red rib rid rig rim
   rip rob rod rot row rub rug rum run rut sad sag sap sat saw say sea set sew she
   shy sin sip sir sit six ski sky sly sob sod son sop sow soy spa spy sty sub sue
   sum sun tab tag tan tap tar tat tax tea ten the thy tic tie tin tip toe ton too
   top tot tow toy try tub tug tux two urn use van vat vet vex via vie vow wad wag
   war was wax way web wed wet who why wig win wit woe wok won woo wow wry yak yam
   yap yaw yea yen yes yet yew yip you zap zip zoo
   tame fame game name same came lame blame flame frame
   stone store stork storm story sport short sword world word words
   bird birds third birth mirth firm firms sir stir
   smart start chart charm storm
   plate plane place plant plays
   great gream cream dream stream steam
   table cable fable label gable
   point paint print sprint
   light might night right sight tight fight
   black block clock cloth cloud
   bread break dream cream
   green sheet sweet sleet street`
)
  .split(/\s+/)
  .map((w) => w.trim().toUpperCase())
  .filter((w) => w.length >= MIN_WORD_LENGTH);

let wordSet: Set<string> | null = null;
let loadPromise: Promise<Set<string>> | null = null;
let usingFallback = false;

/** Load (once) and cache the dictionary Set. Safe to call repeatedly. */
export function loadDictionary(): Promise<Set<string>> {
  if (wordSet) return Promise.resolve(wordSet);
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    try {
      // BASE_URL keeps this correct if the app is hosted under a sub-path.
      const res = await fetch(`${import.meta.env.BASE_URL}dictionary.txt`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      const set = new Set<string>();
      for (const line of text.split(/\r?\n/)) {
        const w = line.trim().toUpperCase();
        if (w.length >= MIN_WORD_LENGTH) set.add(w);
      }
      if (set.size === 0) throw new Error('dictionary.txt was empty');
      wordSet = set;
      usingFallback = false;
      return set;
    } catch (err) {
      console.warn(
        '[Tim-oggle] Could not load /dictionary.txt — using the small built-in ' +
          'fallback list. Drop your UK Scrabble word list at public/dictionary.txt ' +
          'for the full experience. Reason:',
        err,
      );
      wordSet = new Set(FALLBACK_WORDS);
      usingFallback = true;
      return wordSet;
    }
  })();

  return loadPromise;
}

/** Whether the currently loaded dictionary is the built-in fallback. */
export const isDictionaryFallback = (): boolean => usingFallback;

/** Synchronous membership check. Call only after loadDictionary() resolves. */
export function isWord(word: string): boolean {
  const w = word.toUpperCase();
  return w.length >= MIN_WORD_LENGTH && wordSet !== null && wordSet.has(w);
}

/** Get all valid words from the loaded dictionary. */
export function getAllValidWords(): string[] {
  return wordSet ? Array.from(wordSet) : [];
}
