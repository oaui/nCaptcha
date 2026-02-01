export class Result {
  constructor() {
    this.isPlaywright = null;
    this.isPuppeteer = null;
    this.isSelenium = null;
    this.requestData = null;
    this.interactionData = null;
    this.isAutomated = null;

    this.misconducts = [];
    this.data = {
      requestData: () => this.requestData,
      interactionData: () => this.interactionData,
    };
    this.automation = {
      isPlaywright: () => this.isPlaywright,
      isPuppeteer: () => this.isPuppeteer,
      isSelenium: () => this.isSelenium,
      isAutomated: () => this.isAutomated,
    };
  }

  setIsPlaywright(value) {
    this.isPlaywright = value;
  }

  setIsPuppeteer(value) {
    this.isPuppeteer = value;
  }

  setIsSelenium(value) {
    this.isSelenium = value;
  }

  setIsAutomated(value) {
    this.isAutomated = value;
  }

  setClientData(data) {
    this.clientData = data;
  }
}
