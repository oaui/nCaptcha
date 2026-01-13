export async function analyzeInteraction(interactionData) {
  const clicks = interactionData.clicks;
  const mouseMovements = interactionData.mouseMovements;

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
  return { isSuspicious: false, reason: "" };
}
