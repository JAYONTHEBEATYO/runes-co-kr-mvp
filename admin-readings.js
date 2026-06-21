const tokenInput = document.getElementById("adminToken");
const authForm = document.getElementById("adminAuth");
const statusEl = document.getElementById("adminStatus");
const logsEl = document.getElementById("readingLogs");
const refreshButton = document.getElementById("refreshReadings");
const clearButton = document.getElementById("clearToken");

const savedToken = localStorage.getItem("runesAdminToken") || "";
tokenInput.value = savedToken;

authForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const token = tokenInput.value.trim();
  if (token) localStorage.setItem("runesAdminToken", token);
  loadReadings();
});

refreshButton.addEventListener("click", loadReadings);
clearButton.addEventListener("click", () => {
  localStorage.removeItem("runesAdminToken");
  tokenInput.value = "";
  logsEl.innerHTML = "";
  statusEl.textContent = "토큰을 지웠습니다.";
});

if (savedToken) loadReadings();

async function loadReadings() {
  const token = tokenInput.value.trim() || localStorage.getItem("runesAdminToken") || "";
  if (!token) {
    statusEl.textContent = "관리자 토큰을 입력하세요.";
    return;
  }
  statusEl.textContent = "기록을 불러오는 중입니다.";
  try {
    const response = await fetch("/api/admin-readings?limit=80", {
      headers: { "X-Admin-Token": token }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "관리자 조회 실패");
    if (!data.configured) {
      statusEl.textContent = "Blob 저장소가 아직 설정되지 않았습니다.";
      return;
    }
    renderLogs(data.logs || []);
    statusEl.textContent = `${data.logs?.length || 0}건을 불러왔습니다.`;
  } catch (error) {
    statusEl.textContent = error.message || "기록을 불러오지 못했습니다.";
  }
}

function renderLogs(logs) {
  if (!logs.length) {
    logsEl.innerHTML = `<article class="admin-log"><p class="admin-muted">아직 저장된 리딩 기록이 없습니다.</p></article>`;
    return;
  }
  logsEl.innerHTML = logs.map((log) => `
    <article class="admin-log">
      <header>
        <div>
          <p class="eyebrow">${escapeHtml(formatDate(log.createdAt))}</p>
          <h2>${escapeHtml(log.question || "질문 없음")}</h2>
        </div>
        <span class="admin-badge">${escapeHtml(log.spreadTitle || "스프레드")}</span>
      </header>
      <dl class="admin-meta">
        <div><dt>주제</dt><dd>${escapeHtml(log.topicLabel || log.topic || "-")}</dd></div>
        <div><dt>룬</dt><dd>${escapeHtml((log.runes || []).map((rune) => `${rune.position || ""} ${rune.ko || rune.name || rune.id}`).join(" / "))}</dd></div>
        <div><dt>개인화</dt><dd>${escapeHtml(formatAstrology(log.astrology))}</dd></div>
        <div><dt>타저씨</dt><dd>${log.tajussi?.enabled ? "연동됨" : "미사용"}</dd></div>
        <div><dt>모델</dt><dd>${escapeHtml(log.model || "-")}</dd></div>
      </dl>
      <details>
        <summary>해석 전문 보기</summary>
        <div class="admin-reading">${formatReading(log.reading || "")}</div>
      </details>
    </article>
  `).join("");
}

function formatAstrology(astrology) {
  if (!astrology) return "없음";
  const parts = [
    astrology.birthDate,
    astrology.birthTime,
    astrology.genderKo || astrology.gender,
    astrology.birthPlace ? `출생 ${astrology.birthPlace}` : "",
    astrology.currentPlace ? `현재 ${astrology.currentPlace}` : ""
  ].filter(Boolean);
  return parts.join(" · ") || "입력값 없음";
}

function formatReading(text) {
  return escapeHtml(text).split(/\n{2,}/).map((paragraph) => `<p>${paragraph.replace(/\n/g, "<br>")}</p>`).join("");
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
