const rows = document.querySelector("#rsvpRows");
const totalCount = document.querySelector("#totalCount");
const comingCount = document.querySelector("#comingCount");
const notComingCount = document.querySelector("#notComingCount");
const adminError = document.querySelector("#adminError");
const refreshButton = document.querySelector("#refreshAdmin");
const downloadCsvButton = document.querySelector("#downloadCsv");
const adminCodeInput = document.querySelector("#adminCode");

adminCodeInput.value = localStorage.getItem("weddingAdminCode") || "";

function formatAttendance(value) {
  return value === "Coming" ? "Придет" : "Не придет";
}

function formatDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderRsvps(items) {
  const coming = items.filter((item) => item.attendance === "Coming").length;
  const notComing = items.filter((item) => item.attendance === "Not coming").length;

  totalCount.textContent = items.length;
  comingCount.textContent = coming;
  notComingCount.textContent = notComing;

  if (!items.length) {
    rows.innerHTML = '<tr><td colspan="4">Пока нет ответов.</td></tr>';
    return;
  }

  rows.innerHTML = items
    .map((item) => `
      <tr>
        <td>${escapeHtml(item.guestName)}</td>
        <td><span class="status ${item.attendance === "Coming" ? "yes" : "no"}">${formatAttendance(item.attendance)}</span></td>
        <td>${escapeHtml(item.message || "")}</td>
        <td>${formatDate(item.createdAt)}</td>
      </tr>
    `)
    .join("");
}

async function loadRsvps() {
  adminError.hidden = true;
  refreshButton.disabled = true;

  try {
    const code = adminCodeInput.value.trim();
    localStorage.setItem("weddingAdminCode", code);

    const response = await fetch("/api/rsvps", {
      headers: { "X-Admin-Code": code }
    });
    if (!response.ok) throw new Error("Could not load RSVP responses");
    const items = await response.json();
    renderRsvps(items);
  } catch (error) {
    adminError.textContent = "Не удалось загрузить ответы. Проверьте код администратора.";
    adminError.hidden = false;
  } finally {
    refreshButton.disabled = false;
  }
}

async function downloadCsv() {
  const code = adminCodeInput.value.trim();
  localStorage.setItem("weddingAdminCode", code);

  const response = await fetch("/api/rsvps.csv", {
    headers: { "X-Admin-Code": code }
  });

  if (!response.ok) {
    adminError.textContent = "Не удалось скачать CSV. Проверьте код администратора.";
    adminError.hidden = false;
    return;
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "makhmud-zevar-rsvps.csv";
  link.click();
  URL.revokeObjectURL(url);
}

refreshButton.addEventListener("click", loadRsvps);
downloadCsvButton.addEventListener("click", downloadCsv);
loadRsvps();
