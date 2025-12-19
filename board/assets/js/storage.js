/* localStorage 기반 간이 DB */

const StorageDB = (() => {
  const get = (key, fallback = []) => {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  };

  const set = (key, value) => {
    localStorage.setItem(key, JSON.stringify(value));
  };

  const nextId = (seqKey) => {
    const cur = Number(localStorage.getItem(seqKey) || 0);
    const next = cur + 1;
    localStorage.setItem(seqKey, next);
    return next;
  };

  return { get, set, nextId };
})();
