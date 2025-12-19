document.addEventListener("DOMContentLoaded", () => {

  /* =========================
   * 0. 파라미터 / 데이터 로딩
   * ========================= */
  const id = Number(Util.qs("id"));

  const boards   = StorageDB.get("BOARD") || [];
  const stats    = StorageDB.get("BOARD_STAT") || [];
  const comments = StorageDB.get("BOARD_COMMENT") || [];

  // 임시 로그인 정보 (추후 인증 연동)
  const currentUser = {
    role: "USER" // USER / ADMIN
  };

  /* =========================
   * 1. 게시글 조회 및 검증
   * ========================= */
  const board = boards.find(b => b.id === id);

  if (!board || board.status === "DELETED") {
    alert("게시글이 존재하지 않습니다.");
    location.href = "index.html";
    return;
  }

  if (board.status === "HIDDEN" && currentUser.role !== "ADMIN") {
    alert("접근 권한이 없습니다.");
    location.href = "index.html";
    return;
  }

  /* =========================
   * 2. 통계 초기화 + 조회수 처리
   * ========================= */
  let stat = stats.find(s => s.board_id === id);

  if (!stat) {
    stat = {
      board_id: id,
      view_count: 0,
      like_count: 0
    };
    stats.push(stat);
  }

  const viewKey = `BOARD_VIEW_${id}`;
  if (!sessionStorage.getItem(viewKey)) {
    stat.view_count++;
    sessionStorage.setItem(viewKey, "Y");
    StorageDB.set("BOARD_STAT", stats);
  }

  /* =========================
   * 3. 카테고리 / 게시판 제목
   * ========================= */
  const CATEGORY_LABEL = {
    IT: "IT·시스템",
    SECURITY: "보안",
    DIGITAL: "디지털금융",
    FINANCE_PRODUCT: "금융상품",
    PENSION: "퇴직연금",
    CORPORATE: "기업금융",
    RETAIL: "개인금융",
    DIGITAL_ASSET: "디지털자산",
    CSR: "사회공헌(CSR)",
    EVENT: "이벤트·프로모션"
  };

  const categoryName = CATEGORY_LABEL[board.category] || "게시판";
  document.getElementById("viewCategory").textContent = categoryName;
  document.getElementById("boardTitle").textContent  = categoryName;

  /* =========================
   * 4. 게시글 상단 UX
   * ========================= */
  document.querySelector(".board-view .title").textContent = board.title;

  const writerEl = document.querySelector(".writer");
  if (writerEl) writerEl.textContent = board.writer || "익명";

  const ipEl = document.querySelector(".ip");
  if (ipEl) ipEl.textContent = board.ip || "내부망";

  const dateEl = document.querySelector(".date");
  if (dateEl) dateEl.textContent = Util.fmt(board.created_at);

  const viewEl = document.querySelector(".view-count");
  if (viewEl) viewEl.textContent = `조회 ${stat.view_count}`;

  const likeMetaEl = document.querySelector(".like-count-meta");
  if (likeMetaEl) likeMetaEl.textContent = `추천 ${stat.like_count}`;

  const likeBodyEl = document.querySelector(".like-count-body");
  if (likeBodyEl) likeBodyEl.textContent = `추천 ${stat.like_count}`;

  /* =========================
   * 5. 게시글 본문
   * ========================= */
  document.getElementById("content").innerHTML =
    Util.escape(board.content).replace(/\n/g, "<br>");

  /* =========================
   * 6. 첨부파일
   * ========================= */
  const attachList = document.getElementById("attachList");
  attachList.innerHTML = "";

  if (board.attachments && board.attachments.length > 0) {
    board.attachments.forEach(file => {
      const div = document.createElement("div");
      div.className = "attach-item";
      div.textContent =
        `${file.file_name} (${Math.round(file.file_size / 1024)}KB)`;
      attachList.appendChild(div);
    });
  } else {
    attachList.textContent = "첨부파일이 없습니다.";
  }

  /* =========================
   * 7. 공지글 댓글/추천 차단
   * ========================= */
  if (board.is_notice === true) {
    const commentsEl = document.querySelector(".board-comments");
    if (commentsEl) commentsEl.style.display = "none";

    const btnLike = document.getElementById("btnLike");
    if (btnLike) btnLike.style.display = "none";
  }

  /* =========================
   * 8. 댓글 조회
   * ========================= */
  const boardComments = comments.filter(
    c => c.board_id === id && c.status === "ACTIVE"
  );

  const commentCountEl = document.querySelector(".comment-count");
  if (commentCountEl)
    commentCountEl.textContent = `댓글 ${boardComments.length}`;

  const commentList = document.getElementById("commentList");
  commentList.innerHTML = "";

  boardComments.forEach(c => {
    const li = document.createElement("li");
    li.className = "comment-item";
    li.innerHTML = `
      <div class="comment-meta">
        <span class="comment-writer">${c.writer || "익명"}</span>
        <span class="divider">|</span>
        <span class="date">${Util.fmt(c.created_at)}</span>
      </div>
      <div class="comment-content">${Util.escape(c.content)}</div>
    `;
    commentList.appendChild(li);
  });

  /* =========================
   * 9. 댓글 등록
   * ========================= */
  const btnSubmit = document.getElementById("btnCommentSubmit");
  if (btnSubmit && board.is_notice !== true) {
    btnSubmit.addEventListener("click", () => {
      const textarea = document.getElementById("commentContent");
      const content = textarea.value.trim();

      if (!content) {
        alert("댓글을 입력하세요.");
        return;
      }

      comments.push({
        id: Date.now(),
        board_id: id,
        content,
        writer: "익명",
        created_at: new Date().toISOString(),
        status: "ACTIVE"
      });

      StorageDB.set("BOARD_COMMENT", comments);
      location.reload();
    });
  }

  /* =========================
   * 10. 추천 버튼
   * ========================= */
  const btnLike = document.getElementById("btnLike");
  const likeKey = `BOARD_LIKE_${id}`;

  if (btnLike && board.is_notice !== true) {
    btnLike.addEventListener("click", () => {
      if (localStorage.getItem(likeKey) === "Y") {
        alert("이미 추천한 게시글입니다.");
        return;
      }

      stat.like_count++;
      StorageDB.set("BOARD_STAT", stats);
      localStorage.setItem(likeKey, "Y");

      if (likeMetaEl) likeMetaEl.textContent = `추천 ${stat.like_count}`;
      if (likeBodyEl) likeBodyEl.textContent = `추천 ${stat.like_count}`;
    });
  }

  /* =========================
   * 11. 삭제 버튼 → delete.html
   * ========================= */
  const btnDelete = document.getElementById("btnDelete");

  if (btnDelete) {
    if (currentUser.role !== "ADMIN") {
      btnDelete.style.display = "none";
    } else {
      btnDelete.addEventListener("click", () => {
        location.href = `delete.html?id=${id}`;
      });
    }
  }
});
