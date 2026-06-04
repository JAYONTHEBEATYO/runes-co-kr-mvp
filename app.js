const positions = {
  1: ["지금의 핵심"],
  3: ["상황", "장애", "조언"],
  5: ["상황", "내 역할", "주의점", "다음 행동", "흐름"]
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
  const question = (form.get("question") || "").toString().trim() || "지금 내가 가장 먼저 바라봐야 할 흐름은 무엇인가요?";
  const selected = pickRunes(count);
  const result = document.getElementById("result");

  result.innerHTML = `<p class="empty">룬을 정리하고 결과지를 만드는 중입니다.</p>`;

  const llmReading = await requestLlmReading({ question, spread: count, runes: selected });

  result.innerHTML = `
    <p class="eyebrow">Rune Reading Result</p>
    <h2>${count}룬 리딩</h2>
    <p><strong>질문:</strong> ${escapeHtml(question)}</p>
    ${selected.map((rune, index) => `
      <div class="spread-card">
        <div class="rune-mark" aria-hidden="true">${rune.symbol}</div>
        <div>
          <h3>${positions[count][index]} · ${rune.ko}</h3>
          <p><strong>${rune.name}</strong> · ${rune.keywords.join(" / ")}</p>
          <p>${rune.upright}</p>
          <p><strong>질문에 비춰보기</strong> ${rune.question}</p>
        </div>
      </div>
    `).join("")}
    <section class="llm-summary">
      <p class="eyebrow">Synthesis</p>
      <h3>종합 해석</h3>
      <p>${llmReading}</p>
    </section>
    <button class="button button--primary" onclick="window.print()">PDF로 저장</button>
  `;
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
    if (data && data.reading) return escapeHtml(data.reading);
  } catch (error) {
    console.info("LLM endpoint unavailable; using local synthesis.", error);
  }

  return buildLocalSynthesis(payload);
}

function buildLocalSynthesis({ question, runes }) {
  const names = runes.map(rune => `${rune.ko}(${rune.name})`).join(", ");
  const focus = runes.map(rune => rune.keywords[0]).join(", ");
  return escapeHtml(`이번 질문은 ${names}의 흐름으로 읽을 수 있습니다. 핵심 키워드는 ${focus}입니다. 룬스의 기본 리딩은 역방향을 쓰지 않으므로, 뽑힌 룬의 본래 상징을 질문에 그대로 비춰봅니다. 지금은 답을 단정하기보다 질문을 더 선명하게 만들고, 오늘 바로 실행할 수 있는 작은 행동 하나를 정하는 데 집중하세요.`);
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

function renderRuneGrid() {
  const grid = document.getElementById("rune-grid");
  grid.innerHTML = runeData.map(rune => `
    <a class="rune-tile" href="./runes/${rune.id}.html" aria-label="${rune.ko} ${rune.name} 상세 해설 보기">
      <div class="symbol">${rune.symbol}</div>
      <strong>${rune.ko} · ${rune.name}</strong>
      <small>${rune.keywords.join(" / ")}</small>
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
