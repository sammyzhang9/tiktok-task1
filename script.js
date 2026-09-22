const WARN_MESSAGE = "sammy already sent you this video 3 days ago";
const WARN_TIMEOUT = 2600;
const SENT_TIMEOUT = 1100;

document.addEventListener("DOMContentLoaded", () => {
  const sheet = document.querySelector(".sheet");
  const searchBtn = document.querySelector(".search-btn");
  const closeBtn = document.querySelector(".close-btn");
  const contacts = document.querySelectorAll(".contact");
  const contactList = document.querySelector(".contacts");
  const duplicate = document.querySelector(".contact--duplicate");
  const duplicateMedia = duplicate.querySelector(".contact__media");
  const input = document.querySelector(".composer__input");
  const emojiButtons = document.querySelectorAll(".emoji");
  const sendBtn = document.querySelector(".composer__send");
  const announcer = document.querySelector(".sr-announcer");

  let phase = "idle";
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

  const selected = () => document.querySelectorAll(".contact.is-selected");

  const goIdle = () => {
    clearTimers();
    phase = "idle";
    sheet.classList.remove("is-composing");
    contactList.classList.remove("is-scrollable");
    duplicate.classList.remove("is-tipped", "is-warned");
    contacts.forEach((contact) => contact.classList.remove("is-selected"));
    sendBtn.classList.remove("is-done");
    sendBtn.textContent = "Send";
    input.value = "";
    announce("");
  };

  const warn = () => {
    clearTimers();
    // Drop the motion classes and flush styles so the recoil replays on re-entry.
    duplicate.classList.remove("is-warned");
    void duplicateMedia.offsetWidth;

    phase = "warned";
    duplicate.classList.add("is-tipped", "is-warned");
    announce(WARN_MESSAGE);
    navigator.vibrate?.([18, 40, 18]);
    timer = setTimeout(goIdle, WARN_TIMEOUT);
  };

  const openComposer = () => {
    clearTimers();
    phase = "composing";
    duplicate.classList.add("is-selected");
    sheet.classList.add("is-composing");
    announce("sending to sammy anyway — add a message");
    navigator.vibrate?.(24);
    // Let the row finish reflowing before it becomes scrollable.
    scrollTimer = setTimeout(() => contactList.classList.add("is-scrollable"), 400);
  };

  duplicate.addEventListener("click", () => {
    if (phase === "idle") {
      warn();
    } else if (phase === "warned") {
      openComposer();
    } else {
      duplicate.classList.toggle("is-selected");
    }
  });

  contacts.forEach((contact) => {
    if (contact === duplicate) return;

    contact.addEventListener("click", () => {
      if (phase === "composing") {
        contact.classList.toggle("is-selected");
        return;
      }
      // Picking someone else disarms the duplicate warning.
      goIdle();
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
    announce(`sent to ${selected().length} ${selected().length === 1 ? "person" : "people"}`);
    navigator.vibrate?.(24);
    timer = setTimeout(goIdle, SENT_TIMEOUT);
  });

  searchBtn.addEventListener("click", goIdle);
  closeBtn.addEventListener("click", goIdle);
});
