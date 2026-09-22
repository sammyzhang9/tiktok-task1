const WARN_TIMEOUT = 2600;
const SENT_TIMEOUT = 1100;

document.addEventListener("DOMContentLoaded", () => {
  const phone = document.querySelector(".phone");
  const sheet = document.querySelector(".sheet");
  const searchBtn = document.querySelector(".search-btn");
  const closeBtn = document.querySelector(".close-btn");
  const contactList = document.querySelector(".contacts");
  const contacts = [...document.querySelectorAll(".contact")];
  const input = document.querySelector(".composer__input");
  const emojiButtons = document.querySelectorAll(".emoji");
  const sendBtn = document.querySelector(".composer__send");
  const jump = document.querySelector(".jump");
  const jumpLabel = document.querySelector(".jump__label");
  const jumpMore = document.querySelector(".jump__more");
  const peek = document.querySelector(".peek");
  const peekWho = document.querySelector(".peek__who");
  const peekTitle = document.querySelector(".peek__title");
  const peekWhen = document.querySelector(".peek__when");
  const peekAvatar = document.querySelector(".peek__avatar");
  const peekName = document.querySelector(".peek__name");
  const peekCaption = document.querySelector(".peek__caption");
  const peekBack = document.querySelector(".peek__back");
  const announcer = document.querySelector(".sr-announcer");

  let phase = "idle";
  let warned = null;
  let jumpTarget = null;
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

  const selectedDuplicates = () =>
    contacts.filter(
      (contact) =>
        contact.classList.contains("contact--duplicate") &&
        contact.classList.contains("is-selected")
    );

  const closePeek = () => {
    phone.classList.remove("is-peeking");
    peek.setAttribute("aria-hidden", "true");
    peek.inert = true;
  };

  const fillPeek = (contact) => {
    const src = contact.querySelector(".contact__avatar").src;
    peekWho.src = src;
    peekAvatar.src = src;
    peekTitle.textContent = contact.dataset.name;
    peekName.textContent = contact.dataset.name;
    peekWhen.textContent = contact.dataset.sentAgo;
    peekCaption.textContent = contact.dataset.caption;
  };

  const openPeek = () => {
    if (!jumpTarget) return;
    fillPeek(jumpTarget);
    phone.classList.add("is-peeking");
    peek.setAttribute("aria-hidden", "false");
    peek.inert = false;
    announce(`${jumpTarget.dataset.name} sent this ${jumpTarget.dataset.sentAgo}`);
  };

  const syncJump = () => {
    const dups = selectedDuplicates();

    if (jumpTarget && !dups.includes(jumpTarget)) {
      jumpTarget = dups[0] || null;
    }
    if (!jumpTarget && dups.length) {
      jumpTarget = dups[0];
    }

    if (!jumpTarget) {
      sheet.classList.remove("has-jump");
      jump.setAttribute("aria-hidden", "true");
      jump.tabIndex = -1;
      closePeek();
      return;
    }

    const others = dups.filter((contact) => contact !== jumpTarget);
    jumpLabel.textContent = `${jumpTarget.dataset.name} sent this · ${jumpTarget.dataset.sentShort}`;
    jumpMore.textContent =
      others.length === 0
        ? ""
        : others.length === 1
          ? `+ ${others[0].dataset.name}`
          : `+ ${others.length} others`;
    jump.setAttribute(
      "aria-label",
      `Jump to ${jumpTarget.dataset.name}’s message from ${jumpTarget.dataset.sentAgo}`
    );
    jump.setAttribute("aria-hidden", "false");
    jump.tabIndex = 0;
    sheet.classList.add("has-jump");
  };

  const goIdle = () => {
    clearTimers();
    clearWarning();
    closePeek();
    phase = "idle";
    jumpTarget = null;
    sheet.classList.remove("is-composing", "has-jump");
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
    if (contact.classList.contains("contact--duplicate")) {
      jumpTarget = contact;
    }
    sheet.classList.add("is-composing");
    syncJump();
    announce(`add a message for ${contact.dataset.name}`);
    navigator.vibrate?.(24);
    // Let the row finish reflowing before it becomes scrollable.
    scrollTimer = setTimeout(() => contactList.classList.add("is-scrollable"), 400);
  };

  contacts.forEach((contact) => {
    contact.addEventListener("click", () => {
      if (phase === "composing") {
        contact.classList.toggle("is-selected");
        if (contact.classList.contains("is-selected") && contact.classList.contains("contact--duplicate")) {
          jumpTarget = contact;
        }
        if (!document.querySelector(".contact.is-selected")) {
          goIdle();
          return;
        }
        syncJump();
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

  jump.addEventListener("click", openPeek);
  peekBack.addEventListener("click", () => {
    closePeek();
    announce("back to share");
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
    closePeek();
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
