/* 게시글 등록 (list + gallery 호환) */

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("writeForm");
  if (!form) return;

  const $ = (id) => document.getElementById(id);

  // 1) mode 처리: gallery에서 넘어오면 기본값 세팅 + 저장 후 돌아갈 페이지 결정
  const qsMode = (window.Util?.qs?.("mode") || "").toLowerCase();
  const mode = qsMode || ($("mode")?.value || "list"); // list | gallery
  if ($("mode")) $("mode").value = mode;

  // gallery 진입이면 기본 체크(원하면 list는 유지)
  if (mode === "gallery") {
    if ($("exposeGallery")) $("exposeGallery").checked = true;
  }

  form.addEventListener("submit", (e) => {
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

    // 파일 입력들(현재는 메타만 저장)
    const attachFiles = form.attachments?.files || [];
    const thumbFile   = $("thumbFile")?.files?.[0] || null;       // 아직 저장 미지원
    const viewImages  = $("viewImages")?.files || [];             // 아직 저장 미지원

    /* =========================
     * 2. 갤러리 관련 값 수집
     * ========================= */
    const expose = {
      list: $("exposeList")?.checked ?? true,
      gallery: $("exposeGallery")?.checked ?? false
    };

    const thumbUrl = ($("thumbUrl")?.value || "").trim() || null;

    /* =========================
     * 3. 유효성 검사
     * ========================= */
    if (!category) return alert("카테고리를 선택하세요.");
    if (!title)    return alert("제목을 입력하세요.");
    if (!content)  return alert("내용을 입력하세요.");
    if (!password) return alert("비밀번호를 입력하세요.");

    // 노출 위치는 최소 1개
    if (!expose.list && !expose.gallery) {
      alert("노출 위치를 최소 1개 선택하세요.");
      return;
    }

    // 갤러리 노출이면 썸네일 URL 필수(파일 업로드는 아직 미지원)
    if (expose.gallery && !thumbUrl) {
      alert("갤러리 노출을 체크하면 썸네일 URL이 필요합니다.");
      $("thumbUrl")?.focus();
      return;
    }

    // 첨부 합산 5개 제한 (thumbFile/viewImages도 포함해서 카운트만)
    const totalFileCount = attachFiles.length + (thumbFile ? 1 : 0) + viewImages.length;
    if (totalFileCount > 5) {
      alert("첨부파일은 (썸네일/본문이미지/일반첨부) 합산 최대 5개까지 등록할 수 있습니다.");
      return;
    }

    /* =========================
     * 4. 첨부파일 메타데이터 처리 (실파일 저장 ❌)
     * ========================= */
    const attachments = Array.from(attachFiles).map((file) => ({
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type
    }));

    /* =========================
     * 5. 게시글 저장
     * ========================= */
    const now = new Date().toISOString();
    const id  = StorageDB.nextId("SEQ_BOARD_ID");

    boards.push({
      id,
      category,
      title,
      content,
      writer,
      password,      // 수정/삭제 검증용
      attachments,   // 일반 첨부 메타
      expose,        // ★ 추가: list/gallery 노출 제어
      thumbUrl,      // ★ 추가: 갤러리 카드 썸네일
      status: "ACTIVE",
      is_notice: false,
      is_pinned: false,
      created_at: now
    });

    /* =========================
     * 6. 통계 초기화
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
     * 7. 이동
     * ========================= */
    location.href = (mode === "gallery") ? "gallery.html" : "index.html";
  });
});
