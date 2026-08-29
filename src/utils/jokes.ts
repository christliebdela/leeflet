// Short, punchy offline fallback pool (all ≤ 80 chars — safe for mini mode)
const PUNCHY_DEV_JOKES: string[] = [
  "it works on my machine.",
  "// todo: fix this before production",
  "git commit -m 'fixed bug, created 3 new ones'",
  "there's no place like 127.0.0.1",
  "!false — it's funny because it's true.",
  "why dark mode? because light attracts bugs.",
  "a SQL query walks into a bar: 'can I join you?'",
  "while (alive) { coffee(); code(); }",
  "real programmers count from 0.",
  "debugging: being both the detective and the murderer.",
  "ship it on Friday, what could go wrong?",
  "console.log('here 1'); console.log('here 2');",
  "undefined is not a function.",
  "it's not a bug, it's an undocumented feature.",
  "null pointer exception: coffee cup is empty.",
  "git push --force and pray.",
  "sudo make me a coffee.",
  "keyboard not found. press F1 to continue.",
  "there are 10 types of people: binary lovers & the rest.",
  "99 bugs in the code... patch 1 down, 127 more to go.",
  "there is no cloud, it's just someone else's computer.",
  "have you tried turning it off and on again?",
  "git blame: it was definitely someone else.",
  "you can't break production if there is no production.",
  "merge conflict: the original sin of collaboration.",
  "works in dev. ships. panics in prod.",
  "the best code is no code.",
  "sleep is just a garbage collector for your brain.",
  "my code works. I have no idea why. sending a PR.",
  "a watched build never compiles.",
];

const SEEN_JOKES_KEY = 'leaf_seen_jokes';
const SEEN_JOKES_MAX = 50;
const MINI_MODE_MAX_CHARS = 80;

/** Block list for jokes that slip through API safe filters */
const CONTENT_BLOCK_PATTERNS = [
  /\b(momm?a|your m(?:om|other|um))\b/i,
  /\bfat\b.*\b(save|store|disk|file|byte|GB|MB|FAT)\b/i,
];

function isJokeAcceptable(joke: string): boolean {
  return !CONTENT_BLOCK_PATTERNS.some((pattern) => pattern.test(joke));
}

function getSeenJokes(): string[] {
  try {
    return JSON.parse(localStorage.getItem(SEEN_JOKES_KEY) || '[]');
  } catch {
    return [];
  }
}

function markJokeSeen(joke: string): void {
  try {
    const seen = getSeenJokes();
    const updated = [joke, ...seen.filter((j) => j !== joke)].slice(0, SEEN_JOKES_MAX);
    localStorage.setItem(SEEN_JOKES_KEY, JSON.stringify(updated));
  } catch {}
}

function pickFreshOfflineJoke(miniMode: boolean): string | null {
  const seen = new Set(getSeenJokes());
  const pool = miniMode
    ? PUNCHY_DEV_JOKES.filter((j) => j.length <= MINI_MODE_MAX_CHARS)
    : PUNCHY_DEV_JOKES;
  const fresh = pool.filter((j) => !seen.has(j));
  const source = fresh.length > 0 ? fresh : pool;
  return source[Math.floor(Math.random() * source.length)] ?? null;
}

// ─── API fetchers ────────────────────────────────────────────────────────────

async function fetchFromJokeAPI(signal: AbortSignal): Promise<string | null> {
  const res = await fetch(
    'https://v2.jokeapi.dev/joke/Programming?safe-mode&blacklistFlags=nsfw,religious,political,racist,sexist,explicit',
    { signal }
  );
  if (!res.ok) return null;
  const data = await res.json();
  if (data.type === 'single' && data.joke) return data.joke.trim();
  if (data.type === 'twopart' && data.setup && data.delivery)
    return `${data.setup.trim()} — ${data.delivery.trim()}`;
  return null;
}

async function fetchFromOfficialJokeAPI(signal: AbortSignal): Promise<string | null> {
  // Returns an array with one joke: { setup, punchline }
  const res = await fetch(
    'https://official-joke-api.appspot.com/jokes/programming/random',
    { signal }
  );
  if (!res.ok) return null;
  const data = await res.json();
  const item = Array.isArray(data) ? data[0] : data;
  if (item?.setup && item?.punchline) return `${item.setup.trim()} — ${item.punchline.trim()}`;
  return null;
}

async function fetchFromChuckNorrisAPI(signal: AbortSignal): Promise<string | null> {
  const res = await fetch('https://api.chucknorris.io/jokes/random?category=dev', { signal });
  if (!res.ok) return null;
  const data = await res.json();
  if (data?.value) return data.value.trim();
  return null;
}

const API_FETCHERS = [fetchFromJokeAPI, fetchFromOfficialJokeAPI, fetchFromChuckNorrisAPI];

// ─── Main export ─────────────────────────────────────────────────────────────

/**
 * Fetches a fresh dev joke.
 * @param miniMode - When true, only short jokes (≤ 80 chars) are returned.
 */
export async function fetchRandomDevJoke(miniMode = false): Promise<string> {
  const seen = new Set(getSeenJokes());

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    // Shuffle APIs so we don't always hit the same one first
    const shuffled = [...API_FETCHERS].sort(() => Math.random() - 0.5);

    for (const fetcher of shuffled) {
      try {
        const raw = await fetcher(controller.signal);
        if (!raw) continue;

        const cleanJoke = raw.replace(/\r?\n|\r/g, ' ');
        const lengthOk = !miniMode || cleanJoke.length <= MINI_MODE_MAX_CHARS;

        if (lengthOk && !seen.has(cleanJoke) && isJokeAcceptable(cleanJoke)) {
          clearTimeout(timeoutId);
          markJokeSeen(cleanJoke);
          return cleanJoke;
        }
      } catch {
        // This specific fetcher failed — try next
      }
    }

    clearTimeout(timeoutId);
  } catch {
    // AbortController or global failure — fall through
  }

  // Offline fallback
  const offlineJoke = pickFreshOfflineJoke(miniMode);
  if (offlineJoke) {
    markJokeSeen(offlineJoke);
    return offlineJoke;
  }

  return 'taking a coffee break...';
}
