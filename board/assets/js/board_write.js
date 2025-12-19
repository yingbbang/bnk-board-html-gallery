/* 게시글 등록 */

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("writeForm");
  if (!form) return;

  form.addEventListener("submit", e => {
    e.preventDefault();

    /* =========================
     * 1. 기본 데이터 로드
     * ========================= */
    const boards = StorageDB.get("BOARD") || [];
    const stats  = StorageDB.get("BOARD_STAT") || [];

    const category = form.category.value;
    const title    = form.title.value.trim();
    const content  = form.content.value.trim();
    const writer   = form.writer.value.trim() || "익명";
    const password = form.password.value.trim();
    const files    = form.attachments?.files || [];

    /* =========================
     * 2. 유효성 검사
     * ========================= */
    if (!category) {
      alert("카테고리를 선택하세요.");
      return;
    }

    if (!title) {
      alert("제목을 입력하세요.");
      return;
    }

    if (!content) {
      alert("내용을 입력하세요.");
      return;
    }

    if (!password) {
      alert("비밀번호를 입력하세요.");
      return;
    }

    if (files.length > 5) {
      alert("첨부파일은 최대 5개까지 등록할 수 있습니다.");
      return;
    }

    /* =========================
     * 3. 첨부파일 메타데이터 처리
     * (실파일 저장 ❌, 메타만)
     * ========================= */
    const attachments = Array.from(files).map(file => ({
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type
    }));

    /* =========================
     * 4. 게시글 저장
     * ========================= */
    const now = new Date().toISOString();
    const id  = StorageDB.nextId("SEQ_BOARD_ID");

    boards.push({
      id,
      category,
      title,
      content,
      writer,
      password,              // ★ 수정/삭제 검증용
      attachments,           // ★ 첨부파일 메타
      status: "ACTIVE",
      is_notice: false,      // 확장 포인트
      is_pinned: false,      // 확장 포인트
      created_at: now
    });

    /* =========================
     * 5. 통계 초기화
     * ========================= */
    stats.push({
      board_id: id,
      view_count: 0,
      like_count: 0,
      comment_count: 0
    });

    StorageDB.set("BOARD", boards);
    StorageDB.set("BOARD_STAT", stats);

    /* =========================
     * 6. 이동
     * ========================= */
    location.href = "index.html";
  });
});
