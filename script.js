const WARN_TIMEOUT = 2600;
const SENT_TIMEOUT = 1100;

document.addEventListener("DOMContentLoaded", () => {
  const sheet = document.querySelector(".sheet");
  const searchBtn = document.querySelector(".search-btn");
  const closeBtn = document.querySelector(".close-btn");
  const contactList = document.querySelector(".contacts");
  const contacts = [...document.querySelectorAll(".contact")];
  const input = document.querySelector(".composer__input");
  const emojiButtons = document.querySelectorAll(".emoji");
  const sendBtn = document.querySelector(".composer__send");
  const announcer = document.querySelector(".sr-announcer");

  let phase = "idle";
  let warned = null;
  let timer = null;
  let scrollTimer = null;

  const announce = (message) => {
    announcer.textContent = message;
  };

  const clearTimers = () => {
    clearTimeout(timer);
    clearTimeout(scrollTimer);
    timer = null;
    scrollTimer = null;
  };

  const clearWarning = () => {
    if (!warned) return;
    warned.classList.remove("is-tipped", "is-warned");
    warned = null;
  };

  const goIdle = () => {
    clearTimers();
    clearWarning();
    phase = "idle";
    sheet.classList.remove("is-composing");
    contactList.classList.remove("is-scrollable");
    contactList.scrollLeft = 0;
    contacts.forEach((contact) => contact.classList.remove("is-selected"));
    sendBtn.classList.remove("is-done");
    sendBtn.textContent = "Send";
    input.value = "";
    announce("");
  };

  const warn = (contact) => {
    clearTimers();
    clearWarning();
    // Flush styles so the recoil replays when the same contact is re-armed.
    contact.classList.remove("is-warned");
    void contact.querySelector(".contact__media").offsetWidth;

    phase = "warned";
    warned = contact;
    contact.classList.add("is-tipped", "is-warned");
    announce(
      `${contact.dataset.name} already sent you this video ${contact.dataset.sentAgo}`
    );
    navigator.vibrate?.([18, 40, 18]);
    timer = setTimeout(goIdle, WARN_TIMEOUT);
  };

  const openComposer = (contact) => {
    clearTimers();
    clearWarning();
    phase = "composing";
    contact.classList.add("is-selected");
    sheet.classList.add("is-composing");
    announce(`add a message for ${contact.dataset.name}`);
    navigator.vibrate?.(24);
    // Let the row finish reflowing before it becomes scrollable.
    scrollTimer = setTimeout(() => contactList.classList.add("is-scrollable"), 400);
  };

  contacts.forEach((contact) => {
    contact.addEventListener("click", () => {
      if (phase === "composing") {
        contact.classList.toggle("is-selected");
        if (!document.querySelector(".contact.is-selected")) {
          goIdle();
        }
        return;
      }

      // A friend who already shared this video gets one nudge before it sends.
      if (contact.classList.contains("contact--duplicate") && warned !== contact) {
        warn(contact);
        return;
      }

      openComposer(contact);
    });
  });

  emojiButtons.forEach((button) => {
    button.addEventListener("click", () => {
      input.value += button.textContent.trim();
      input.focus();
    });
  });

  sendBtn.addEventListener("click", () => {
    if (sendBtn.classList.contains("is-done")) return;

    clearTimers();
    sendBtn.classList.add("is-done");
    sendBtn.textContent = "Sent";
    const count = document.querySelectorAll(".contact.is-selected").length;
    announce(`sent to ${count} ${count === 1 ? "person" : "people"}`);
    navigator.vibrate?.(24);
    timer = setTimeout(goIdle, SENT_TIMEOUT);
  });

  searchBtn.addEventListener("click", goIdle);
  closeBtn.addEventListener("click", goIdle);
});
