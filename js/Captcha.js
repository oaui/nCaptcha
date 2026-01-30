import { randnum } from "./util/Util.js";
import { startValidation } from "./main/Validation.js";
import { setCookie } from "./util/Cookie.js";

await start();

export async function start() {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const shadow = host.attachShadow({ mode: "closed" });

  const isMobile =
    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
    window.innerWidth < 768;
  console.log(window);
  const totalWidth = isMobile
    ? Math.min(randnum(280, 340), window.innerWidth - 40)
    : randnum(250, 380);
  const sliderWidth = isMobile ? 60 : 50;
  const sliderHeight = isMobile ? 60 : 50;
  const containerHeight = isMobile ? 60 : 50;
  const completionThreshold = totalWidth - sliderWidth;

  shadow.innerHTML = `
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-tap-highlight-color: transparent;
      -webkit-touch-callout: none;
      -webkit-user-select: none;
      user-select: none;
    }

    .slider-container {
      position: relative;
      width: ${totalWidth}px;
      height: ${containerHeight}px;
      background: linear-gradient(135deg, #2c2c3e 0%, #1a1a2e 100%);
      border-radius: ${containerHeight / 2}px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3), inset 0 1px 3px rgba(255, 255, 255, 0.05);
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      touch-action: none;
      margin: 0 auto;
    }

    .progress {
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      background: linear-gradient(90deg, #6a5acd 0%, #7b68ee 100%);
      border-radius: ${containerHeight / 2}px;
      width: 0;
      transition: width 0.15s cubic-bezier(0.4, 0, 0.2, 1);
      opacity: 0.3;
      pointer-events: none;
    }

    .slider {
      position: absolute;
      top: ${(containerHeight - sliderHeight) / 2}px;
      left: 0;
      width: ${sliderWidth}px;
      height: ${sliderHeight}px;
      background: linear-gradient(135deg, #7b68ee 0%, #6a5acd 100%);
      border-radius: 50%;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: grab;
      transition: transform 0.15s cubic-bezier(0.4, 0, 0.2, 1);
      font-weight: 600;
      font-size: ${isMobile ? "22px" : "18px"};
      box-shadow: 0 2px 8px rgba(106, 90, 205, 0.4);
      z-index: 2;
      touch-action: none;
    }

    .slider.locked {
      background: linear-gradient(135deg, #5a5a6e 0%, #4a4a5e 100%);
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(90, 90, 110, 0.4);
    }

    .slider.locked:hover {
      transform: scale(1.05);
      box-shadow: 0 4px 12px rgba(90, 90, 110, 0.6);
    }

    .slider.unlocked {
      background: linear-gradient(135deg, #7b68ee 0%, #6a5acd 100%);
      cursor: grab;
      animation: unlock-pulse 0.4s ease-out;
    }

    @keyframes unlock-pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.15); }
      100% { transform: scale(1); }
    }

    .slider:active { 
      cursor: grabbing;
      transform: scale(${isMobile ? "1.05" : "1.1"});
      box-shadow: 0 2px 8px rgba(106, 90, 205, 0.5);
    }

    @media (hover: hover) and (pointer: fine) {
      .slider:hover {
        transform: scale(1.05);
        box-shadow: 0 4px 12px rgba(106, 90, 205, 0.6);
      }
    }

    .slider-text {
      position: absolute;
      left: ${sliderWidth + (isMobile ? 20 : 15)}px;
      top: 0;
      right: 15px;
      line-height: ${containerHeight}px;
      color: rgba(255, 255, 255, 0.8);
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: ${isMobile ? "15px" : "14px"};
      font-weight: 500;
      letter-spacing: 0.3px;
      text-align: left;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      pointer-events: none;
      z-index: 1;
    }

    .lock-icon {
      font-size: ${isMobile ? "24px" : "20px"};
    }

    .spinner {
      width: ${isMobile ? "26px" : "22px"};
      height: ${isMobile ? "26px" : "22px"};
      border: 3px solid rgba(255, 255, 255, 0.15);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.6; }
    }

    .slider.verifying {
      animation: pulse 1.5s ease-in-out infinite;
      cursor: default;
    }

    .slider.success {
      background: linear-gradient(135deg, #4caf50 0%, #66bb6a 100%);
      box-shadow: 0 2px 8px rgba(76, 175, 80, 0.4);
      cursor: default;
    }

    .progress.success {
      background: linear-gradient(90deg, #4caf50 0%, #66bb6a 100%);
      opacity: 0.5;
    }

    .slider.error {
      background: linear-gradient(135deg, #e53935 0%, #ef5350 100%);
      box-shadow: 0 2px 8px rgba(229, 57, 53, 0.4);
      cursor: default;
    }

    .progress.error {
      background: linear-gradient(90deg, #e53935 0%, #ef5350 100%);
      opacity: 0.5;
    }

    .slider.warning {
      background: linear-gradient(135deg, #fdd835 0%, #ffee58 100%);
      box-shadow: 0 2px 8px rgba(253, 216, 53, 0.4);
      cursor: default;
    }

    .progress.warning {
      background: linear-gradient(90deg, #fdd835 0%, #ffee58 100%);
      opacity: 0.5;
    }

    .slider.rechallenge {
      background: linear-gradient(135deg, #fb8c00 0%, #ffa726 100%);
      box-shadow: 0 2px 8px rgba(251, 140, 0, 0.4);
      cursor: default;
    }

    .progress.rechallenge {
      background: linear-gradient(90deg, #fb8c00 0%, #ffa726 100%);
      opacity: 0.5;
    }

    .checkmark {
      font-size: ${isMobile ? "26px" : "22px"};
      animation: checkmark-pop 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    }

    @keyframes checkmark-pop {
      0% { transform: scale(0); }
      50% { transform: scale(1.2); }
      100% { transform: scale(1); }
    }

    .error-icon {
      font-size: ${isMobile ? "26px" : "22px"};
      animation: shake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97);
    }

    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-4px); }
      75% { transform: translateX(4px); }
    }

    /* Prevent iOS bounce/zoom */
    @supports (-webkit-touch-callout: none) {
      .slider-container {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
      }
    }
  </style>

  <div class="slider-container">
    <div class="progress" id="progress"></div>
    <div class="slider locked" id="slider">
      <span class="lock-icon">🔒</span>
    </div>
    <div class="slider-text">${
      isMobile ? "Tap to unlock" : "Click to unlock"
    }</div>
  </div>
`;

  const slider = shadow.getElementById("slider");
  const progress = shadow.getElementById("progress");
  const text = shadow.querySelector(".slider-text");

  let active = false;
  let startX = 0;
  let pointerClickDuration = 0;
  let currentX = 0;
  let completed = false;
  let unlocked = false;

  const interactionData = {
    mouseMovements: [],
    pointerEvents: [],
    pointerClickDurations: [],
    clicks: [],
  };

  const mouseMoveHandler = (e) => {
    if (!active) return;
    interactionData.mouseMovements.push({
      x: e.clientX,
      y: e.clientY,
      t: Date.now(),
      isTrusted: e.isTrusted,
    });
  };

  const pointerMoveHandler = (e) => {
    if (!active) return;
    interactionData.pointerEvents.push({
      x: e.clientX,
      y: e.clientY,
      t: Date.now(),
      pressure: e.pressure,
      pointerType: e.pointerType,
      isTrusted: e.isTrusted,
    });
  };

  const clickHandler = (e) => {
    if (!active) return;
    interactionData.clicks.push({
      x: e.clientX,
      y: e.clientY,
      t: Date.now(),
      isTrusted: e.isTrusted,
    });
  };

  // Click handler to unlock the slider
  slider.addEventListener("click", (clickEvent) => {
    if (!unlocked && !completed) {
      clickEvent.preventDefault();
      clickEvent.stopPropagation();
      
      unlocked = true;
      slider.classList.remove("locked");
      slider.classList.add("unlocked");
      slider.innerHTML = "▶";
      text.textContent = isMobile ? "Swipe to verify" : "Slide to verify";
      
      if (isMobile && "vibrate" in navigator) {
        navigator.vibrate(30);
      }
    }
  });

  slider.addEventListener("pointerdown", async (downEvent) => {
    if (completed || !unlocked) return;

    pointerClickDuration = performance.now();

    downEvent.preventDefault();

    active = true;
    startX = downEvent.clientX;
    currentX = parseInt(slider.style.left || "0", 10);

    interactionData.pointerClickDurations.push({
      type: "down",
      clickDuration: pointerClickDuration,
      pointerType: downEvent.pointerType,
      isTrusted: downEvent.isTrusted,
    });

    slider.setPointerCapture(downEvent.pointerId);

    slider.style.transition = "none";

    document.addEventListener("mousemove", mouseMoveHandler);
    document.addEventListener("pointermove", pointerMoveHandler);
    document.addEventListener("click", clickHandler);
  });

  document.addEventListener("pointermove", async (dragEvent) => {
    if (!active || !unlocked) return;

    dragEvent.preventDefault();

    const deltaX = dragEvent.clientX - startX;
    const newPosition = Math.max(
      0,
      Math.min(completionThreshold, currentX + deltaX),
    );

    slider.style.left = `${newPosition}px`;
    progress.style.width = `${newPosition + sliderWidth}px`;

    if (isMobile && newPosition >= completionThreshold - 10) {
      slider.style.transform = "scale(1.1)";
    }
  });

  document.addEventListener("pointerup", async (releaseEvent) => {
    if (!active) return;

    const duration = performance.now() - pointerClickDuration;

    interactionData.pointerClickDurations.push({
      type: "up",
      clickDuration: duration,
      pointerType: releaseEvent.pointerType,
      isTrusted: releaseEvent.isTrusted,
    });
    pointerClickDuration = 0;

    releaseEvent.preventDefault();
    active = false;

    document.removeEventListener("mousemove", mouseMoveHandler);
    document.removeEventListener("pointermove", pointerMoveHandler);
    document.removeEventListener("click", clickHandler);

    slider.style.transition = "";
    slider.style.transform = "";

    const left = parseInt(slider.style.left || "0", 10);

    if (left >= completionThreshold - 10) {
      completed = true;
      if (isMobile && "vibrate" in navigator) {
        navigator.vibrate(50);
      }

      showVerifyingState(slider, text);

      const validationResult = await startValidation(interactionData);

      // Move slider
      slider.style.left = `${completionThreshold}px`;
      progress.style.width = `${totalWidth}px`;

      if (validationResult.validationSuccess) {
        showSuccessState(slider, text, progress, isMobile);
        setCookie("npow_clearance", 5, validationResult.cookieHash);
        window.parent.postMessage(
          {
            type: "ncaptcha-solved",
            token: validationResult.cookieHash,
          },
          "*",
        );
      } else {
        showFailureState(slider, text, progress, isMobile);
      }
    } else {
      slider.style.transition = "left 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
      progress.style.transition = "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)";

      slider.style.left = "0px";
      progress.style.width = "0px";

      setTimeout(() => {
        slider.style.transition = "";
        progress.style.transition = "";
      }, 300);
    }
  });

  slider.addEventListener(
    "touchstart",
    (e) => {
      if (!completed) {
        e.stopPropagation();
      }
    },
    { passive: false },
  );

  slider.addEventListener(
    "touchmove",
    (e) => {
      if (active) {
        e.stopPropagation();
      }
    },
    { passive: false },
  );
}

function showVerifyingState(slider, text) {
  slider.innerHTML = "";
  slider.classList.add("verifying");
  slider.style.cursor = "default";
  text.textContent = "Verifying...";

  const spinner = document.createElement("div");
  spinner.classList.add("spinner");
  slider.appendChild(spinner);
}

function showSuccessState(slider, text, progress, isMobile) {
  slider.innerHTML = "";
  slider.classList.remove("verifying");
  slider.classList.add("success");
  progress.classList.add("success");
  slider.style.cursor = "default";
  slider.innerHTML = '<span class="checkmark">✓</span>';
  text.textContent = isMobile ? "Verified!" : "Verified successfully";

  if (isMobile && "vibrate" in navigator) {
    navigator.vibrate([50, 50, 50]);
  }
}

function showFailureState(slider, text, progress, isMobile) {
  slider.innerHTML = "";
  slider.classList.remove("verifying");
  slider.classList.add("error");
  progress.classList.add("error");
  slider.style.cursor = "default";
  slider.innerHTML = '<span class="error-icon">✕</span>';
  text.textContent = isMobile ? "Failed" : "Verification failed";

  if (isMobile && "vibrate" in navigator) {
    navigator.vibrate([100, 50, 100]);
  }
}