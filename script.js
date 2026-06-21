const form = document.querySelector("#rsvpForm");
const confirmation = document.querySelector("#confirmation");
const confirmationText = document.querySelector("#confirmationText");
const downloadLink = document.querySelector("#downloadRsvp");
const weddingDate = new Date("2026-08-08T18:00:00-04:00");

function attendanceLabel(value) {
  return value === "Coming" ? "Приду" : "Не смогу прийти";
}

function makeInvitationText(data) {
  return [
    "Свадебное приглашение",
    "Махмуд и Зевар",
    "",
    "Дорогой гость!",
    "Мы будем счастливы видеть вас на нашем свадебном торжестве.",
    "",
    "Дата: суббота, 8 августа 2026",
    "Время: 18:00",
    "Место: ресторан Javonon",
    "",
    `Ваш ответ: ${attendanceLabel(data.attendance)}`,
    `Имя гостя: ${data.guestName}`,
    "",
    "Спасибо за ваш ответ!"
  ].join("\n");
}

function updateCountdown() {
  const diff = weddingDate.getTime() - Date.now();
  const remaining = Math.max(diff, 0);
  const days = Math.floor(remaining / 86400000);
  const hours = Math.floor((remaining % 86400000) / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);

  document.querySelector("#days").textContent = String(days).padStart(2, "0");
  document.querySelector("#hours").textContent = String(hours).padStart(2, "0");
  document.querySelector("#minutes").textContent = String(minutes).padStart(2, "0");
  document.querySelector("#seconds").textContent = String(seconds).padStart(2, "0");
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const data = Object.fromEntries(new FormData(form).entries());
  const invitationCopy = makeInvitationText(data);
  const button = form.querySelector("button");

  localStorage.setItem("makhmudZevarRsvp", JSON.stringify(data));

  const file = new Blob([invitationCopy], { type: "text/plain" });
  downloadLink.href = URL.createObjectURL(file);
  button.disabled = true;

  try {
    const result = await fetch("/api/rsvp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    if (!result.ok) throw new Error("RSVP save failed");

    confirmationText.textContent =
      data.attendance === "Coming"
        ? `${data.guestName}, спасибо! Ваш ответ сохранен: вы придете.`
        : `${data.guestName}, спасибо за ответ. Администратор увидит, что вы не сможете прийти.`;
  } catch (error) {
    confirmationText.textContent =
      "Ответ сохранен в этом браузере, но не отправлен администратору. Пожалуйста, попробуйте еще раз.";
  } finally {
    button.disabled = false;
    confirmation.hidden = false;
    confirmation.scrollIntoView({ behavior: "smooth", block: "center" });
  }
});

const savedRsvp = localStorage.getItem("makhmudZevarRsvp");

if (savedRsvp) {
  const data = JSON.parse(savedRsvp);
  for (const [name, value] of Object.entries(data)) {
    const field = form.elements[name];
    if (field) field.value = value;
  }
}

updateCountdown();
setInterval(updateCountdown, 1000);
