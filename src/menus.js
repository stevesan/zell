class BaseMenu extends Entity {
  constructor(scene, state, reportStateChange) {
    super(null);
    this.scene = scene;
    this.state = state;
    this.reportStateChange = reportStateChange;

    this.buttonEnts = new Map();
  }

  getTitle() { return 'Some Menu'; }

  getButtons() { return []; }

  onStateChanged() {
    const state = this.state;

    let cam = this.scene.cameras.main;
    const W = cam.displayWidth;
    const H = cam.displayHeight;
    let x = 0.05;
    let y = 0.2;
    const dy = 0.05;
    const textStyle = {
      font: "36px ProggySquare", fill: "#fff",
      stroke: "#000", strokeThickness: 0,
      shadow: { offsetX: 2, offsetY: 2, stroke: false, fill: true }
    };

    const scene = this.scene;
    if (!this.header) {
      this.header = new Entity(scene.add.text(x * W, y * H,
        this.getTitle(),
        textStyle));
      this.header.setParent(this);
    }

    for (let button of this.getButtons()) {
      y += dy;
      let buttonEnt = this.buttonEnts.get(button['id']);
      if (!buttonEnt) {
        const text = scene.add.text(x * W, y * H, '', textStyle);
        text.on('pointerdown', () => {
          throb(scene, buttonEnt.gameObject, 1.05);
          button['onClick']();
        });
        text.on('pointerover', () => {
          if (!button['enabled']()) return;
          buttonEnt.gameObject.setTint(0xaaaaff);
        });
        text.on('pointerout', () => {
          if (!button['enabled']()) return;
          buttonEnt.gameObject.clearTint();
        });
        buttonEnt = new Entity(text);
        buttonEnt.setParent(this);
        this.buttonEnts.set(button['id'], buttonEnt);
      }
      if (!button['enabled']()) {
        buttonEnt.gameObject.setTint(0x888888);
        buttonEnt.gameObject.disableInteractive();
      }
      else {
        buttonEnt.gameObject.setInteractive();
      }
      buttonEnt.gameObject.setText(`> ${button['label']()}`);
    }
  }
}

class GolgiMenu extends BaseMenu {
  constructor(scene, state, reportStateChange) {
    super(scene, state, reportStateChange);
  }

  getTitle() { return 'Golgi Apparatus'; }

  getButtons() { return []; }
}

class MitoMenu extends BaseMenu {
  constructor(scene, state, reportStateChange) {
    super(scene, state, reportStateChange);
  }

  getTitle() { return 'Mitochondria'; }

  getButtons() {
    return [];
  }
}

class NucleusMenu extends BaseMenu {
  constructor(scene, state, reportStateChange) {
    super(scene, state, reportStateChange);
  }

  getTitle() { return 'Nucleus'; }

  getButtons() {
    return [
      {
        id: 'addER',
        label: () => 'Add Endoplasmic Reticulum (ER)',
        enabled: () => !this.state.endoRetShowing,
        onClick: () => {
          this.state.endoRetShowing = true;
          this.reportStateChange();
        }
      }
    ];
  }
}

const MAX_RIBOSOMES = 5;

class EndoRetMenu extends BaseMenu {
  constructor(scene, state, reportStateChange) {
    super(scene, state, reportStateChange);
  }

  getTitle() { return 'Endoplasmic Reticulum (ER)'; }

  getButtons() {
    console.assert((this.state.numRibosomes ?? 0) <= MAX_RIBOSOMES);

    const btns = [
      {
        id: 'addRibos',
        label: () => `Add Ribosome (${this.state.numRibosomes ?? 0}/${MAX_RIBOSOMES})`,
        enabled: () => (this.state.numRibosomes ?? 0) < MAX_RIBOSOMES && currState.numSugars > 0,
        onClick: () => {
          this.state.numRibosomes = (this.state.numRibosomes ?? 0) + 1;
          currState.numSugars--;
          currState.onChange();
          this.reportStateChange();
        }
      }
    ];
    if (this.state.numRibosomes == MAX_RIBOSOMES) {
      btns.push({
        id: 'addCentros',
        label: () => `Add Centrosomes`,
        enabled: () => true,
        onClick: () => {
          this.state.numCentrosomes = (this.state.numCentrosomes ?? 0) + 1;
          this.reportStateChange();
        }
      });
    }
    return btns;
  }
}
