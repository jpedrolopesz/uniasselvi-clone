// jsdom não implementa Element.scrollTo — usado pelo auto-scroll do AssistantPanel.
if (typeof Element !== "undefined" && !Element.prototype.scrollTo) {
  Element.prototype.scrollTo = () => {};
}
