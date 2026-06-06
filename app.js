const positions = {
  1: ["지금의 핵심"],
  3: ["상황", "장애", "조언"],
  5: ["상황", "내 역할", "주의점", "다음 행동", "흐름"]
};

const topicLabels = {
  general: "전체 흐름",
  love: "관계 / 연애",
  work: "일 / 커리어",
  money: "돈 / 판매 / 자원",
  self: "마음정리 / 자기이해",
  choice: "선택 / 결정"
};

let runeData = [];

function pickRunes(count) {
  const pool = [...runeData];
  const picked = [];
  while (picked.length < count && pool.length) {
    const index = Math.floor(Math.random() * pool.length);
    picked.push(pool.splice(index, 1)[0]);
  }
  return picked;
}

async function renderResult(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const count = Number(form.get("spread"));
  const topic = (form.get("topic") || "general").toString();
  const question = (form.get("question") || "").toString().trim() || "지금 내가 가장 먼저 바라봐야 할 흐름은 무엇인가요?";
  const selected = pickRunes(count);
  const result = document.getElementById("result");

  result.innerHTML = `<p class="empty">룬을 정리하고 결과지를 만드는 중입니다.</p>`;

  const llmReading = await requestLlmReading({ question, topic, spread: count, positions: positions[count], runes: selected });

  result.innerHTML = `
    <p class="eyebrow">Rune Reading Result</p>
    <h2>${count}룬 리딩</h2>
    <p><strong>질문:</strong> ${escapeHtml(question)}</p>
    <p><strong>주제:</strong> ${escapeHtml(topicLabels[topic] || topicLabels.general)}</p>
    <section class="llm-summary">
      <p class="eyebrow">Rune Reading</p>
      <h3>룬 리딩 해석</h3>
      <div class="reading-copy">${formatReadingText(llmReading)}</div>
    </section>
    <details class="drawn-runes">
      <summary>뽑힌 룬 자세히 보기</summary>
      ${selected.map((rune, index) => `
        <div class="spread-card">
          <div class="rune-mark" aria-hidden="true">${escapeHtml(rune.symbol)}</div>
          <div>
            <h3>${escapeHtml(positions[count][index])} · ${escapeHtml(rune.ko)}</h3>
            <p><strong>${escapeHtml(rune.name)}</strong> · ${formatKeywords(rune.keywords)}</p>
            <p>${escapeHtml(rune.upright)}</p>
            <p><strong>질문에 비춰보기</strong> ${escapeHtml(rune.question)}</p>
          </div>
        </div>
      `).join("")}
    </details>
    <button class="button button--primary" type="button" data-print-result>PDF로 저장</button>
  `;

  const printButton = result.querySelector("[data-print-result]");
  if (printButton) printButton.addEventListener("click", () => window.print());
}

async function requestLlmReading(payload) {
  const endpoint = window.RUNES_LLM_ENDPOINT || "/api/rune-reading";
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        policy: "Use upright Elder Futhark meanings only. Do not use reversals, merkstave, or shadow interpretations."
      })
    });
    if (!response.ok) throw new Error(`LLM endpoint returned ${response.status}`);
    const data = await response.json();
    if (data && data.reading) return data.reading;
  } catch (error) {
    console.info("LLM endpoint unavailable; using local synthesis.", error);
  }

  return buildLocalReading(payload);
}

function buildLocalReading({ question, topic, runes }) {
  const names = runes.map(rune => `${rune.ko}(${rune.name})`).join(", ");
  const focus = runes.map(rune => rune.keywords[0]).join(", ");
  return `이번 ${topicLabels[topic] || topicLabels.general} 질문은 ${names}의 흐름으로 읽을 수 있습니다. 핵심 키워드는 ${focus}입니다.\n\n룬스의 기본 리딩은 역방향을 쓰지 않으므로, 뽑힌 룬의 본래 상징을 질문에 그대로 비춰봅니다. 지금은 답을 단정하기보다 질문을 더 선명하게 만들고, 오늘 바로 실행할 수 있는 작은 행동 하나를 정하는 데 집중하세요.`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

function formatKeywords(keywords) {
  return keywords.map(escapeHtml).join(" / ");
}

function formatReadingText(value) {
  return escapeHtml(cleanReadingText(value))
    .split(/\n{2,}/)
    .map(block => `<p>${block.replace(/\n/g, "<br>")}</p>`)
    .join("");
}

function cleanReadingText(value) {
  return String(value || "")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/^\s*[-*]\s+/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function renderRuneGrid() {
  const grid = document.getElementById("rune-grid");
  grid.innerHTML = runeData.map(rune => `
    <a class="rune-tile" href="./runes/${encodeURIComponent(rune.id)}.html" aria-label="${escapeHtml(rune.ko)} ${escapeHtml(rune.name)} 상세 해설 보기">
      <div class="symbol">${escapeHtml(rune.symbol)}</div>
      <strong>${escapeHtml(rune.ko)} · ${escapeHtml(rune.name)}</strong>
      <small>${formatKeywords(rune.keywords)}</small>
    </a>
  `).join("");
}

function initLangToggle() {
  const button = document.querySelector("[data-lang-toggle]");
  if (!button) return;
  const current = localStorage.getItem("runes-lang") || "ko";
  button.textContent = current.toUpperCase();
  button.addEventListener("click", () => {
    const next = (localStorage.getItem("runes-lang") || "ko") === "ko" ? "en" : "ko";
    localStorage.setItem("runes-lang", next);
    button.textContent = next.toUpperCase();
  });
}

async function init() {
  const response = await fetch("./content/elder-futhark.ko.json");
  const data = await response.json();
  runeData = data.runes;
  renderRuneGrid();
  initLangToggle();
  document.getElementById("reading-form").addEventListener("submit", renderResult);
}

init().catch(error => {
  document.getElementById("result").innerHTML = `<p class="empty">룬 DB를 불러오지 못했습니다. 로컬 서버가 켜져 있는지 확인해주세요.</p>`;
  console.error(error);
});
