(function () {
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  const toggle = document.querySelector(".nav__toggle");
  const menu = document.getElementById("nav-menu");
  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      const open = menu.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });

    menu.querySelectorAll('a[href^="#"]').forEach(function (link) {
      link.addEventListener("click", function () {
        menu.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Open menu");
      });
    });
  }

  const iframe = document.querySelector(".embed__iframe[data-src]");
  if (iframe && iframe.dataset.src && !iframe.dataset.src.includes("VIDEO_ID")) {
    iframe.src = iframe.dataset.src;
    iframe.removeAttribute("data-placeholder");
  }

  (function initArtGallery() {
    var viewport = document.getElementById("art-gallery-slides");
    var dotsRoot = document.getElementById("art-gallery-dots");
    var statusEl = document.getElementById("art-gallery-status");
    var prevBtn = document.querySelector(".art-gallery__btn--prev");
    var nextBtn = document.querySelector(".art-gallery__btn--next");
    if (!viewport || !dotsRoot || !prevBtn || !nextBtn) return;

    var slides = viewport.querySelectorAll(".art-gallery__slide");
    if (!slides.length) return;

    var reduceMotionMq = window.matchMedia("(prefers-reduced-motion: reduce)");

    function smoothBehavior() {
      return reduceMotionMq.matches ? "auto" : "smooth";
    }

    function stepWidth() {
      return viewport.clientWidth;
    }

    function currentIndex() {
      var w = stepWidth();
      if (w <= 0) return 0;
      var idx = Math.round(viewport.scrollLeft / w);
      if (idx < 0) idx = 0;
      if (idx > slides.length - 1) idx = slides.length - 1;
      return idx;
    }

    function goTo(index, behavior) {
      var w = stepWidth();
      var i = index;
      if (i < 0) i = 0;
      if (i > slides.length - 1) i = slides.length - 1;
      viewport.scrollTo({ left: i * w, behavior: behavior || smoothBehavior() });
    }

    function buildDots() {
      dotsRoot.innerHTML = "";
      for (var i = 0; i < slides.length; i++) {
        (function (idx) {
          var btn = document.createElement("button");
          btn.type = "button";
          btn.className = "art-gallery__dot";
          btn.setAttribute("aria-label", "Go to photo " + (idx + 1));
          btn.addEventListener("click", function () {
            goTo(idx);
          });
          dotsRoot.appendChild(btn);
        })(i);
      }
    }

    function updateChrome() {
      var idx = currentIndex();
      prevBtn.disabled = idx <= 0;
      nextBtn.disabled = idx >= slides.length - 1;

      var dots = dotsRoot.querySelectorAll(".art-gallery__dot");
      for (var d = 0; d < dots.length; d++) {
        if (d === idx) {
          dots[d].classList.add("is-active");
          dots[d].setAttribute("aria-current", "true");
        } else {
          dots[d].classList.remove("is-active");
          dots[d].removeAttribute("aria-current");
        }
      }

      if (statusEl) {
        statusEl.textContent = "Photo " + (idx + 1) + " of " + slides.length;
      }
    }

    var scrollRaf = 0;
    viewport.addEventListener(
      "scroll",
      function () {
        if (scrollRaf) return;
        scrollRaf = requestAnimationFrame(function () {
          scrollRaf = 0;
          updateChrome();
        });
      },
      { passive: true }
    );

    prevBtn.addEventListener("click", function () {
      goTo(currentIndex() - 1);
    });
    nextBtn.addEventListener("click", function () {
      goTo(currentIndex() + 1);
    });

    viewport.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goTo(currentIndex() - 1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goTo(currentIndex() + 1);
      }
    });

    var resizeTimer = 0;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        var idx = currentIndex();
        goTo(idx, "auto");
        updateChrome();
      }, 100);
    });

    buildDots();
    updateChrome();
  })();
})();
