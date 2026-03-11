/**
 * Bookmarked canisters and methods (localStorage).
 */
const BOOKMARKS_KEY = "launchpad-bookmarks";

export type Bookmark = {
  canisterId: string;
  name?: string;
  method?: string;
};

function load(): Bookmark[] {
  try {
    const raw = localStorage.getItem(BOOKMARKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save(items: Bookmark[]) {
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(items));
}

export function getBookmarks(): Bookmark[] {
  return load();
}

export function addBookmark(b: Bookmark) {
  const items = load();
  if (items.some((x) => x.canisterId === b.canisterId && x.method === b.method)) return items;
  items.push(b);
  save(items);
  return items;
}

export function removeBookmark(canisterId: string, method?: string) {
  const items = load().filter(
    (x) => !(x.canisterId === canisterId && (!method || x.method === method))
  );
  save(items);
  return items;
}

export function isBookmarked(canisterId: string, method?: string): boolean {
  return load().some(
    (x) => x.canisterId === canisterId && (!method || x.method === method)
  );
}

/** Subscribe to bookmark changes (for React). Call setState( getBookmarks() ) after add/remove. */
