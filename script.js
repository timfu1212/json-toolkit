/**
 * JSON TOOLKIT LOGIC
 */
let parsedData = null;
let currentTab = "format";
let currentMode = "format";

document.getElementById("input").addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
    e.preventDefault();
    doFormat();
  }
});

// 這裡放入你原本所有的 JS 函數，例如 doFormat(), doMinify(), buildTree() 等...
function doFormat() {
  const raw = document.getElementById("input").value.trim();
  if (!raw) return;
  const result = tryParse(raw);
  if (!result.ok) {
    setStatus("error", "✗ " + result.error);
    return;
  }
  // ...其餘邏輯
}

/* (省略其餘函數，請將原本程式碼中的 Script 段落完整複製到這裡) */
