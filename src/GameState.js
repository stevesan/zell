class GameState {
  constructor() {
    this.numSugars = 0;
    this.listeners = new Set();
  }

  addListener(listener) {
    this.listeners.add(listener);
  }

  onChange() {
    for (const l of this.listeners) {
      l();
    }
  }
}

// Not great this is just global..
const currState = new GameState();
