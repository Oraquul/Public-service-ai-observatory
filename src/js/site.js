(function () {
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector("#site-nav");

  function setOpen(open) {
    if (!toggle || !nav) return;
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.textContent = open ? "Close" : "Menu";
    nav.classList.toggle("is-open", open);
  }

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        toggle.focus();
      }
    });
  }

  var library = document.querySelector("[data-library]");
  if (library) {
    var cards = Array.prototype.slice.call(library.querySelectorAll("[data-case]"));
    var pillar = library.querySelector('[data-filter="pillar"]');
    var evidence = library.querySelector('[data-filter="evidence"]');
    var search = library.querySelector('[data-filter="search"]');
    var empty = library.querySelector("[data-empty]");
    var count = library.querySelector("[data-count]");
    var clear = library.querySelector("[data-clear]");
    var form = library.querySelector("[data-filters]");

    function apply() {
      var pillarValue = pillar ? pillar.value : "";
      var evidenceValue = evidence ? evidence.value : "";
      var query = search ? search.value.trim().toLowerCase() : "";
      var shown = 0;
      cards.forEach(function (card) {
        var pillars = (card.getAttribute("data-pillar") || "").split(/\s+/);
        var matchesPillar = !pillarValue || pillars.indexOf(pillarValue) !== -1;
        var matchesEvidence =
          !evidenceValue || card.getAttribute("data-evidence") === evidenceValue;
        var haystack = (card.getAttribute("data-search") || "").toLowerCase();
        var matchesQuery = !query || haystack.indexOf(query) !== -1;
        var visible = matchesPillar && matchesEvidence && matchesQuery;
        card.hidden = !visible;
        if (visible) shown += 1;
      });
      if (empty) empty.hidden = shown !== 0;
      if (count) {
        count.textContent = shown === 1 ? "Showing 1 case" : "Showing " + shown + " cases";
      }
    }

    function writeQuery() {
      var params = new URLSearchParams();
      if (pillar && pillar.value) params.set("pillar", pillar.value);
      if (evidence && evidence.value) params.set("evidence", evidence.value);
      if (search && search.value.trim()) params.set("q", search.value.trim());
      var next = params.toString();
      var path = window.location.pathname;
      window.history.replaceState(null, "", next ? path + "?" + next : path);
    }

    var initial = new URLSearchParams(window.location.search);
    if (pillar && initial.get("pillar")) pillar.value = initial.get("pillar");
    if (evidence && initial.get("evidence")) evidence.value = initial.get("evidence");
    if (search && initial.get("q")) search.value = initial.get("q");
    apply();

    [pillar, evidence, search].forEach(function (control) {
      if (!control) return;
      control.addEventListener("input", function () {
        writeQuery();
        apply();
      });
      control.addEventListener("change", function () {
        writeQuery();
        apply();
      });
    });

    if (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        writeQuery();
        apply();
      });
    }

    if (clear) {
      clear.addEventListener("click", function () {
        if (pillar) pillar.value = "";
        if (evidence) evidence.value = "";
        if (search) search.value = "";
        writeQuery();
        apply();
        if (pillar) pillar.focus();
      });
    }
  }

  document.querySelectorAll("[data-load-youtube]").forEach(function (button) {
    button.addEventListener("click", function () {
      var panel = button.closest("[data-video-panel]");
      if (!panel) return;
      var frame = document.createElement("iframe");
      frame.src = button.getAttribute("data-load-youtube");
      frame.title = button.getAttribute("data-frame-title") || "YouTube playlist";
      frame.allowFullscreen = true;
      frame.setAttribute("allow", "fullscreen; picture-in-picture");
      frame.className = "video-frame";
      panel.replaceChildren(frame);
    });
  });

  document.querySelectorAll("form[data-local]").forEach(function (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var status = form.querySelector("[data-status]");
      if (status) status.textContent = "Nothing was sent. This worksheet stays in your browser.";
    });
  });

  document.querySelectorAll("form[data-enhance]").forEach(function (form) {
    form.addEventListener("submit", function (event) {
      if (!window.fetch || !window.FormData) return;
      event.preventDefault();
      var status = form.querySelector("[data-status]");
      var button = form.querySelector('[type="submit"]');
      if (button) button.disabled = true;
      if (status) status.textContent = "Sending.";
      fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
      })
        .then(function (response) {
          if (!response.ok) throw new Error("The form service did not accept the message.");
          form.reset();
          if (status) status.textContent = form.getAttribute("data-success");
        })
        .catch(function () {
          if (status) {
            status.textContent =
              "The message could not be sent from this page. You can submit the form again, or use the alternative route described here.";
          }
        })
        .finally(function () {
          if (button) button.disabled = false;
        });
    });
  });
})();
