/* 공통 유틸 */

const Util = (() => {
  const qs = (key) => new URLSearchParams(location.search).get(key);

  const fmt = (iso) => {
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}
            ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
  };

  const escape = (s) =>
    String(s)
      .replace(/&/g,"&amp;")
      .replace(/</g,"&lt;")
      .replace(/>/g,"&gt;");

  return { qs, fmt, escape };
})();
