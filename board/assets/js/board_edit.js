/* 게시글 수정 + 이력 (+ 첨부파일 최대 5개 제한) + 갤러리 노출/썸네일 호환 */

document.addEventListener("DOMContentLoaded", () => {
  const MAX_ATTACH = 5;

  const id = Number(Util.qs("id"));
  const boards = StorageDB.get("BOARD") || [];
  const histories = StorageDB.get("BOARD_HISTORY") || [];

  const board = boards.find(b => b.id === id);
  if (!board) {
    alert("게시글 없음");
    history.back();
    return;
  }

  // --- DOM refs (id로만 접근) ---
  const form = document.querySelector("#editForm");
  if (!form) return;

  const titleEl = document.getElementById("title");
  const contentEl = document.getElementById("content");

  const fileInput = document.getElementById("attachments");            // <input type="file" ...>
  const existingBox = document.getElementById("existingAttachments");  // 기존첨부 렌더링 영역

  // --- gallery fields (write와 동일 ID로 맞출 것) ---
  const exposeListEl = document.getElementById("exposeList");
  const exposeGalleryEl = document.getElementById("exposeGallery");
  const thumbUrlEl = document.getElementById("thumbUrl");

  // --- 기본값 보정 ---
  board.attachments = Array.isArray(board.attachments) ? board.attachments : [];

  board.expose = (board.expose && typeof board.expose === "object")
    ? board.expose
    : { list: true, gallery: false };

  board.thumbUrl = board.thumbUrl ? String(board.thumbUrl) : "";

  // --- 기존 값 세팅 ---
  if (titleEl) titleEl.value = board.title || "";
  if (contentEl) contentEl.value = board.content || "";

  if (exposeListEl) exposeListEl.checked = (board.expose.list ?? true);
  if (exposeGalleryEl) exposeGalleryEl.checked = (board.expose.gallery ?? false);
  if (thumbUrlEl) thumbUrlEl.value = board.thumbUrl || "";

  // =========================
  // 1) 기존 첨부 렌더링 (삭제 체크박스)
  // =========================
  function renderExistingAttachments() {
    if (!existingBox) return;

    if (board.attachments.length === 0) {
      existingBox.innerHTML = `<small class="form-help">기존 첨부파일이 없습니다.</small>`;
      return;
    }

    existingBox.innerHTML = board.attachments.map((a, idx) => {
      // write.js / edit.js 메타 키가 달라도 안전하게
      const name = a?.file_name || a?.name || (typeof a === "string" ? a : `attachment-${idx + 1}`);
      return `
        <label class="attach-row" style="display:block; margin:6px 0;">
          <input type="checkbox" name="removeAttachment" value="${idx}">
          ${Util.escape(name)} <span class="muted">(삭제)</span>
        </label>
      `;
    }).join("") + `
      <small class="form-help">
        ※ 기존 첨부파일은 브라우저 정책상 자동 재선택이 불가합니다.
      </small>
    `;
  }

  function getRemoveIndexes() {
    const checks = document.querySelectorAll('input[name="removeAttachment"]:checked');
    return Array.from(checks).map(ch => Number(ch.value)).filter(n => Number.isFinite(n));
  }

  function getRemainingExistingCount() {
    const removeIdx = new Set(getRemoveIndexes());
    return board.attachments.filter((_, i) => !removeIdx.has(i)).length;
  }

  function getAllowedNewCount() {
    return Math.max(0, MAX_ATTACH - getRemainingExistingCount());
  }

  renderExistingAttachments();

  // =========================
  // 2) 신규 파일 선택 시 "추가 가능 개수" 초과 방지
  // =========================
  function enforceFileLimitOnSelect() {
    if (!fileInput) return;

    const allowed = getAllowedNewCount();
    const newCount = fileInput.files ? fileInput.files.length : 0;

    if (newCount > allowed) {
      alert(`첨부파일은 최대 ${MAX_ATTACH}개까지 가능합니다.\n현재 추가 가능: ${allowed}개`);
      fileInput.value = "";
    }
  }

  if (fileInput) fileInput.addEventListener("change", enforceFileLimitOnSelect);
  if (existingBox) existingBox.addEventListener("change", enforceFileLimitOnSelect);

  // =========================
  // 3) 저장(submit) 시: 삭제 반영 + 신규 첨부 합산(최대 5개) + gallery 필드 저장 + 이력
  // =========================
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const title = (titleEl ? titleEl.value : (form.title?.value || "")).trim();
    const content = (contentEl ? contentEl.value : (form.content?.value || ""));

    // 기본 검증
    if (!title) {
      alert("제목을 입력하세요.");
      titleEl?.focus();
      return;
    }
    if (!content.trim()) {
      alert("내용을 입력하세요.");
      contentEl?.focus();
      return;
    }

    // (선택) 비밀번호 검증이 필요하면 여기 추가:
    // const pwEl = document.getElementById("password");
    // if (pwEl && pwEl.value.trim() !== board.password) { alert("비밀번호가 일치하지 않습니다."); return; }

    // ---- gallery 수집/검증 ----
    const expose = {
      list: exposeListEl?.checked ?? true,
      gallery: exposeGalleryEl?.checked ?? false
    };
    const thumbUrl = (thumbUrlEl?.value || "").trim() || null;

    if (!expose.list && !expose.gallery) {
      alert("노출 위치를 최소 1개 선택하세요.");
      return;
    }

    if (expose.gallery && !thumbUrl) {
      alert("갤러리 노출을 체크하면 썸네일 URL이 필요합니다.");
      thumbUrlEl?.focus();
      return;
    }

    // 1) 기존 첨부 중 삭제 체크 반영
    const removeIdx = new Set(getRemoveIndexes());
    const remained = board.attachments.filter((_, i) => !removeIdx.has(i));

    // 2) 신규 파일 메타만 저장(로컬스토리지에 File 객체 저장 불가)
    const newFiles = fileInput && fileInput.files ? Array.from(fileInput.files) : [];
    const allowed = Math.max(0, MAX_ATTACH - remained.length);

    if (newFiles.length > allowed) {
      alert(`첨부파일은 최대 ${MAX_ATTACH}개까지 가능합니다.\n현재 추가 가능: ${allowed}개`);
      return;
    }

    const nowIso = new Date().toISOString();
    const newAttachMetas = newFiles.map(f => ({
      // write.js와 동일 키로 통일
      file_name: f.name,
      file_size: f.size,
      mime_type: f.type,
      uploaded_at: nowIso
    }));

    const finalAttachments = remained.concat(newAttachMetas);
    if (finalAttachments.length > MAX_ATTACH) {
      alert(`첨부파일은 최대 ${MAX_ATTACH}개까지 가능합니다.`);
      return;
    }

    // 이력 저장(제목/본문/첨부 + 갤러리 변경도 남김)
    histories.push({
      history_id: StorageDB.nextId("SEQ_HISTORY_ID"),
      board_id: id,

      before_title: board.title || "",
      after_title: title,

      before_content: board.content || "",
      after_content: content,

      before_attachments: board.attachments,
      after_attachments: finalAttachments,

      before_expose: board.expose,
      after_expose: expose,

      before_thumbUrl: board.thumbUrl || null,
      after_thumbUrl: thumbUrl,

      updated_by: 1,
      updated_at: nowIso
    });

    // 게시글 갱신
    board.title = title;
    board.content = content;
    board.attachments = finalAttachments;

    board.expose = expose;
    board.thumbUrl = thumbUrl;

    board.updated_at = nowIso;
    board.version = (board.version || 0) + 1;

    StorageDB.set("BOARD", boards);
    StorageDB.set("BOARD_HISTORY", histories);

    location.href = `view.html?id=${id}`;
  });
});
