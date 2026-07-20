const tokenInput = document.getElementById("adminToken");
const authForm = document.getElementById("adminAuth");
const statusEl = document.getElementById("adminStatus");
const logsEl = document.getElementById("readingLogs");
const refreshButton = document.getElementById("refreshReadings");
const logoutButton = document.getElementById("clearToken");

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const token = tokenInput.value.trim();
  if (!token) {
    setStatus("관리자 토큰을 입력하세요.");
    return;
  }
  await login(token);
});

refreshButton.addEventListener("click", loadReadings);
logoutButton.addEventListener("click", logout);

loadReadings();

async function login(token) {
  setStatus("로그인 중입니다.");
  try {
    const response = await fetch("/api/admin-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ token })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "로그인 실패");
    tokenInput.value = "";
    await loadReadings();
  } catch (error) {
    setStatus(error.message || "로그인하지 못했습니다.");
  }
}

async function logout() {
  try {
    await fetch("/api/admin-logout", {
      method: "POST",
      credentials: "same-origin"
    });
  } finally {
    tokenInput.value = "";
    logsEl.textContent = "";
    setStatus("로그아웃했습니다.");
  }
}

async function loadReadings() {
  setStatus("기록을 불러오는 중입니다.");
  try {
    const response = await fetch("/api/admin-readings?limit=80", {
      credentials: "same-origin"
    });
    const data = await response.json();
    if (response.status === 401) {
      logsEl.textContent = "";
      setStatus("관리자 토큰으로 로그인하세요.");
      return;
    }
    if (!response.ok) throw new Error(data.error || "관리자 조회 실패");
    if (!data.configured) {
      logsEl.textContent = "";
      setStatus("Blob 저장소가 아직 설정되지 않았습니다.");
      return;
    }
    renderLogs(data.logs || []);
    setStatus(`${data.logs?.length || 0}건을 불러왔습니다.`);
  } catch (error) {
    setStatus(error.message || "기록을 불러오지 못했습니다.");
  }
}

function setStatus(message) {
  statusEl.textContent = message;
}

function renderLogs(logs) {
  logsEl.textContent = "";
  if (!logs.length) {
    const article = document.createElement("article");
    article.className = "admin-log";
    const message = document.createElement("p");
    message.className = "admin-muted";
    message.textContent = "아직 저장된 리딩 기록이 없습니다.";
    article.appendChild(message);
    logsEl.appendChild(article);
    return;
  }

  for (const log of logs) {
    logsEl.appendChild(createLogArticle(log));
  }
}

function createLogArticle(log) {
  const article = document.createElement("article");
  article.className = "admin-log";

  const header = document.createElement("header");
  const headingWrap = document.createElement("div");
  const eyebrow = document.createElement("p");
  eyebrow.className = "eyebrow";
  eyebrow.textContent = formatDate(log.createdAt);
  const title = document.createElement("h2");
  title.textContent = log.question || "질문 없음";
  headingWrap.append(eyebrow, title);

  const badge = document.createElement("span");
  badge.className = "admin-badge";
  badge.textContent = log.spreadTitle || "스프레드";
  header.append(headingWrap, badge);

  const meta = document.createElement("dl");
  meta.className = "admin-meta";
  addMeta(meta, "주제", log.topicLabel || log.topic || "-");
  addMeta(meta, "룬", (log.runes || []).map((rune) => `${rune.position || ""} ${rune.ko || rune.name || rune.id}`).join(" / "));
  addMeta(meta, "개인화", formatAstrology(log.astrology));
  addMeta(meta, "타저씨", log.tajussi?.enabled ? "연동됨" : "미사용");
  addMeta(meta, "모델", log.model || "-");

  const details = document.createElement("details");
  const summary = document.createElement("summary");
  summary.textContent = "해석 전문 보기";
  const reading = document.createElement("div");
  reading.className = "admin-reading";
  for (const paragraph of String(log.reading || "").split(/\n{2,}/).filter(Boolean)) {
    const p = document.createElement("p");
    const lines = paragraph.split(/\n/);
    lines.forEach((line, index) => {
      if (index > 0) p.appendChild(document.createElement("br"));
      p.appendChild(document.createTextNode(line));
    });
    reading.appendChild(p);
  }
  details.append(summary, reading);

  const actions = document.createElement("div");
  actions.className = "admin-log-actions";
  const deleteButton = document.createElement("button");
  deleteButton.className = "button button--danger";
  deleteButton.type = "button";
  deleteButton.textContent = "기록 삭제";
  deleteButton.disabled = !log.pathname;
  deleteButton.addEventListener("click", () => deleteReading(log, article));
  actions.appendChild(deleteButton);

  article.append(header, meta, details, actions);
  return article;
}

async function deleteReading(log, article) {
  if (!log.pathname || !window.confirm("이 리딩 기록을 영구 삭제할까요?")) return;
  setStatus("기록을 삭제하는 중입니다.");
  try {
    const response = await fetch("/api/admin-readings", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ pathname: log.pathname })
    });
    const data = await response.json();
    if (!response.ok || !data.deleted) throw new Error(data.error || "삭제 실패");
    article.remove();
    setStatus("기록을 삭제했습니다.");
  } catch (error) {
    setStatus(error.message || "기록을 삭제하지 못했습니다.");
  }
}

function addMeta(parent, label, value) {
  const item = document.createElement("div");
  const dt = document.createElement("dt");
  const dd = document.createElement("dd");
  dt.textContent = label;
  dd.textContent = value || "-";
  item.append(dt, dd);
  parent.appendChild(item);
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

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}
