// ─── Offline pool (≤ 80 chars — safe for both full & mini mode) ─────────────
const OFFLINE_JOKES: string[] = [
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

// ─── Pool storage ────────────────────────────────────────────────────────────
const POOL_KEY = 'leaf_joke_pool_v2';
const POOL_TTL_MS = 7 * 24 * 60 * 60 * 1000; // refresh weekly
const MINI_MAX_CHARS = 80;

/** Block list for jokes that slip through API safe filters */
const BLOCK_PATTERNS = [
  /\b(momm?a|your m(?:om|other|um))\b/i,
  /\bfat\b.*\b(save|store|disk|file|byte|GB|MB|FAT)\b/i,
];

interface JokePool {
  full: string[];  // all jokes, any length
  mini: string[];  // short jokes only (≤ MINI_MAX_CHARS)
  builtAt: number;
}

function isAcceptable(joke: string): boolean {
  return joke.length > 0 && !BLOCK_PATTERNS.some((p) => p.test(joke));
}

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function loadPool(): JokePool | null {
  try {
    const raw = localStorage.getItem(POOL_KEY);
    if (!raw) return null;
    const pool: JokePool = JSON.parse(raw);
    // Discard if expired or exhausted
    if (Date.now() - pool.builtAt > POOL_TTL_MS) return null;
    if (pool.full.length === 0) return null;
    return pool;
  } catch {
    return null;
  }
}

function savePool(pool: JokePool): void {
  try {
    localStorage.setItem(POOL_KEY, JSON.stringify(pool));
  } catch {}
}

function popJoke(pool: JokePool, miniMode: boolean): string | null {
  const jokes = miniMode ? pool.mini : pool.full;
  if (jokes.length === 0) return null;
  const joke = jokes.shift()!;
  // Keep both pools in sync — remove from full if popped from mini
  if (miniMode) {
    const idx = pool.full.indexOf(joke);
    if (idx !== -1) pool.full.splice(idx, 1);
  } else {
    // If popped joke was short, also remove from mini to stay in sync
    const idx = pool.mini.indexOf(joke);
    if (idx !== -1) pool.mini.splice(idx, 1);
  }
  return joke;
}

// ─── API bulk fetchers ────────────────────────────────────────────────────────

async function fetchJokeAPIBatch(): Promise<string[]> {
  // 5 concurrent requests × 10 jokes = up to 50
  const results = await Promise.allSettled(
    Array.from({ length: 5 }, () =>
      fetch(
        'https://v2.jokeapi.dev/joke/Programming?safe-mode&blacklistFlags=nsfw,religious,political,racist,sexist,explicit&amount=10',
        { signal: AbortSignal.timeout(5000) }
      ).then((r) => r.json())
    )
  );
  const jokes: string[] = [];
  for (const r of results) {
    if (r.status !== 'fulfilled') continue;
    const data = r.value;
    const items = data.jokes ?? (data.error === false ? [data] : []);
    for (const item of items) {
      if (item.type === 'single' && item.joke) {
        jokes.push(item.joke.trim().replace(/\r?\n|\r/g, ' '));
      } else if (item.type === 'twopart' && item.setup && item.delivery) {
        jokes.push(`${item.setup.trim()} — ${item.delivery.trim()}`);
      }
    }
  }
  return jokes;
}

async function fetchOfficialJokeAPIBatch(): Promise<string[]> {
  // 5 concurrent requests × 10 jokes = up to 50
  const results = await Promise.allSettled(
    Array.from({ length: 5 }, () =>
      fetch('https://official-joke-api.appspot.com/jokes/programming/ten', {
        signal: AbortSignal.timeout(5000),
      }).then((r) => r.json())
    )
  );
  const jokes: string[] = [];
  for (const r of results) {
    if (r.status !== 'fulfilled' || !Array.isArray(r.value)) continue;
    for (const item of r.value) {
      if (item?.setup && item?.punchline) {
        jokes.push(`${item.setup.trim()} — ${item.punchline.trim()}`);
      }
    }
  }
  return jokes;
}

async function fetchChuckNorrisBatch(): Promise<string[]> {
  // 20 concurrent individual requests = up to 20 dev jokes
  const results = await Promise.allSettled(
    Array.from({ length: 20 }, () =>
      fetch('https://api.chucknorris.io/jokes/random?category=dev', {
        signal: AbortSignal.timeout(5000),
      }).then((r) => r.json())
    )
  );
  const jokes: string[] = [];
  for (const r of results) {
    if (r.status !== 'fulfilled' || !r.value?.value) continue;
    jokes.push(r.value.value.trim().replace(/\r?\n|\r/g, ' '));
  }
  return jokes;
}

// ─── Pool builder ─────────────────────────────────────────────────────────────

let buildPromise: Promise<JokePool> | null = null;

async function buildPool(): Promise<JokePool> {
  // Fetch all sources concurrently
  const [jokeAPI, officialAPI, chuckAPI] = await Promise.allSettled([
    fetchJokeAPIBatch(),
    fetchOfficialJokeAPIBatch(),
    fetchChuckNorrisBatch(),
  ]);

  const raw = [
    ...(jokeAPI.status === 'fulfilled' ? jokeAPI.value : []),
    ...(officialAPI.status === 'fulfilled' ? officialAPI.value : []),
    ...(chuckAPI.status === 'fulfilled' ? chuckAPI.value : []),
    ...OFFLINE_JOKES,
  ];

  // Deduplicate + filter
  const seen = new Set<string>();
  const full: string[] = [];
  for (const joke of raw) {
    const clean = joke.trim();
    if (!seen.has(clean) && isAcceptable(clean)) {
      seen.add(clean);
      full.push(clean);
    }
  }

  const mini = full.filter((j) => j.length <= MINI_MAX_CHARS);

  const pool: JokePool = {
    full: shuffle(full),
    mini: shuffle(mini),
    builtAt: Date.now(),
  };

  savePool(pool);
  return pool;
}

// ─── Public API ───────────────────────────────────────────────────────────────

let cachedPool: JokePool | null = null;

/**
 * Pre-warms the joke pool in the background.
 * Call this on app startup so standby is always instant.
 */
export function warmJokePool(): void {
  if (cachedPool && cachedPool.full.length > 0) return;
  const persisted = loadPool();
  if (persisted) {
    cachedPool = persisted;
    return;
  }
  // Fetch in background — don't await
  buildPromise = buildPool().then((pool) => {
    cachedPool = pool;
    buildPromise = null;
    return pool;
  });
}

/**
 * Returns the next joke from the pre-built pool instantly.
 * Falls back to offline one-liner if pool isn't ready yet.
 * @param miniMode - When true, only short jokes (≤ 80 chars) are returned.
 */
export async function fetchRandomDevJoke(miniMode = false): Promise<string> {
  // If a build is in progress, wait for it (only happens on very first call before warm completes)
  if (buildPromise) {
    cachedPool = await buildPromise;
  }

  // Load from localStorage if not in memory
  if (!cachedPool) {
    cachedPool = loadPool();
  }

  // Build fresh pool if missing/exhausted
  if (!cachedPool || (miniMode ? cachedPool.mini.length : cachedPool.full.length) === 0) {
    buildPromise = buildPool();
    cachedPool = await buildPromise;
    buildPromise = null;
  }

  const joke = popJoke(cachedPool, miniMode);
  savePool(cachedPool); // persist updated index

  return joke ?? 'taking a coffee break...';
}
