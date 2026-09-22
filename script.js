const WARN_MESSAGE = "sammy already sent you this video 3 days ago";
const SENT_MESSAGE = "sent to sammy anyway";
const WARN_TIMEOUT = 2600;
const SENT_TIMEOUT = 1600;

document.addEventListener("DOMContentLoaded", () => {
  const searchBtn = document.querySelector(".search-btn");
  const closeBtn = document.querySelector(".close-btn");
  const contacts = document.querySelectorAll(".contact");
  const duplicate = document.querySelector(".contact--duplicate");
  const duplicateMedia = duplicate.querySelector(".contact__media");
  const announcer = document.querySelector(".sr-announcer");

  let phase = "idle";
  let timer = null;

  const announce = (message) => {
    announcer.textContent = message;
  };

  const clearTimer = () => {
    clearTimeout(timer);
    timer = null;
  };

  const goIdle = () => {
    clearTimer();
    phase = "idle";
    duplicate.classList.remove("is-tipped", "is-warned", "is-sent");
    announce("");
  };

  const warn = () => {
    clearTimer();
    // Drop the motion classes and flush styles so the recoil replays on re-entry.
    duplicate.classList.remove("is-warned", "is-sent");
    void duplicateMedia.offsetWidth;

    phase = "warned";
    duplicate.classList.add("is-tipped", "is-warned");
    announce(WARN_MESSAGE);
    navigator.vibrate?.([18, 40, 18]);
    timer = setTimeout(goIdle, WARN_TIMEOUT);
  };

  const confirmSend = () => {
    clearTimer();
    duplicate.classList.remove("is-warned");
    void duplicateMedia.offsetWidth;

    phase = "sent";
    duplicate.classList.add("is-tipped", "is-sent");
    announce(SENT_MESSAGE);
    navigator.vibrate?.(24);
    timer = setTimeout(goIdle, SENT_TIMEOUT);
  };

  duplicate.addEventListener("click", () => {
    if (phase === "idle") {
      warn();
    } else if (phase === "warned") {
      confirmSend();
    }
    // While sent, wait for the confirmation to settle back to idle.
  });

  searchBtn.addEventListener("click", goIdle);
  closeBtn.addEventListener("click", goIdle);

  contacts.forEach((contact) => {
    if (contact === duplicate) return;

    contact.addEventListener("click", () => {
      // Picking someone else disarms the duplicate warning.
      goIdle();
    });
  });
});
