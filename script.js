// The primary action (Call 1600) and secondary action (Chat via LINE) are real
// tel: / https: links, so the core contact flow works fully with JS disabled.
// The Hero slider below is progressive enhancement: the first slide is a
// normal visible <img> with no JS, this script only adds rotation/navigation.

(function () {
  var slider = document.querySelector(".hero-slider");
  if (!slider) return;

  var track = slider.querySelector(".hero-slider__track");
  var slides = Array.prototype.slice.call(
    slider.querySelectorAll(".hero-slider__slide")
  );
  var dots = Array.prototype.slice.call(
    slider.querySelectorAll(".hero-slider__dot")
  );
  var prevBtn = slider.querySelector(".hero-slider__control--prev");
  var nextBtn = slider.querySelector(".hero-slider__control--next");
  var status = slider.querySelector(".hero-slider__status");

  if (!track || slides.length === 0) return;

  var total = slides.length;
  var current = 0;
  var intervalId = null;
  var AUTO_DELAY = 6000;
  var reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  function goTo(index) {
    current = (index + total) % total;

    slides.forEach(function (slide, i) {
      slide.classList.toggle("is-active", i === current);
    });

    dots.forEach(function (dot, i) {
      var isActive = i === current;
      dot.classList.toggle("is-active", isActive);
      if (isActive) {
        dot.setAttribute("aria-current", "true");
      } else {
        dot.removeAttribute("aria-current");
      }
    });

    if (status) {
      status.textContent = "แสดงภาพที่ " + (current + 1) + " จาก " + total;
    }
  }

  function next() {
    goTo(current + 1);
  }

  function prev() {
    goTo(current - 1);
  }

  function start() {
    if (reduceMotion || intervalId !== null) return;
    intervalId = window.setInterval(next, AUTO_DELAY);
  }

  function stop() {
    if (intervalId !== null) {
      window.clearInterval(intervalId);
      intervalId = null;
    }
  }

  if (prevBtn) prevBtn.addEventListener("click", prev);
  if (nextBtn) nextBtn.addEventListener("click", next);

  dots.forEach(function (dot, i) {
    dot.addEventListener("click", function () {
      goTo(i);
    });
  });

  slider.addEventListener("mouseenter", stop);
  slider.addEventListener("mouseleave", start);
  slider.addEventListener("focusin", stop);
  slider.addEventListener("focusout", function (event) {
    if (!slider.contains(event.relatedTarget)) start();
  });

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      stop();
    } else {
      start();
    }
  });

  goTo(0);
  start();
})();

// Vaping education section: collapsed by default, expanded via a real
// <button> so it works with mouse, keyboard, and screen readers without
// relying on the native <details> disclosure widget's default styling.
(function () {
  var toggle = document.querySelector(".vaping-edu__toggle");
  if (!toggle) return;

  var contentId = toggle.getAttribute("aria-controls");
  var content = contentId ? document.getElementById(contentId) : null;
  var label = toggle.querySelector(".vaping-edu__toggle-label");
  var collapsedLabel = toggle.getAttribute("data-label-collapsed");
  var expandedLabel = toggle.getAttribute("data-label-expanded");

  if (!content) return;

  toggle.addEventListener("click", function () {
    var isExpanded = toggle.getAttribute("aria-expanded") === "true";
    var nextExpanded = !isExpanded;

    toggle.setAttribute("aria-expanded", String(nextExpanded));
    content.hidden = !nextExpanded;

    if (label) {
      label.textContent = nextExpanded ? expandedLabel : collapsedLabel;
    }
  });
})();

// Floating Chat invitation: polite launcher + non-modal panel, with a
// once-per-session auto-open after 10s of visible page time. Cancelled the
// moment the user opens the launcher themselves, dismisses the panel, or
// clicks any existing link to the same verified Chat destination.
(function () {
  var root = document.querySelector("[data-floating-chat]");
  if (!root) return;

  var panel = document.getElementById("floating-chat-panel");
  var launcher = root.querySelector("[data-chat-launcher]");
  var closeBtn = root.querySelector("[data-chat-close]");
  var laterBtn = root.querySelector("[data-chat-later]");
  var startLink = root.querySelector("[data-chat-start]");

  if (!panel || !launcher || !closeBtn || !laterBtn || !startLink) return;

  var chatUrl = startLink.getAttribute("href");

  var KEY_SHOWN = "quitlineChatInvitationShown";
  var KEY_DISMISSED = "quitlineChatInvitationDismissed";
  var KEY_INTERACTED = "quitlineChatInteractionStarted";

  var AUTO_DELAY = 10000;
  var reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  function hasFlag(key) {
    try {
      return sessionStorage.getItem(key) === "true";
    } catch (e) {
      return false;
    }
  }

  function setFlag(key) {
    try {
      sessionStorage.setItem(key, "true");
    } catch (e) {}
  }

  function isOpen() {
    return !panel.hidden;
  }

  function openPanel(moveFocus) {
    panel.hidden = false;
    launcher.setAttribute("aria-expanded", "true");
    window.requestAnimationFrame(function () {
      panel.classList.add("is-open");
    });
    if (moveFocus) closeBtn.focus();
  }

  function closePanel(returnFocus) {
    panel.classList.remove("is-open");
    launcher.setAttribute("aria-expanded", "false");
    var finish = function () {
      panel.hidden = true;
    };
    if (reduceMotion) {
      finish();
    } else {
      window.setTimeout(finish, 200);
    }
    if (returnFocus) launcher.focus();
  }

  var autoOpenEligible =
    !hasFlag(KEY_SHOWN) && !hasFlag(KEY_DISMISSED) && !hasFlag(KEY_INTERACTED);
  var remaining = AUTO_DELAY;
  var timerId = null;
  var lastStart = null;

  function cancelAutoOpen() {
    autoOpenEligible = false;
    if (timerId !== null) {
      window.clearTimeout(timerId);
      timerId = null;
    }
  }

  function fireAutoOpen() {
    timerId = null;
    if (!autoOpenEligible || isOpen()) return;
    if (hasFlag(KEY_SHOWN) || hasFlag(KEY_DISMISSED) || hasFlag(KEY_INTERACTED)) {
      autoOpenEligible = false;
      return;
    }
    setFlag(KEY_SHOWN);
    openPanel(false);
  }

  function armTimer() {
    if (!autoOpenEligible || document.hidden || timerId !== null) return;
    lastStart = Date.now();
    timerId = window.setTimeout(fireAutoOpen, remaining);
  }

  function pauseTimer() {
    if (timerId !== null) {
      window.clearTimeout(timerId);
      timerId = null;
      remaining -= Date.now() - lastStart;
      if (remaining < 0) remaining = 0;
    }
  }

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      pauseTimer();
    } else {
      armTimer();
    }
  });

  if (autoOpenEligible) armTimer();

  launcher.addEventListener("click", function () {
    setFlag(KEY_SHOWN);
    cancelAutoOpen();
    if (isOpen()) {
      closePanel(true);
    } else {
      openPanel(true);
    }
  });

  closeBtn.addEventListener("click", function () {
    setFlag(KEY_DISMISSED);
    cancelAutoOpen();
    closePanel(true);
  });

  laterBtn.addEventListener("click", function () {
    setFlag(KEY_DISMISSED);
    cancelAutoOpen();
    closePanel(true);
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && isOpen()) {
      setFlag(KEY_DISMISSED);
      cancelAutoOpen();
      closePanel(true);
    }
  });

  // Any existing link to the same verified Chat destination (header, contact
  // cards, vaping-education prompt, footer, this panel's own Start Chat link)
  // counts as the user having started a chat interaction.
  document.addEventListener("click", function (event) {
    var link = event.target.closest ? event.target.closest("a[href]") : null;
    if (!link || link.getAttribute("href") !== chatUrl) return;
    setFlag(KEY_INTERACTED);
    cancelAutoOpen();
  });
})();
