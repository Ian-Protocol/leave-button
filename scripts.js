document.addEventListener("DOMContentLoaded", () => {
  const wrapper = document.querySelector(".glass-button-wrapper");
  const button = document.getElementById("leaveButton");
  const shards = Array.from(document.querySelectorAll(".shard"));
  const status = document.getElementById("status");

  if (!wrapper || !button || !status || shards.length === 0) {
    return;
  }

  const buttonLabel = button.querySelector(".button-label");

  let puzzleActive = false;
  let trapArmed = true;
  let callEnded = false;
  const snapThreshold = 24;

  shards.forEach((shard) => {
    shard.style.transform = "translate(0px, 0px)";
    initializeDragging(shard);
  });

  button.addEventListener("click", (event) => {
    if (puzzleActive) {
      event.preventDefault();
      return;
    }

    if (trapArmed) {
      event.preventDefault();
      triggerShatter();
      return;
    }

    if (!callEnded) {
      endCall();
    }
  });

  function triggerShatter() {
    status.textContent = "Whoa! The leave button shattered—put the glass back.";
    wrapper.classList.add("shattered");
    button.disabled = true;

    shards.forEach((shard) => {
      shard.classList.remove("placed");
      shard.style.transition =
        "transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)";
      const scatter = getScatterTransform();
      applyTransform(shard, scatter);
    });

    setTimeout(() => {
      puzzleActive = true;
      wrapper.classList.add("puzzle-mode");
      status.textContent = "Drag each shard until it snaps back in.";
    }, 400);
  }

  function endCall() {
    callEnded = true;
    wrapper.classList.add("call-ended");
    button.disabled = true;
    if (buttonLabel) {
      buttonLabel.textContent = "Call ended";
    } else {
      button.textContent = "Call ended";
    }
    status.textContent = "You finally left the call.";
  }

  function getScatterTransform() {
    const angle = Math.random() * Math.PI * 2;
    const distance = 90 + Math.random() * 110;
    const rotation = (Math.random() - 0.5) * 110;
    return {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
      rotation,
    };
  }

  function applyTransform(el, { x, y, rotation = 0 }) {
    el.style.transform = `translate(${x}px, ${y}px) rotate(${rotation}deg)`;
  }

  function initializeDragging(el) {
    let isDragging = false;
    let pointerId = null;
    let originX = 0;
    let originY = 0;
    let startX = 0;
    let startY = 0;

    el.addEventListener("pointerdown", (event) => {
      if (!puzzleActive || el.classList.contains("placed")) return;

      isDragging = true;
      pointerId = event.pointerId;
      originX = event.clientX;
      originY = event.clientY;
      const start = getTranslation(el);
      startX = start.x;
      startY = start.y;

      el.classList.add("dragging");
      el.style.transition = "none";
      el.setPointerCapture(pointerId);
    });

    el.addEventListener("pointermove", (event) => {
      if (!isDragging || event.pointerId !== pointerId) return;

      const dx = event.clientX - originX;
      const dy = event.clientY - originY;
      const nextX = startX + dx;
      const nextY = startY + dy;

      el.style.transform = `translate(${nextX}px, ${nextY}px)`;
    });

    const release = (event) => {
      if (!isDragging || event.pointerId !== pointerId) return;
      isDragging = false;
      el.classList.remove("dragging");
      el.style.transition = "transform 0.25s ease";
      el.releasePointerCapture(pointerId);
      pointerId = null;

      const { x, y } = getTranslation(el);
      const distanceFromHome = Math.hypot(x, y);

      if (distanceFromHome <= snapThreshold) {
        el.classList.add("placed");
        el.style.transform = "translate(0px, 0px)";
        checkPuzzleComplete();
      }
    };

    el.addEventListener("pointerup", release);
    el.addEventListener("pointercancel", release);
  }

  function getTranslation(el) {
    const transformValue = window.getComputedStyle(el).transform;
    if (!transformValue || transformValue === "none") {
      return { x: 0, y: 0 };
    }

    const matrix = new DOMMatrixReadOnly(transformValue);
    return { x: matrix.m41, y: matrix.m42 };
  }

  function checkPuzzleComplete() {
    const solved = shards.every((shard) => shard.classList.contains("placed"));
    if (!solved) return;

    puzzleActive = false;
    wrapper.classList.remove("puzzle-mode");

    setTimeout(() => {
      wrapper.classList.remove("shattered");
      button.disabled = false;
      trapArmed = false;
      status.textContent = "Nice work. Click it again to actually leave.";
      button.focus({ preventScroll: true });
    }, 250);
  }
});
