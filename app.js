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
  const astrology = buildAstrologyInput(form);
  const selected = pickRunes(count);
  const result = document.getElementById("result");

  result.innerHTML = `<p class="empty">룬을 정리하고 결과지를 만드는 중입니다.</p>`;

  const llmReading = await requestLlmReading({ question, topic, spread: count, positions: positions[count], runes: selected, astrology });

  result.innerHTML = `
    <p class="eyebrow">Rune Reading Result</p>
    <h2>${count}룬 리딩</h2>
    <p><strong>질문:</strong> ${escapeHtml(question)}</p>
    <p><strong>주제:</strong> ${escapeHtml(topicLabels[topic] || topicLabels.general)}</p>
    ${astrology ? `<p class="astro-note"><strong>별자리 개인화:</strong> ${escapeHtml(formatAstrologyNote(astrology))}</p>` : ""}
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

function buildAstrologyInput(form) {
  const birthDate = (form.get("birthDate") || "").toString().trim();
  const birthTime = (form.get("birthTime") || "").toString().trim();
  const birthPlace = (form.get("birthPlace") || "").toString().trim();
  const currentPlace = (form.get("currentPlace") || "").toString().trim();
  if (!birthDate && !birthTime && !birthPlace && !currentPlace) return null;
  return { birthDate, birthTime, birthPlace, currentPlace, calendar: "solar" };
}

function formatAstrologyNote(astrology) {
  const parts = [];
  if (astrology.birthDate) parts.push(`양력 ${astrology.birthDate}`);
  if (astrology.birthTime) parts.push(`${astrology.birthTime} 출생`);
  if (astrology.birthPlace) parts.push(`출생지 ${astrology.birthPlace}`);
  if (astrology.currentPlace) parts.push(`현재 ${astrology.currentPlace}`);
  return parts.join(" · ");
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

function buildLocalReading({ question, topic, spread, positions, runes, astrology }) {
  const topicLabel = topicLabels[topic] || topicLabels.general;
  const namedRunes = runes.map(rune => `${rune.ko}(${rune.name})`).join(", ");
  const keywordLine = runes.map(rune => rune.keywords.slice(0, 2).join("·")).join(" → ");
  const astrologyLine = astrology?.birthDate
    ? `양력 생일 ${astrology.birthDate}의 별자리 흐름도 함께 참고합니다. 정확한 출생 시간이 없으면 태양 별자리 중심의 가벼운 개인화로만 보는 것이 안전합니다.\n\n`
    : "";
  const introByTopic = {
    general: "전체 흐름에서는 지금 상황을 좋고 나쁨으로 빨리 가르기보다, 어떤 리듬으로 움직이고 있는지 먼저 보는 편이 좋습니다.",
    love: "관계 질문에서는 상대의 마음을 단정하기보다, 내가 어떤 방식으로 관계 안에서 반응하고 있는지 보는 것이 먼저입니다.",
    work: "일과 커리어 질문에서는 당장의 성과뿐 아니라 속도, 책임, 협업, 유지 가능성을 함께 봐야 합니다.",
    money: "돈과 자원 질문에서는 단순히 이득인지 손해인지보다, 내가 가진 자원을 어디에 묶어두고 어디로 흘려보내야 하는지를 살펴야 합니다.",
    self: "마음정리 질문에서는 외부 상황보다 내 안에서 반복되는 감정과 필요를 먼저 읽는 것이 중요합니다.",
    choice: "선택 질문에서는 어느 쪽이 정답인지 단정하기보다, 각 선택이 요구하는 대가와 태도를 분명히 보는 것이 핵심입니다."
  };
  const positionText = runes.map((rune, index) => {
    const position = positions?.[index] || `${index + 1}번째 자리`;
    return `${position} 자리에 나온 ${rune.ko}(${rune.name})는 ${rune.keywords.join(", ")}의 상징으로 읽습니다. ${rune.upright} 이 룬을 질문에 비춰보면 “${rune.question}”라는 물음이 남습니다.`;
  }).join("\n\n");
  const actionBySpread = {
    1: "오늘은 이 룬 하나를 결론처럼 소비하지 말고, 하루 동안 같은 질문을 세 번만 다시 적어보세요. 처음 적은 질문, 조금 더 솔직해진 질문, 실제 행동으로 옮길 수 있는 질문을 구분하면 리딩의 방향이 훨씬 선명해집니다.",
    3: "오늘 바로 할 일은 세 가지입니다. 첫째, 이미 결정한 것과 아직 조정할 수 있는 것을 나눠 적으세요. 둘째, 돈과 시간처럼 실제로 빠져나가는 자원을 숫자로 확인하세요. 셋째, 불안해서 움직이는 행동과 필요해서 움직이는 행동을 구분하세요.",
    5: "오늘은 리딩을 한 번에 결론 내리지 말고 기록으로 남기는 편이 좋습니다. 각 자리의 룬이 말하는 현실 단서를 하나씩 적고, 그중 이번 주 안에 확인할 수 있는 행동만 따로 표시하세요. 큰 예언보다 작은 검증이 더 정확합니다."
  };

  return `룬 리딩 기본 해석\n\n${astrologyLine}질문은 “${question}”입니다. 이번 주제는 ${topicLabel}이고, ${spread}개의 룬은 ${namedRunes}의 흐름으로 이어집니다. 핵심 키워드만 놓고 보면 ${keywordLine}의 순서입니다. ${introByTopic[topic] || introByTopic.general}\n\n${positionText}\n\n종합하면, 이번 리딩은 “잘했다 / 잘못했다”처럼 바로 판정하는 흐름이 아닙니다. 룬은 결정의 승패보다 그 결정이 지금 어떤 비용, 필요, 멈춤, 회복, 이동을 만들고 있는지 보게 합니다. 특히 돈과 자원이 걸린 질문이라면 감정적인 안도감과 실제 유지 비용을 분리해서 봐야 합니다. 좋은 선택이었다면 앞으로 살아날 자원이 보여야 하고, 무리한 선택이었다면 지금부터 조정해야 할 고정비와 에너지 누수가 드러납니다.\n\n룬스의 기본 리딩은 역방향, merkstave, 그림자 해석을 사용하지 않습니다. 뽑힌 룬의 본래 상징을 질문에 그대로 비추고, 사용자가 현실에서 확인할 수 있는 단서로 옮깁니다.\n\n${actionBySpread[spread] || actionBySpread[3]}`;
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
