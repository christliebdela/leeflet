// Crisp, punchy developer one-liners (offline & fast fallback)
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
  "my code doesn't work, I have no idea why. My code works, I have no idea why.",
  "a programmer's wife tells him: 'go to the store, get a loaf of bread. If they have eggs, get 10.' He returns with 10 loaves of bread.",
];

export async function fetchRandomDevJoke(): Promise<string> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    // JokeAPI programming jokes (safe/clean filter, single & twopart)
    const res = await fetch(
      'https://v2.jokeapi.dev/joke/Programming?blacklistFlags=nsfw,religious,political,racist,sexist,explicit',
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
        // Keep to clean readable length
        if (cleanJoke.length <= 95) {
          return cleanJoke;
        }
      }
    }
  } catch {
    // Offline or network latency - falls back instantly to offline pool
  }

  // Pick random joke from curated punchy list
  const randomIndex = Math.floor(Math.random() * PUNCHY_DEV_JOKES.length);
  return PUNCHY_DEV_JOKES[randomIndex];
}
