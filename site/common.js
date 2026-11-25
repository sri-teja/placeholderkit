// Shared by every page of the site: theme, nav, mobile menu, GitHub star count, copy buttons, footer scene.
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var root = document.documentElement;
  var K = window.PlaceholderKit;

  /* theme */
  function currentTheme() { return root.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"); }
  function paintThemeIcon() {
    $("theme-icon").innerHTML = currentTheme() === "dark"
      ? '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/>'
      : '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>';
  }
  try { var saved = localStorage.getItem("pk-theme"); if (saved) root.dataset.theme = saved; } catch (e) {}
  $("theme").addEventListener("click", function () {
    root.dataset.theme = currentTheme() === "dark" ? "light" : "dark";
    try { localStorage.setItem("pk-theme", root.dataset.theme); } catch (e) {}
    paintThemeIcon();
  });
  paintThemeIcon();

  /* nav border on scroll */
  var nav = $("nav");
  addEventListener("scroll", function () { nav.classList.toggle("scrolled", scrollY > 8); }, { passive: true });

  /* mobile menu */
  var menu = $("menu"), menuBtn = $("menu-btn");
  function setMenu(open) {
    menu.hidden = !open;
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }
  menuBtn.addEventListener("click", function () { setMenu(menu.hidden); });
  menu.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
  addEventListener("keydown", function (e) { if (e.key === "Escape" && !menu.hidden) { setMenu(false); menuBtn.focus(); } });

  /* GitHub stars: one request per visit, cached for the session; the button works without it */
  (function () {
    var el = $("star-count");
    // Hidden until the repo has at least one star; the button still works without a count.
    var show = function (n) { if (typeof n === "number" && n > 0) { el.textContent = n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, "") + "k" : String(n); el.hidden = false; } };
    try { var c = sessionStorage.getItem("pk-stars"); if (c !== null) return show(+c); } catch (e) {}
    if (!window.fetch) return;
    fetch("https://api.github.com/repos/sri-teja/placeholderkit", { headers: { Accept: "application/vnd.github+json" } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { if (d) { show(d.stargazers_count); try { sessionStorage.setItem("pk-stars", d.stargazers_count); } catch (e) {} } })
      .catch(function () {});
  })();

  /* copy buttons ([data-copy]) with a small toast */
  var toastTimer;
  function toast(label, code) {
    $("toast-text").textContent = label; $("toast-code").textContent = code || "";
    $("toast").classList.add("show"); clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { $("toast").classList.remove("show"); }, 1800);
  }
  function copy(text, label) {
    var done = function () { toast(label, text.split("\n")[0]); };
    var fallback = function () {
      var t = document.createElement("textarea"); t.value = text; t.setAttribute("readonly", ""); t.style.position = "fixed"; t.style.opacity = "0";
      document.body.appendChild(t); t.select(); try { document.execCommand("copy"); done(); } catch (e) { toast("Press Ctrl+C to copy"); } t.remove();
    };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done, fallback); else fallback();
  }
  document.querySelectorAll("[data-copy]").forEach(function (b) { b.addEventListener("click", function () { copy(b.dataset.copy, "Copied install command"); }); });

  /* footer scene: a train whose windows show avatars; animates only while visible */
  function fillTrain(seed) {
    if (!K) return;
    document.querySelectorAll("#train .car").forEach(function (car, c) {
      var n = c === 2 ? 3 : 4, faces = [];
      for (var w = 0; w < n; w++) {
        var ws = seed + "/train/" + c + "/" + w, i = new Image();
        i.src = (c + w) % 3 === 1 ? K.animalUrl({ seed: ws, accessory: "none", shape: "square" }) : K.avatarUrl({ seed: ws, shape: "square" });
        i.alt = ""; i.decoding = "async"; faces.push(i);
      }
      car.replaceChildren.apply(car, faces);
    });
  }
  var footer = $("footer");
  if (footer) {
    var seed = "acme";
    try { seed = localStorage.getItem("pk-seed") || seed; } catch (e) {}
    fillTrain(seed);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) { footer.classList.toggle("playing", entries[0].isIntersecting); }).observe(footer);
    } else footer.classList.add("playing");
  }

  window.PKSite = { fillTrain: fillTrain, copy: copy, toast: toast };
})();
