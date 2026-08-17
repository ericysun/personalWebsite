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

  function createLoopingScrollGallery(viewport, slideSelector, reduceMotionMq) {
    var realSlides = Array.prototype.slice.call(
      viewport.querySelectorAll(slideSelector)
    );
    var count = realSlides.length;
    var mq = reduceMotionMq || window.matchMedia("(prefers-reduced-motion: reduce)");

    function smoothBehavior() {
      return mq.matches ? "auto" : "smooth";
    }

    function stepWidth() {
      return viewport.clientWidth;
    }

    if (count <= 1) {
      return {
        count: count,
        currentIndex: function () {
          return 0;
        },
        goTo: function () {
          viewport.scrollTo({ left: 0, behavior: "auto" });
        },
        goNext: function () {},
        goPrev: function () {},
        init: function () {
          viewport.scrollTo({ left: 0, behavior: "auto" });
        },
        onResize: function () {
          viewport.scrollTo({ left: 0, behavior: "auto" });
        },
      };
    }

    var firstClone = realSlides[0].cloneNode(true);
    var lastClone = realSlides[count - 1].cloneNode(true);
    firstClone.setAttribute("aria-hidden", "true");
    lastClone.setAttribute("aria-hidden", "true");
    firstClone.setAttribute("data-loop-clone", "first");
    lastClone.setAttribute("data-loop-clone", "last");
    viewport.insertBefore(lastClone, realSlides[0]);
    viewport.appendChild(firstClone);

    var total = count + 2;
    var settling = false;
    var settleTimer = 0;

    function domFromLogical(logical) {
      return logical + 1;
    }

    function logicalFromDom(dom) {
      if (dom <= 0) return count - 1;
      if (dom >= total - 1) return 0;
      return dom - 1;
    }

    function currentDomIndex() {
      var w = stepWidth();
      if (w <= 0) return 1;
      return Math.round(viewport.scrollLeft / w);
    }

    function instantJumpToDom(dom) {
      var w = stepWidth();
      settling = true;
      if (settleTimer) {
        clearTimeout(settleTimer);
        settleTimer = 0;
      }
      viewport.style.scrollSnapType = "none";
      viewport.style.scrollBehavior = "auto";
      viewport.scrollLeft = dom * w;
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          viewport.style.scrollSnapType = "";
          viewport.style.scrollBehavior = "";
          settling = false;
        });
      });
    }

    function scrollToDom(dom, behavior) {
      var w = stepWidth();
      var useInstant = (behavior || smoothBehavior()) === "auto";
      if (useInstant) {
        instantJumpToDom(dom);
        return;
      }
      viewport.scrollTo({ left: dom * w, behavior: "smooth" });
    }

    function settleIfNeeded() {
      if (settling) return;
      var dom = currentDomIndex();
      if (dom === 0) {
        instantJumpToDom(count);
      } else if (dom === total - 1) {
        instantJumpToDom(1);
      }
    }

    if ("onscrollend" in window) {
      viewport.addEventListener("scrollend", settleIfNeeded);
    } else {
      viewport.addEventListener(
        "scroll",
        function () {
          if (settling) return;
          if (settleTimer) clearTimeout(settleTimer);
          settleTimer = window.setTimeout(settleIfNeeded, 150);
        },
        { passive: true }
      );
    }

    return {
      count: count,
      currentIndex: function () {
        return logicalFromDom(currentDomIndex());
      },
      goTo: function (logical, behavior) {
        var i = ((logical % count) + count) % count;
        scrollToDom(domFromLogical(i), behavior);
      },
      goNext: function () {
        var dom = currentDomIndex();
        if (dom < total - 1) scrollToDom(dom + 1);
      },
      goPrev: function () {
        var dom = currentDomIndex();
        if (dom > 0) scrollToDom(dom - 1);
      },
      init: function () {
        scrollToDom(1, "auto");
      },
      onResize: function () {
        scrollToDom(domFromLogical(logicalFromDom(currentDomIndex())), "auto");
      },
    };
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
    var gallery = createLoopingScrollGallery(
      viewport,
      ".art-gallery__slide",
      reduceMotionMq
    );
    var AUTO_MS = 5500;
    var RESUME_MS = 10000;
    var autoInterval = null;
    var resumeTimeout = null;
    var hoverPaused = false;

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
      if (reduceMotionMq.matches || gallery.count <= 1 || hoverPaused) return;
      autoInterval = window.setInterval(function () {
        gallery.goNext();
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
      for (var i = 0; i < gallery.count; i++) {
        (function (idx) {
          var btn = document.createElement("button");
          btn.type = "button";
          btn.className = "art-gallery__dot";
          btn.setAttribute("aria-label", "Go to photo " + (idx + 1));
          btn.addEventListener("click", function () {
            onUserGalleryInteraction();
            gallery.goTo(idx);
          });
          dotsRoot.appendChild(btn);
        })(i);
      }
    }

    function updateChrome() {
      var idx = gallery.currentIndex();

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
        statusEl.textContent = "Photo " + (idx + 1) + " of " + gallery.count;
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
      gallery.goPrev();
    });
    nextBtn.addEventListener("click", function () {
      onUserGalleryInteraction();
      gallery.goNext();
    });

    viewport.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        onUserGalleryInteraction();
        gallery.goPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        onUserGalleryInteraction();
        gallery.goNext();
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
        gallery.onResize();
        updateChrome();
      }, 100);
    });

    buildDots();
    gallery.init();
    updateChrome();
    startAutoAdvance();
  })();

  (function initProjectMediaGalleries() {
    var roots = document.querySelectorAll("[data-project-gallery]");
    var reduceMotionMq = window.matchMedia("(prefers-reduced-motion: reduce)");

    roots.forEach(function (root) {
      var viewport = root.querySelector(".project-media-gallery__viewport");
      if (!viewport) return;
      var dots = root.querySelectorAll(".project-media-gallery__dot");
      var prevBtn = root.querySelector(".project-media-gallery__btn--prev");
      var nextBtn = root.querySelector(".project-media-gallery__btn--next");
      var gallery = createLoopingScrollGallery(
        viewport,
        ".project-media-gallery__slide",
        reduceMotionMq
      );
      if (!gallery.count) return;

      function updateChrome() {
        var c = gallery.currentIndex();
        dots.forEach(function (dot, j) {
          if (j === c) {
            dot.classList.add("is-active");
            dot.setAttribute("aria-current", "true");
          } else {
            dot.classList.remove("is-active");
            dot.removeAttribute("aria-current");
          }
        });
      }

      dots.forEach(function (dot, i) {
        dot.addEventListener("click", function () {
          gallery.goTo(i);
        });
      });

      if (prevBtn) {
        prevBtn.addEventListener("click", function () {
          gallery.goPrev();
        });
      }
      if (nextBtn) {
        nextBtn.addEventListener("click", function () {
          gallery.goNext();
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
          gallery.goPrev();
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          gallery.goNext();
        }
      });

      window.addEventListener("resize", function () {
        requestAnimationFrame(function () {
          gallery.onResize();
          updateChrome();
        });
      });

      gallery.init();
      updateChrome();
    });
  })();

  (function initHeroPortraitSize() {
    var textColumn = document.querySelector(".hero__text-column");
    var photo = document.querySelector(".hero__photo");
    var mq = window.matchMedia("(max-width: 680px)");
    if (!textColumn || !photo) return;

    function sync() {
      if (mq.matches) {
        photo.style.width = "";
        photo.style.height = "";
        return;
      }
      var size = textColumn.offsetHeight;
      photo.style.width = size + "px";
      photo.style.height = size + "px";
    }

    if (photo.complete) {
      sync();
    } else {
      photo.addEventListener("load", sync, { once: true });
    }

    window.addEventListener("resize", function () {
      requestAnimationFrame(sync);
    });

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(sync);
    }

    mq.addEventListener("change", sync);
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
