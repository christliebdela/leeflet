// Crisp, punchy developer one-liners (offline fallback pool)
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
  "99 bugs in the code... patch 1 down, 127 bugs in the code.",
  "a QA engineer walks into a bar and orders 0 beers, 999999 beers, -1 beers.",
  "there is no cloud, it's just someone else's computer.",
  "have you tried turning it off and on again?",
  "my code works. I have no idea why. sending a PR.",
  "git blame: it was definitely someone else.",
  "you can't break production if there is no production.",
  "merge conflict: the original sin of collaboration.",
  "works in dev. ships. panics in prod.",
  "the best code is no code.",
  "sleep is just a garbage collector for your brain.",
];

const SEEN_JOKES_KEY = 'leaf_seen_jokes';
const SEEN_JOKES_MAX = 50;

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

function pickFreshOfflineJoke(): string | null {
  const seen = new Set(getSeenJokes());
  const fresh = PUNCHY_DEV_JOKES.filter((j) => !seen.has(j));
  const pool = fresh.length > 0 ? fresh : PUNCHY_DEV_JOKES;
  const joke = pool[Math.floor(Math.random() * pool.length)];
  return joke ?? null;
}

export async function fetchRandomDevJoke(): Promise<string> {
  const seen = new Set(getSeenJokes());

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    // safe=true: JokeAPI's safe tier — excludes offensive/momma jokes
    const res = await fetch(
      'https://v2.jokeapi.dev/joke/Programming?safe-mode&blacklistFlags=nsfw,religious,political,racist,sexist,explicit',
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      let text = '';
      if (data.type === 'single' && data.joke) {
        text = data.joke.trim();
      } else if (data.type === 'twopart' && data.setup && data.delivery) {
        text = `${data.setup.trim()} — ${data.delivery.trim()}`;
      }

      if (text) {
        const cleanJoke = text.replace(/\r?\n|\r/g, ' ');
        if (
          cleanJoke.length <= 95 &&
          !seen.has(cleanJoke) &&
          isJokeAcceptable(cleanJoke)
        ) {
          markJokeSeen(cleanJoke);
          return cleanJoke;
        }
      }
    }
  } catch {
    // Offline or timed out — fall through to offline pool
  }

  // Offline: pick a fresh unseen one-liner
  const offlineJoke = pickFreshOfflineJoke();
  if (offlineJoke) {
    markJokeSeen(offlineJoke);
    return offlineJoke;
  }

  return 'taking a coffee break...';
}
