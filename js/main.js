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

  (function initArtGallery() {
    var viewport = document.getElementById("art-gallery-slides");
    var dotsRoot = document.getElementById("art-gallery-dots");
    var statusEl = document.getElementById("art-gallery-status");
    var prevBtn = document.querySelector(".art-gallery__btn--prev");
    var nextBtn = document.querySelector(".art-gallery__btn--next");
    var gallerySection = document.getElementById("art-gallery");
    if (!viewport || !dotsRoot || !prevBtn || !nextBtn) return;

    var slides = viewport.querySelectorAll(".art-gallery__slide");
    if (!slides.length) return;

    var reduceMotionMq = window.matchMedia("(prefers-reduced-motion: reduce)");
    var AUTO_MS = 5500;
    var RESUME_MS = 10000;
    var autoInterval = null;
    var resumeTimeout = null;
    var hoverPaused = false;

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

    function clearAutoTimers() {
      if (autoInterval !== null) {
        clearInterval(autoInterval);
        autoInterval = null;
      }
      if (resumeTimeout !== null) {
        clearTimeout(resumeTimeout);
        resumeTimeout = null;
      }
    }

    function startAutoAdvance() {
      clearAutoTimers();
      if (reduceMotionMq.matches || slides.length <= 1 || hoverPaused) return;
      autoInterval = window.setInterval(function () {
        var idx = currentIndex();
        var nextIdx = idx >= slides.length - 1 ? 0 : idx + 1;
        goTo(nextIdx);
      }, AUTO_MS);
    }

    function pauseAutoAdvance() {
      if (autoInterval !== null) {
        clearInterval(autoInterval);
        autoInterval = null;
      }
    }

    function scheduleResumeAuto() {
      if (resumeTimeout !== null) clearTimeout(resumeTimeout);
      resumeTimeout = window.setTimeout(function () {
        resumeTimeout = null;
        if (!hoverPaused && !document.hidden) startAutoAdvance();
      }, RESUME_MS);
    }

    function onUserGalleryInteraction() {
      pauseAutoAdvance();
      scheduleResumeAuto();
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
            onUserGalleryInteraction();
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
      onUserGalleryInteraction();
      goTo(currentIndex() - 1);
    });
    nextBtn.addEventListener("click", function () {
      onUserGalleryInteraction();
      goTo(currentIndex() + 1);
    });

    viewport.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        onUserGalleryInteraction();
        goTo(currentIndex() - 1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        onUserGalleryInteraction();
        goTo(currentIndex() + 1);
      }
    });

    viewport.addEventListener(
      "pointerdown",
      function () {
        onUserGalleryInteraction();
      },
      { passive: true }
    );

    if (gallerySection) {
      gallerySection.addEventListener("mouseenter", function () {
        hoverPaused = true;
        pauseAutoAdvance();
      });
      gallerySection.addEventListener("mouseleave", function () {
        hoverPaused = false;
        clearTimeout(resumeTimeout);
        resumeTimeout = null;
        startAutoAdvance();
      });
      gallerySection.addEventListener("focusin", function () {
        onUserGalleryInteraction();
      });
    }

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        pauseAutoAdvance();
      } else if (!hoverPaused) {
        startAutoAdvance();
      }
    });

    reduceMotionMq.addEventListener("change", function () {
      clearAutoTimers();
      if (!reduceMotionMq.matches && !hoverPaused) {
        startAutoAdvance();
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
    startAutoAdvance();
  })();

  (function initProjectMediaGalleries() {
    var roots = document.querySelectorAll("[data-project-gallery]");
    var reduceMotionMq = window.matchMedia("(prefers-reduced-motion: reduce)");

    function smoothScroll() {
      return reduceMotionMq.matches ? "auto" : "smooth";
    }

    roots.forEach(function (root) {
      var viewport = root.querySelector(".project-media-gallery__viewport");
      if (!viewport) return;
      var slides = viewport.querySelectorAll(".project-media-gallery__slide");
      var dots = root.querySelectorAll(".project-media-gallery__dot");
      var prevBtn = root.querySelector(".project-media-gallery__btn--prev");
      var nextBtn = root.querySelector(".project-media-gallery__btn--next");
      if (!slides.length) return;

      function stepWidth() {
        return viewport.clientWidth;
      }

      function currentIndex() {
        var w = stepWidth();
        if (w <= 0) return 0;
        var i = Math.round(viewport.scrollLeft / w);
        if (i < 0) i = 0;
        if (i > slides.length - 1) i = slides.length - 1;
        return i;
      }

      function goTo(index) {
        var w = stepWidth();
        var i = index;
        if (i < 0) i = 0;
        if (i > slides.length - 1) i = slides.length - 1;
        viewport.scrollTo({ left: i * w, behavior: smoothScroll() });
      }

      function updateChrome() {
        var c = currentIndex();
        dots.forEach(function (dot, j) {
          if (j === c) {
            dot.classList.add("is-active");
            dot.setAttribute("aria-current", "true");
          } else {
            dot.classList.remove("is-active");
            dot.removeAttribute("aria-current");
          }
        });
        if (prevBtn) {
          prevBtn.disabled = c <= 0;
        }
        if (nextBtn) {
          nextBtn.disabled = c >= slides.length - 1;
        }
      }

      dots.forEach(function (dot, i) {
        dot.addEventListener("click", function () {
          goTo(i);
        });
      });

      if (prevBtn) {
        prevBtn.addEventListener("click", function () {
          goTo(currentIndex() - 1);
        });
      }
      if (nextBtn) {
        nextBtn.addEventListener("click", function () {
          goTo(currentIndex() + 1);
        });
      }

      var scrollRafProj = 0;
      viewport.addEventListener(
        "scroll",
        function () {
          if (scrollRafProj) return;
          scrollRafProj = requestAnimationFrame(function () {
            scrollRafProj = 0;
            updateChrome();
          });
        },
        { passive: true }
      );

      viewport.addEventListener("keydown", function (e) {
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          goTo(currentIndex() - 1);
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          goTo(currentIndex() + 1);
        }
      });

      window.addEventListener("resize", function () {
        requestAnimationFrame(function () {
          var w = stepWidth();
          var i = currentIndex();
          viewport.scrollTo({ left: i * w, behavior: "auto" });
          updateChrome();
        });
      });

      updateChrome();
    });
  })();

  (function initUnavailablePosterModal() {
    var modal = document.getElementById("poster-unavailable-modal");
    if (!modal) return;
    var openers = document.querySelectorAll("[data-open-poster-unavailable]");
    var closers = modal.querySelectorAll("[data-modal-close]");
    var okBtn = modal.querySelector(".modal__ok");
    var lastFocus = null;

    function openModal() {
      lastFocus = document.activeElement;
      modal.removeAttribute("hidden");
      if (okBtn) okBtn.focus();
      document.body.style.overflow = "hidden";
    }

    function closeModal() {
      modal.setAttribute("hidden", "");
      document.body.style.overflow = "";
      if (lastFocus && typeof lastFocus.focus === "function") {
        lastFocus.focus();
      }
      lastFocus = null;
    }

    openers.forEach(function (btn) {
      btn.addEventListener("click", openModal);
    });
    closers.forEach(function (el) {
      el.addEventListener("click", closeModal);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !modal.hasAttribute("hidden")) {
        closeModal();
      }
    });
  })();
})();
