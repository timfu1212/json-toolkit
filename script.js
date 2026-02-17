/*
 * ─────────────────────────────────────────
 *  JSON TOOLKIT - Main JavaScript
 *  Author: Tim Fu
 *  Zero dependencies, pure vanilla JS
 * ─────────────────────────────────────────
 */

/* ===== STATE ===== */
let parsedData = null;
let currentTab = "format";
let currentMode = "format";

/* ===== DOM ELEMENTS ===== */
const inputEl = document.getElementById("input");
const outputEl = document.getElementById("output");
const emptyState = document.getElementById("empty-state");
const statusEl = document.getElementById("status");
const toastEl = document.getElementById("toast");

/* ===== KEYBOARD SHORTCUT ===== */
inputEl.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
    e.preventDefault();
    doFormat();
  }
});

/* ===== CORE ACTIONS ===== */
function doFormat() {
  const raw = inputEl.value.trim();
  if (!raw) {
    setStatus("idle", "Nothing to format.");
    return;
  }

  const result = tryParse(raw);
  if (!result.ok) {
    setStatus("error", "✗ " + result.error);
    return;
  }

  parsedData = result.data;
  currentMode = "format";
  const formatted = JSON.stringify(parsedData, null, 2);

  showEmptyState(false);
  updateStats(raw, parsedData);
  renderCurrentTab(formatted);
  setStatus("ok", "✓ Valid JSON — formatted successfully");
}

function doMinify() {
  const raw = inputEl.value.trim();
  if (!raw) {
    setStatus("idle", "Nothing to minify.");
    return;
  }

  const result = tryParse(raw);
  if (!result.ok) {
    setStatus("error", "✗ " + result.error);
    return;
  }

  parsedData = result.data;
  currentMode = "minify";
  const minified = JSON.stringify(parsedData);

  showEmptyState(false);
  updateStats(raw, parsedData);
  switchTab("format");
  outputEl.innerHTML = escapeHtml(minified);
  setStatus("ok", `✓ Minified — ${minified.length} bytes`);
}

function doValidate() {
  const raw = inputEl.value.trim();
  if (!raw) {
    setStatus("idle", "Paste JSON first.");
    return;
  }

  const result = tryParse(raw);
  if (result.ok) {
    parsedData = result.data;
    updateStats(raw, parsedData);
    setStatus(
      "ok",
      `✓ Valid JSON — ${countKeys(parsedData)} keys, depth ${getDepth(parsedData)}`,
    );
  } else {
    setStatus("error", "✗ " + result.error);
  }
}

function clearAll() {
  inputEl.value = "";
  outputEl.innerHTML = "";
  outputEl.style.display = "none";
  showEmptyState(true);
  parsedData = null;
  setStatus("idle", "Cleared");
  resetStats();
}

function loadSample() {
  const sample = {
    developer: {
      name: "Tim Fu",
      role: "Full-stack Developer",
      location: "Taiwan",
      available: true,
      experience_years: 3,
      skills: {
        frontend: ["React", "Vue", "TypeScript", "TailwindCSS"],
        backend: ["Node.js", "Python", "PostgreSQL", "Redis"],
        tools: ["Docker", "Git", "CI/CD", "Linux"],
      },
      projects: [
        { name: "JSON Toolkit", type: "utility", stars: 42, live: true },
        { name: "LeetCode Quest", type: "game", stars: 18, live: false },
      ],
      contact: {
        github: "github.com/timfu",
        email: null,
      },
    },
  };
  inputEl.value = JSON.stringify(sample, null, 2);
  doFormat();
}

/* ===== TAB HANDLING ===== */
function switchTab(tab) {
  currentTab = tab;
  ["format", "tree", "csv"].forEach((t) => {
    document.getElementById("tab-" + t).classList.toggle("active", t === tab);
  });

  if (!parsedData) return;

  const formatted = JSON.stringify(parsedData, null, 2);
  renderCurrentTab(formatted);
}

function renderCurrentTab(formattedStr) {
  outputEl.style.display = "block";

  if (currentTab === "format") {
    outputEl.innerHTML = syntaxHighlight(formattedStr);
    outputEl.className = "";
  } else if (currentTab === "tree") {
    outputEl.innerHTML = "";
    outputEl.className = "";
    outputEl.appendChild(buildTree(parsedData, null));
  } else if (currentTab === "csv") {
    const result = buildCSVTable(parsedData);
    outputEl.innerHTML = result.html;
    outputEl.className = "";
    outputEl.dataset.csv = result.csv;
  }
}

/* ===== SYNTAX HIGHLIGHTING ===== */
function syntaxHighlight(str) {
  return str.replace(
    /("(?:[^"\\]|\\.)*")\s*:|("(?:[^"\\]|\\.)*")|(true|false)|(null)|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|([{}\[\]])/g,
    (match, key, str2, bool, nul, num, brace) => {
      if (key) return `<span class="j-key">${escapeHtml(key)}</span>:`;
      if (str2) return `<span class="j-str">${escapeHtml(str2)}</span>`;
      if (bool) return `<span class="j-bool">${bool}</span>`;
      if (nul) return `<span class="j-null">null</span>`;
      if (num) return `<span class="j-num">${num}</span>`;
      if (brace) return `<span class="j-brace">${brace}</span>`;
      return match;
    },
  );
}

/* ===== TREE VIEW ===== */
function buildTree(data, key) {
  const wrapper = document.createElement("div");
  wrapper.className = "tree-node";

  const row = document.createElement("div");
  row.className = "tree-row";

  const toggle = document.createElement("span");
  toggle.className = "tree-toggle";

  const keyEl = document.createElement("span");
  keyEl.className = "tree-key";
  if (key !== null) keyEl.textContent = `"${key}"`;

  const colon = document.createElement("span");
  colon.className = "tree-colon";
  if (key !== null) colon.textContent = ": ";

  const typeTag = document.createElement("span");
  typeTag.className = "tree-type";

  row.appendChild(toggle);
  if (key !== null) {
    row.appendChild(keyEl);
    row.appendChild(colon);
  }
  row.appendChild(typeTag);
  wrapper.appendChild(row);

  if (Array.isArray(data)) {
    typeTag.textContent = `array[${data.length}]`;
    toggle.textContent = "▼";

    const children = document.createElement("div");
    children.className = "tree-children";
    data.forEach((item, i) => children.appendChild(buildTree(item, i)));
    wrapper.appendChild(children);

    row.addEventListener("click", () => toggleNode(toggle, children));
  } else if (data !== null && typeof data === "object") {
    const keys = Object.keys(data);
    typeTag.textContent = `object{${keys.length}}`;
    toggle.textContent = "▼";

    const children = document.createElement("div");
    children.className = "tree-children";
    keys.forEach((k) => children.appendChild(buildTree(data[k], k)));
    wrapper.appendChild(children);

    row.addEventListener("click", () => toggleNode(toggle, children));
  } else {
    toggle.textContent = "·";
    const valEl = document.createElement("span");

    if (data === null) {
      valEl.className = "j-null";
      valEl.textContent = "null";
    } else if (typeof data === "boolean") {
      valEl.className = "j-bool";
      valEl.textContent = String(data);
    } else if (typeof data === "number") {
      valEl.className = "j-num";
      valEl.textContent = String(data);
    } else {
      valEl.className = "j-str";
      valEl.textContent = `"${data}"`;
    }

    typeTag.textContent = typeof data;
    row.appendChild(valEl);
  }

  return wrapper;
}

function toggleNode(toggleEl, childrenEl) {
  const collapsed = childrenEl.classList.toggle("collapsed");
  toggleEl.textContent = collapsed ? "▶" : "▼";
}

/* ===== CSV CONVERTER ===== */
function buildCSVTable(data) {
  if (!Array.isArray(data) || data.length === 0) {
    return {
      html: `<div class="empty-state" style="height:200px">
               <div class="empty-brace">[ ]</div>
               <div class="empty-hint">CSV view requires a JSON <strong>array of objects</strong>.<br>Try the sample data.</div>
             </div>`,
      csv: "",
    };
  }

  const headers = [...new Set(data.flatMap((row) => Object.keys(row)))];

  const csvLines = [
    headers.map((h) => `"${h}"`).join(","),
    ...data.map((row) =>
      headers
        .map((h) => {
          const val = row[h] == null ? "" : String(row[h]);
          return `"${val.replace(/"/g, '""')}"`;
        })
        .join(","),
    ),
  ];
  const csv = csvLines.join("\n");

  const html = `
    <div class="csv-table-wrap">
      <table class="csv-table">
        <thead><tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}</tr></thead>
        <tbody>
          ${data
            .map(
              (row) =>
                `<tr>${headers
                  .map((h) => {
                    const v = row[h];
                    const display =
                      v == null
                        ? '<span style="color:var(--muted)">null</span>'
                        : escapeHtml(String(v));
                    return `<td>${display}</td>`;
                  })
                  .join("")}</tr>`,
            )
            .join("")}
        </tbody>
      </table>
    </div>`;

  return { html, csv };
}

/* ===== STATS ===== */
function updateStats(rawStr, data) {
  const keys = countKeys(data);
  const depth = getDepth(data);
  const bytes = new Blob([rawStr]).size;

  const fmt = (n) => (n >= 1024 ? `${(n / 1024).toFixed(1)}kb` : `${n}b`);

  setStat("stat-valid", "✓ valid", true);
  setStat("stat-keys", `${keys} keys`, true);
  setStat("stat-depth", `${depth} deep`, true);
  setStat("stat-size", fmt(bytes), true);
}

function resetStats() {
  setStat("stat-valid", "— valid", false);
  setStat("stat-keys", "— keys", false);
  setStat("stat-depth", "— depth", false);
  setStat("stat-size", "— bytes", false);
}

function setStat(id, text, active) {
  const el = document.getElementById(id);
  el.textContent = text;
  el.classList.toggle("active", active);
}

function countKeys(data) {
  if (data === null || typeof data !== "object") return 0;
  if (Array.isArray(data)) return data.reduce((s, v) => s + countKeys(v), 0);
  return (
    Object.keys(data).length +
    Object.values(data).reduce((s, v) => s + countKeys(v), 0)
  );
}

function getDepth(data) {
  if (data === null || typeof data !== "object") return 0;
  if (Array.isArray(data)) return 1 + Math.max(0, ...data.map(getDepth));
  const vals = Object.values(data);
  return 1 + (vals.length ? Math.max(...vals.map(getDepth)) : 0);
}

/* ===== CLIPBOARD & FILE ===== */
async function copyOutput() {
  const text = currentTab === "csv" ? outputEl.dataset.csv : outputEl.innerText;

  if (!text) {
    toast("Nothing to copy");
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    toast("Copied ✓");
  } catch {
    toast("Copy failed");
  }
}

async function pasteFromClipboard() {
  try {
    const text = await navigator.clipboard.readText();
    inputEl.value = text;
    doFormat();
  } catch {
    toast("Paste failed — use Ctrl+V instead");
  }
}

function downloadOutput() {
  let content, filename, mime;
  if (currentTab === "csv" && outputEl.dataset.csv) {
    content = outputEl.dataset.csv;
    filename = "output.csv";
    mime = "text/csv";
  } else if (parsedData) {
    const indent = currentMode === "minify" ? 0 : 2;
    content = JSON.stringify(parsedData, null, indent);
    filename = "output.json";
    mime = "application/json";
  } else {
    toast("Nothing to download");
    return;
  }

  const blob = new Blob([content], { type: mime });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
  toast(`Downloaded ${filename}`);
}

/* ===== UTILITIES ===== */
function tryParse(raw) {
  try {
    return { ok: true, data: JSON.parse(raw) };
  } catch (e) {
    const msg = e.message
      .replace(/^JSON\.parse: /, "")
      .replace(/^Unexpected token /, 'Unexpected "');
    return { ok: false, error: msg };
  }
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function setStatus(type, message) {
  statusEl.textContent = message;
  statusEl.className = type;
}

function showEmptyState(show) {
  emptyState.style.display = show ? "flex" : "none";
  outputEl.style.display = show ? "none" : "block";
}

function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  clearTimeout(toastEl._timer);
  toastEl._timer = setTimeout(() => toastEl.classList.remove("show"), 2000);
}
