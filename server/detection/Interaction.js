/**
 * Interaction analysis module
 * ALL LOGIC PRESERVED - NO CHANGES
 */
export async function analyzeInteraction(interactionData) {
  const clicks = interactionData.clicks;
  const mouseMovements = interactionData.mouseMovements;
  const pointerClickDurations = interactionData.pointerClickDurations;
  const pointerEvents = interactionData.pointerEvents;

  if (clicks && mouseMovements) {
    clicks.forEach((click) => {
      if (!click.isTrusted) {
        return { isSuspicious: true, reason: "ClickEvent untrusted" };
      }
    });
    mouseMovements.forEach((mm) => {
      if (!mm.isTrusted) {
        return { isSuspicious: true, reason: "MouseEvent untrusted" };
      }
    });
  }
  const movementCurve = await inspectMouseMovment(pointerEvents);
  if (movementCurve.botMovement) {
    return { isSuspicious: true, reason: movementCurve.reason };
  }
  const clickInspection = await inspectPointerClicks(pointerClickDurations);
  if (clickInspection.botMovement) {
    return { isSuspicious: true, reason: clickInspection.reason };
  }
  return { isSuspicious: false, reason: "" };
}

async function inspectPointerClicks(pointerClicks) {
  if (!pointerClicks || pointerClicks.length < 1) {
    return { botMovement: false, reason: "No mouse clicks recorded" };
  }

  for (const click of pointerClicks) {
    if (!click.isTrusted) {
      return {
        botMovement: true,
        reason: "Untrusted Mouseclick event",
      };
    }

    if (click.clickDuration <= 1 && click.type === "up") {
      console.log(click);
      return {
        botMovement: true,
        reason: "Absurdly fast mouse click",
      };
    }
  }

  return { botMovement: false, reason: "" };
}

async function inspectMouseMovment(pointerEvents) {
  const CHUNK_SIZE = 20;
  const avgYs = [];

  for (let i = 0; i + CHUNK_SIZE <= pointerEvents.length; i += CHUNK_SIZE) {
    let sumY = 0;

    for (let j = 0; j < CHUNK_SIZE; j++) {
      sumY += pointerEvents[i + j].y;
    }

    avgYs.push(sumY / CHUNK_SIZE);
  }

  if (avgYs.length < 2) {
    return {
      botMovement: false,
      reason: "Not enough data",
    };
  }

  let flatChunkCount = 0;
  let tinyChunkCount = 0;

  for (let i = 1; i < avgYs.length; i++) {
    const dy = Math.abs(avgYs[i] - avgYs[i - 1]);

    if (dy === 0) flatChunkCount++;
    if (dy < 0.25) tinyChunkCount++;
  }

  const comparisons = avgYs.length - 1;
  const flatRatio = flatChunkCount / comparisons;
  const tinyRatio = tinyChunkCount / comparisons;

  if (flatRatio > 0.4 || tinyRatio > 0.6) {
    return {
      botMovement: true,
      reason: "Averaged pointer Y movement is unnaturally linear",
    };
  }

  return {
    botMovement: false,
    reason: "",
  };
}
