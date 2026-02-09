export class Config {
  constructor() {
    this.data = {
      requestData: () => this.requestData,
      interactionData: () => this.interactionData,
    };
    this.settings = {
      mode: () => this.mode,
    };
  }

  setMode(mode) {
    this.mode = mode;
  }
  setClientData(data) {
    this.data = data;
  }
}
