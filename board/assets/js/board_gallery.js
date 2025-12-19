document.addEventListener("DOMContentLoaded", () => {
  const category = (Util.qs("category") || "").toUpperCase();
  document.getElementById("pageTitle").textContent = category ? `${category} 카드형` : "카드형 목록";

  const all = (StorageDB.get("BOARD") || [])
    .filter(b => b.status === "ACTIVE")
    .filter(b => !category || (b.category_code || "").toUpperCase() === category)
    .sort((a,b) => new Date(b.created_at) - new Date(a.created_at));

  renderCards(all);
});

function pickThumb(board){
  const a = board.attachments && board.attachments[0];
  return a ? (a.path || a.url) : "";
}

function renderCards(list){
  const grid = document.getElementById("cardGrid");
  grid.innerHTML = "";

  list.forEach(b => {
    const thumb = pickThumb(b);

    const el = document.createElement("div");
    el.className = "card";
    el.onclick = () => location.href = `view.html?id=${b.id}`;

    el.innerHTML = `
      <div class="thumb">
        ${thumb ? `<img src="${thumb}" alt="">` : `<div class="thumb-empty">NO IMAGE</div>`}
      </div>
      <div class="title">${Util.escape(b.title)}</div>
      <div class="meta">${Util.fmt(b.created_at)} · ${Util.escape(b.writer || "익명")}</div>
    `;

    grid.appendChild(el);
  });
}
