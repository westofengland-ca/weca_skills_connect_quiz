/* Youth Guarantee quiz for Skills Connect.
   Two questions: age, then area (or support type for under 16s and 22+).
   Programme results come from programmes.json, filtered by area and age.
   No build step, no dependencies. */
(function () {
  "use strict";

  // ---- Config
  var LINKS = {
    ygPage: "https://www.skillsconnect.org.uk/youth-guarantee/",
    directory: "https://www.skillsconnect.org.uk/directory/",
    contact: "https://www.skillsconnect.org.uk/contact-us/speak-to-us/",
    ncs: "https://nationalcareers.service.gov.uk/"
  };
  var DATA_URL = "programmes.json";
  // Pages allowed to receive analytics events and height updates from this quiz
  var HOST_ORIGINS = ["https://www.skillsconnect.org.uk", "https://skillsconnect.org.uk"];

  var AREAS = {
    "bristol": "Bristol",
    "banes": "Bath and North East Somerset",
    "north-somerset": "North Somerset",
    "south-glos": "South Gloucestershire"
  };

  var AGE_BANDS = {
    "16-17": { min: 16, max: 17 },
    "18-21": { min: 18, max: 21 }
  };

  var QUESTIONS = {
    age: {
      text: "How old are you?",
      error: "Select your age",
      options: [
        { value: "under-16", label: "Under 16" },
        { value: "16-17", label: "16 or 17" },
        { value: "18-21", label: "18 to 21" },
        { value: "22-plus", label: "22 or over" }
      ],
      next: function (v) { return AGE_BANDS[v] ? "area" : "support"; }
    },
    area: {
      text: "Where do you live?",
      error: "Select where you live",
      options: [
        { value: "bristol", label: "Bristol" },
        { value: "banes", label: "Bath and North East Somerset" },
        { value: "north-somerset", label: "North Somerset" },
        { value: "south-glos", label: "South Gloucestershire" },
        { value: "elsewhere", label: "Somewhere else" }
      ],
      next: function () { return null; }
    },
    support: {
      text: "What do you need support with?",
      hint: "Youth Guarantee projects are for 16 to 21 year olds, but there is other support you can get.",
      error: "Select what you need support with",
      options: [
        { value: "directory", label: "I want to see what support is available to me" },
        { value: "contact", label: "I want to speak to someone about my next steps" }
      ],
      next: function () { return null; }
    }
  };

  var TOTAL_STEPS = 2; // every route is two questions

  // ---- Setup
  var root = document.getElementById("yg-quiz");
  if (!root) return;

  var quizId = root.getAttribute("data-quiz-id") || "yg-quiz";
  var embedded = isEmbedded();
  if (embedded) document.documentElement.classList.add("is-embedded");

  var answers = {};
  var path = ["age"];     // question ids visited; last item is the current step
  var started = false;
  var programmesPromise = loadProgrammes();

  var card = el("div", { "class": "yg-card" });
  root.appendChild(card);

  renderQuestion(false);
  watchHeight();

  // ---- Rendering
  function renderQuestion(moveFocus) {
    var qid = path[path.length - 1];
    var q = QUESTIONS[qid];
    var stepNo = path.length;
    var errorId = "yg-error-" + qid;
    var hintId = "yg-hint-" + qid;

    clear(card);

    var form = el("form", { "class": "yg-form", novalidate: "novalidate" });
    var progress = el("p", { "class": "yg-progress" }, "Question " + stepNo + " of " + TOTAL_STEPS);
    var fieldset = el("fieldset", { "class": "yg-fieldset" });
    var legend = el("legend", { "class": "yg-legend" });
    var heading = el("h2", { "class": "yg-q", tabindex: "-1" }, q.text);
    legend.appendChild(heading);
    fieldset.appendChild(legend);

    var describedBy = [];
    if (q.hint) {
      fieldset.appendChild(el("p", { "class": "yg-hint", id: hintId }, q.hint));
      describedBy.push(hintId);
    }

    var error = el("p", { "class": "yg-error", id: errorId, hidden: "hidden" });
    fieldset.appendChild(error);
    if (describedBy.length) fieldset.setAttribute("aria-describedby", describedBy.join(" "));

    var options = el("div", { "class": "yg-options" });
    q.options.forEach(function (opt, i) {
      var inputId = "yg-" + qid + "-" + i;
      var label = el("label", { "class": "yg-option", "for": inputId });
      var input = el("input", { type: "radio", name: qid, id: inputId, value: opt.value });
      if (answers[qid] === opt.value) input.checked = true;
      label.appendChild(input);
      label.appendChild(el("span", {}, opt.label));
      options.appendChild(label);
    });
    fieldset.appendChild(options);

    var actions = el("div", { "class": "yg-actions" });
    if (path.length > 1) {
      var back = el("button", { type: "button", "class": "yg-btn yg-btn--secondary" }, "Back");
      back.addEventListener("click", goBack);
      actions.appendChild(back);
    }
    actions.appendChild(el("button", { type: "submit", "class": "yg-btn yg-btn--primary" }, "Continue"));

    form.appendChild(progress);
    form.appendChild(fieldset);
    form.appendChild(actions);
    card.appendChild(form);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var checked = form.querySelector('input[name="' + qid + '"]:checked');
      if (!checked) {
        error.hidden = false;
        error.textContent = "";
        error.appendChild(el("span", { "class": "visually-hidden" }, "Error: "));
        error.appendChild(document.createTextNode(q.error));
        fieldset.classList.add("yg-fieldset--error");
        fieldset.setAttribute("aria-describedby", describedBy.concat(errorId).join(" "));
        form.querySelector("input").focus();
        return;
      }
      if (!started) {
        started = true;
        track("quiz_start", {});
      }
      answers[qid] = checked.value;
      track("quiz_answer", { question_id: qid, answer: checked.value });

      var nextId = q.next(checked.value);
      if (nextId) {
        path.push(nextId);
        renderQuestion(true);
      } else {
        renderResult();
      }
    });

    if (moveFocus) heading.focus();
  }

  function goBack() {
    if (path.length < 2) return;
    delete answers[path.pop()];
    track("quiz_back", {});
    renderQuestion(true);
  }

  function restart() {
    answers = {};
    path = ["age"];
    track("quiz_restart", {});
    renderQuestion(true);
  }

  function renderResult() {
    if (answers.support) {
      if (answers.support === "directory") {
        showSimpleResult("directory", "Find support in the Skills Connect directory",
          "The Skills Connect directory lists support for people of all ages in the West of England.",
          { text: "Search the Skills Connect directory", href: LINKS.directory, type: "directory" });
      } else {
        showSimpleResult("contact", "Speak to Skills Connect",
          "Use the Skills Connect contact form to ask about your next steps.",
          { text: "Contact Skills Connect", href: LINKS.contact, type: "contact" });
      }
      return;
    }

    if (answers.area === "elsewhere") {
      showSimpleResult("ncs", "Find support where you live",
        "These Youth Guarantee projects are for young people who live in Bristol, Bath and North East Somerset, North Somerset or South Gloucestershire. The National Careers Service can help you find careers advice and support wherever you live.",
        { text: "Go to the National Careers Service", href: LINKS.ncs, type: "ncs" });
      return;
    }

    clear(card);
    card.appendChild(el("p", { "class": "yg-progress" }, "Loading results"));

    programmesPromise.then(function (all) {
      if (!all) {
        showSimpleResult("error", "See Youth Guarantee projects",
          "We could not load the list of projects. You can see them all on the Youth Guarantee page.",
          { text: "See all Youth Guarantee projects", href: LINKS.ygPage, type: "yg_page" });
        return;
      }
      var band = AGE_BANDS[answers.age];
      var matches = matchProgrammes(all, answers.area, band);
      if (!matches.length) {
        showSimpleResult("none", "Speak to Skills Connect",
          "There are no Youth Guarantee projects open for you in " + AREAS[answers.area] + " right now. Skills Connect can help you find other support.",
          { text: "Contact Skills Connect", href: LINKS.contact, type: "contact" });
        return;
      }
      showProgrammes(matches);
    });
  }

  function showProgrammes(list) {
    clear(card);
    var heading = el("h2", { "class": "yg-result-h", tabindex: "-1" },
      "Youth Guarantee support in " + AREAS[answers.area]);
    var lead = el("p", { "class": "yg-lead" },
      (list.length === 1 ? "This project is" : "These " + list.length + " projects are") +
      " free. Check who each one is for, then apply to any that suit you.");

    var ul = el("ul", { "class": "yg-programmes" });
    list.forEach(function (p) {
      var li = el("li", { "class": "yg-programme" });
      li.appendChild(el("h3", {}, p.name));
      li.appendChild(el("p", {}, p.summary));
      var who = el("p", { "class": "yg-who" });
      who.appendChild(el("span", {}, "Who it is for: "));
      who.appendChild(document.createTextNode(p.who_for));
      li.appendChild(who);
      var a = linkEl(p.apply_label, p.apply_url, "yg-apply");
      a.addEventListener("click", function () {
        track("quiz_link_click", { link_type: "apply", programme_id: p.id });
      });
      li.appendChild(a);
      ul.appendChild(li);
    });

    var more = el("p", { "class": "yg-more" });
    more.appendChild(document.createTextNode("Not sure which one is right for you? "));
    var contact = linkEl("Speak to Skills Connect", LINKS.contact, "yg-link");
    contact.addEventListener("click", function () {
      track("quiz_link_click", { link_type: "contact" });
    });
    more.appendChild(contact);

    card.appendChild(heading);
    card.appendChild(lead);
    card.appendChild(ul);
    card.appendChild(more);
    card.appendChild(restartActions());

    track("quiz_complete", {
      outcome: "programmes",
      age_band: answers.age,
      area: answers.area,
      result_count: list.length
    });
    heading.focus();
  }

  function showSimpleResult(outcome, title, text, link) {
    clear(card);
    var heading = el("h2", { "class": "yg-result-h", tabindex: "-1" }, title);
    var p = el("p", { "class": "yg-lead" }, text);
    var linkWrap = el("p", { "class": "yg-more" });
    var a = linkEl(link.text, link.href, "yg-apply");
    a.addEventListener("click", function () {
      track("quiz_link_click", { link_type: link.type });
    });
    linkWrap.appendChild(a);

    card.appendChild(heading);
    card.appendChild(p);
    card.appendChild(linkWrap);
    card.appendChild(restartActions());

    track("quiz_complete", {
      outcome: outcome,
      age_band: answers.age || null,
      area: answers.area || null,
      result_count: 0
    });
    heading.focus();
  }

  function restartActions() {
    var actions = el("div", { "class": "yg-actions" });
    var again = el("button", { type: "button", "class": "yg-btn yg-btn--secondary" }, "Start again");
    again.addEventListener("click", restart);
    actions.appendChild(again);
    return actions;
  }

  // ---- Data
  function loadProgrammes() {
    if (!window.fetch) return Promise.resolve(null);
    return fetch(DATA_URL, { cache: "no-cache" })
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (data) {
        if (!Array.isArray(data)) return null;
        // Drop any entry with missing or malformed fields so one bad edit
        // does not break the whole list
        return data.filter(function (p) {
          var ok = p && typeof p.name === "string" && p.name &&
            Array.isArray(p.areas) &&
            typeof p.age_min === "number" && typeof p.age_max === "number" &&
            typeof p.apply_url === "string" && p.apply_url;
          if (!ok && window.console) console.warn("[yg-quiz] Skipped invalid programme entry", p);
          return ok;
        });
      })
      .catch(function () { return null; });
  }

  function matchProgrammes(all, area, band) {
    return all
      .filter(function (p) {
        return p.areas.indexOf(area) !== -1 &&
          band.min >= p.age_min &&
          band.max <= p.age_max;
      })
      // Projects for one area first, then those covering several areas
      .sort(function (a, b) {
        return a.areas.length - b.areas.length;
      });
  }

  // ---- Analytics and embedding
  function isEmbedded() {
    try { return window.self !== window.top; } catch (_) { return true; }
  }

  function postToHost(msg) {
    if (!embedded) return;
    HOST_ORIGINS.forEach(function (origin) {
      try { window.parent.postMessage(msg, origin); } catch (_) {}
    });
  }

  function track(name, params) {
    var payload = Object.assign({ quiz_id: quizId }, params);
    if (embedded) {
      postToHost({ source: "yg-quiz", type: "event", name: name, params: payload });
    } else {
      try {
        if (typeof window.gtag === "function") window.gtag("event", name, payload);
      } catch (_) {}
    }
  }

  function watchHeight() {
    if (!embedded) return;
    var last = 0;
    function send() {
      var h = Math.ceil(document.body.getBoundingClientRect().height);
      if (h && h !== last) {
        last = h;
        postToHost({ source: "yg-quiz", type: "height", value: h });
      }
    }
    if (window.ResizeObserver) {
      new ResizeObserver(send).observe(document.body);
    } else {
      window.addEventListener("resize", send);
      setInterval(send, 1000);
    }
    send();
  }

  // ---- Helpers
  function el(tag, attrs, text) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      node.setAttribute(k, attrs[k]);
    });
    if (text) node.appendChild(document.createTextNode(text));
    return node;
  }

  function linkEl(text, href, cls) {
    var a = el("a", { href: href, "class": cls });
    var isMail = href.indexOf("mailto:") === 0;
    var isSkillsConnect = /^https:\/\/(www\.)?skillsconnect\.org\.uk\//.test(href);
    a.appendChild(document.createTextNode(text));
    if (isSkillsConnect) {
      a.setAttribute("target", "_top"); // leave the iframe, stay in the same tab
    } else if (!isMail) {
      a.setAttribute("target", "_blank");
      a.setAttribute("rel", "noopener noreferrer");
      a.appendChild(el("span", { "class": "visually-hidden" }, " (opens in new tab)"));
    }
    return a;
  }

  function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }
})();
