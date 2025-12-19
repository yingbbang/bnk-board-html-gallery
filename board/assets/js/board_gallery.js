document.addEventListener("DOMContentLoaded", () => {
  const category = (Util.qs("category") || "").toUpperCase();
  const titleEl = document.getElementById("pageTitle");
  if (titleEl) titleEl.textContent = category ? `${category} 카드형` : "카드형 목록";

  const all = (StorageDB.get("BOARD") || [])
    .filter(b => b && b.status === "ACTIVE")
    // ✅ 레거시 호환: expose가 없으면(더미) 갤러리에서 기본 노출
    // ✅ expose가 있으면 gallery=true만 노출
    .filter(b => (b.expose == null) || (b.expose?.gallery === true))
    // ✅ category 필드 우선, 없으면 category_code도 허용
    .filter(b => !category || String(b.category || b.category_code || "").toUpperCase() === category)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  renderCards(all);
});

function pickThumb(board) {
  // 1순위: 갤러리 전용 썸네일
  if (board.thumbUrl) return String(board.thumbUrl);

  // 2순위: 레거시(attachments에 url/path 있을 때)
  const a = board.attachments && board.attachments[0];
  const legacy = a ? (a.url || a.path || a.file_url || "") : "";
  if (legacy) return legacy;

  // 3순위: 기본 배너
  return "./assets/banner/banner-info.png";
}

function renderCards(list) {
  const grid = document.getElementById("cardGrid");
  if (!grid) return;

  grid.innerHTML = "";

  if (list.length === 0) {
    grid.innerHTML = `<div class="thumb-empty" style="padding:16px;">표시할 글이 없습니다.</div>`;
    return;
  }

  list.forEach(b => {
    const thumb = pickThumb(b);

    const el = document.createElement("div");
    el.className = "card";
    el.onclick = () => location.href = `view.html?id=${b.id}`;

    el.innerHTML = `
      <div class="thumb">
        <img src="${thumb}" alt=""
             onerror="this.onerror=null; this.src='./assets/banner/banner-info.png';">
      </div>
      <div class="title">${Util.escape(b.title || "")}</div>
      <div class="meta">${Util.fmt(b.created_at)} · ${Util.escape(b.writer || "익명")}</div>
    `;

    grid.appendChild(el);
  });
}
