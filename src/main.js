
function toggleOrChange(currVal, goalVal) {
  if (currVal == goalVal) {
    return null;
  }
  else {
    return goalVal;
  }
}

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

const currState = new GameState();

class HudScene extends Phaser.Scene {
  constructor() {
    super({
      key: 'hud',
      active: true
    });
    currState.addListener(() => { this.onStateChanged(); });
  }

  create() {
    const textStyle = {
      font: "42px ProggySquare", fill: "#8f8",
      stroke: "#000", strokeThickness: 0,
      shadow: { offsetX: 2, offsetY: 2, stroke: false, fill: true }
    };
    this.sugarText = this.add.text(50, 50, "", textStyle);
    this.onStateChanged();
  }

  update(time, dtMs) {
  }

  onStateChanged() {
    this.sugarText.text = 'SUGAR: ';
    for (let i = 0; i < currState.numSugars; i++) {
      this.sugarText.text += 'O';
    }
  }
}

function throb(scene, image, amount) {
  if (amount === undefined) {
    amount = 1.2;
  }
  if (image.__throbbing) return;
  image.__throbbing = true;
  const origScale = image.scale;
  image.setScale(origScale * amount);
  scene.tweens.add({
    targets: image,
    scale: origScale,
    ease: 'Quadratic',
    duration: 200,
    delay: 0,
    repeat: 0,
    onComplete: () => {
      image.__throbbing = false;
    }
  });
}

class Entity {
  constructor(gameObject) {
    this.gameObject = gameObject;
    if (gameObject !== null) {
      this.gameObject.entity = this;
    }
    this.parentNode = null;
    this.childNodes = new Set();
  }

  findRoot() {
    if (this.parentNode === null) {
      return this;
    }
    else {
      return this.parentNode.findRoot();
    }
  }

  hasChild(ent) {
    return this.childNodes.has(ent);
  }

  setParent(newParent) {
    if (this.parentNode === newParent) return;
    if (this.parentNode !== null) {
      console.assert(this.parentNode.hasChild(this));
      this.parentNode.childNodes.delete(this);
    }
    this.parentNode = newParent;
    if (newParent !== null) {
      console.assert(!newParent.hasChild(this));
      newParent.childNodes.add(this);
    }
  }

  selfUpdate(dt) {
  }

  update(dt) {
    this.selfUpdate(dt);
    for (const child of this.childNodes) {
      child.update(dt);
    }
  }

  destroy() {
    this.setParent(null);
    if (this.gameObject) this.gameObject.destroy();
    this.gameObject = null;
    for (const child of this.childNodes) {
      child.destroy();
    }
    this.childNodes.clear();
  }

  onClick() {
  }

  onPointerIn() {
    if (!this.gameObject) return;
    this.gameObject.setTint(0x88ff88);
  }

  onPointerOut() {
    if (!this.gameObject) return;
    this.gameObject.clearTint();
  }
}

class SugarEntity extends Entity {
  constructor(go) {
    super(go);
  }

  selfUpdate(dt) {
    if (!this.gameObject) return;
  }

  onClick() {
    if (selectedCellEntity) {
      selectedCellEntity.targetMode = 'ent';
      selectedCellEntity.targetEnt = this;
    }
  }

}

const MAX_CELL_SPEED = 300;

// Gross
let imageWasJustClicked = false;

let explosionEmitter = null;
let clickEmitter = null;

let pointerObject = null;
let selectedCellEntity = null;

class CellEntity extends Entity {
  constructor(go) {
    super(go);
    this.targetMode = 'none';

    this.prevVelX = 0;
    this.prevVelY = 0;
    this.spinDir = 1;
  }

  commandToWorldPos(x, y) {
    this.targetMode = 'pos';
    this.targetX = x;
    this.targetY = y;
    this.spinDir *= -1;
  }

  goTowards(x, y, dt) {
    let dx = x - this.gameObject.x;
    let dy = y - this.gameObject.y;
    let dist = Math.sqrt(dx * dx + dy * dy);
    if (dist <= 0) return;

    let easiness = 20;
    let speed = MAX_CELL_SPEED * (1 - 1 / (dist / easiness + 1));
    this.prevVelX = dx / dist * speed;
    this.prevVelY = dy / dist * speed;
    this.gameObject.setVelocity(this.prevVelX, this.prevVelY);
  }

  onClick() {
    if (!this.gameObject.scene.isCellMode()) {
      this.gameObject.scene.enterCellMode(this);
    }
  }

  onPointerIn() {
    if (!this.gameObject) return;
    if (!this.gameObject.scene.isCellMode()) {
      this.gameObject.setTint(0x88ff88);
    }
  }

  update(dtMs) {
    if (!this.gameObject) return;

    if (this.gameObject.scene.isCellMode()) {
      this.gameObject.clearTint();
      this.gameObject.setVelocity(0, 0);
      this.gameObject.setAngularVelocity(0);
      this.gameObject.setImmovable(true);
      this.gameObject.angle += dtMs / 1000 * 5 * this.spinDir;
      this.targetMode = 'none';
    }
    else {
      this.gameObject.setImmovable(false);
      if (this.targetMode == 'pos') {
        this.goTowards(this.targetX, this.targetY, dtMs);
      }
      else if (this.targetMode == 'ent') {
        if (this.targetEnt == null || this.targetEnt.gameObject == null) {
          // It's gone - just go a bit past it
          this.targetMode = 'pos';
          let pastTime = 0.1;
          this.targetX = this.gameObject.x + this.prevVelX * pastTime;
          this.targetY = this.gameObject.y + this.prevVelY * pastTime;
        } else {
          this.goTowards(this.targetEnt.gameObject.x, this.targetEnt.gameObject.y, dtMs);
        }
      }

      this.gameObject.angle += dtMs / 1000 * 60 * this.spinDir;
    }
  }
}

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

    let depth = 1;

    let cam = this.scene.cameras.main;
    const W = cam.displayWidth;
    const H = cam.displayHeight;
    let x = 0.1;
    let y = 0.2;
    const dy = 0.05;
    const textStyle = {
      font: "42px ProggySquare", fill: "#fff",
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
        const text = scene.add.text((x + 0.02) * W, y * H, '', textStyle);
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

class CellMode extends Entity {

  createMenuForName(name) {
    if (name == 'nucleus') {
      return new NucleusMenu(this.hudScene, this.state, () => this.onStateChanged());
    }
    else if (name == 'er') {
      return new EndoRetMenu(this.hudScene, this.state, () => this.onStateChanged());
    }
    else if (name == 'golgi') {
      return new GolgiMenu(this.hudScene, this.state, () => this.onStateChanged());
    }
    else if (name == 'mito') {
      return new MitoMenu(this.hudScene, this.state, () => this.onStateChanged());
    }
    else {
      throw `Bad menu name: ${name}`;
    }
  }

  onStateChanged() {
    const state = this.state;
    const scene = this.scene;

    if (this.state.activeMenuName != this.prevActiveMenuName) {
      if (this.activeMenuEnt) {
        this.activeMenuEnt.destroy();
        this.activeMenuEnt = null;
      }

      if (this.state.activeMenuName !== null) {
        this.activeMenuEnt = this.createMenuForName(this.state.activeMenuName);
        this.activeMenuEnt.setParent(this);
      }

      this.prevActiveMenuName = this.state.activeMenuName;
    }

    if (this.activeMenuEnt) {
      this.activeMenuEnt.onStateChanged();
    }

    if (state.endoRetShowing && !this.endoRet) {
      scene.createSound.play();
      let er = scene.add.image(state.cellX - 5, state.cellY + 0, 'endoret').setInteractive();
      er.on('pointerdown', () => {
        throb(scene, er);
        this.state.activeMenuName = toggleOrChange(this.state.activeMenuName, 'er');
        this.onStateChanged();

      });
      er.setScale(0.1);
      this.endoRet = new Entity(er);
      this.endoRet.setParent(this);
    }
    else if (!state.endoRetShowing && this.endoRet) {
      this.endoRet.destroy();
      this.endoRet = null;
    }

    const numRibos = state.numRibosomes ?? 0;
    if (this.riboEnts === undefined) {
      this.riboEnts = [];
    }
    for (let i = this.riboEnts.length; i < numRibos; i++) {
      this.riboEnts.push(null);
    }
    let createdRibos = false;
    for (let i = 0; i < this.riboEnts.length; i++) {
      if (i < numRibos && this.riboEnts[i] === null) {
        createdRibos = true;
        let ribo = scene.add.image(state.cellX - 10 + 2 * i, state.cellY + 3 * (i % 2) + 2, 'ribosome');
        ribo.setScale(0.1);
        this.riboEnts[i] = new Entity(ribo);
        this.riboEnts[i].setParent(this);
        scene.tweens.add({
          targets: ribo,
          x: ribo.x + (2 * Math.random() - 1) * 2,
          y: ribo.y + (2 * Math.random() - 1) * 2,
          ease: 'Quadratic',
          duration: 500,
          delay: 0,
          repeat: 0,
        });
      }
      else if (i >= numRibos && this.riboEnts[i] !== null) {
        this.riboEnts[i].destroy();
        this.riboEnts[i] = null;
      }
    }
    if (createdRibos) {
      scene.createSound.play();
    }

    const numCentros = this.state.numCentrosomes ?? 0;
    const prevNumCentros = this.prevNumCentros ?? 0;
    if (numCentros > prevNumCentros) {
      scene.createSound.play();
      let img = scene.add.image(state.cellX, state.cellY, 'ribosome');
      img.setScale(0.1);
      img.setTint(0x000);
      if (this.centroEnt) {
        this.centroEnt.destroy();
      }
      this.centroEnt = new Entity(img);
      this.centroEnt.setParent(this);

      scene.tweens.add({
        targets: img,
        x: state.cellX + 30,
        ease: 'Quadratic',
        duration: 1000,
        delay: 0,
        repeat: 0,
      });
    }
    this.prevNumCentros = numCentros;
  }

  constructor(scene, hudScene, cellEnt, state) {
    super(null);
    this.scene = scene;
    this.hudScene = hudScene;
    this.cellEntity = cellEnt;
    this.state = state;

    let globalScale = 1.0;

    this.state.cellX = cellEnt.gameObject.x;
    this.state.cellY = cellEnt.gameObject.y;

    let cx = cellEnt.gameObject.x;
    let cy = cellEnt.gameObject.y;

    for (let dxdy of [[-10, 10], [10, 12]]) {
      let mito = scene.add.image(cx + dxdy[0], cy + dxdy[1], 'mito').setInteractive();
      mito.setScale(0.1 * globalScale);
      mito.on('pointerdown', () => {
        throb(scene, mito);
        this.state.activeMenuName = toggleOrChange(this.state.activeMenuName, 'mito');
        this.onStateChanged();
      });
      new Entity(mito).setParent(this);
    }
    {
      let nuc = scene.add.image(cx - 5, cy - 10, 'nuc').setInteractive();
      nuc.on('pointerdown', () => {
        throb(scene, nuc);
        this.state.activeMenuName = toggleOrChange(this.state.activeMenuName, 'nucleus');
        this.onStateChanged();

      });
      nuc.setScale(0.1 * globalScale);
      this.nucleus = new Entity(nuc);
      this.nucleus.setParent(this);
    }
    {
      let golgi = scene.add.image(cx + 10, cy - 5, 'golgi').setInteractive();
      golgi.on('pointerdown', () => {
        throb(scene, golgi);
        this.state.activeMenuName = toggleOrChange(this.state.activeMenuName, 'golgi');
        this.onStateChanged();
      });
      golgi.setScale(0.1 * globalScale);
      this.golgi = new Entity(golgi);
      this.golgi.setParent(this);
    }

    {
      let backBtn = scene.add.image(cx - 45, cy + 20, 'back').setInteractive();
      backBtn.on('pointerdown', () => {
        throb(scene, backBtn);
        this.scene.enterMoveMode();
      });
      backBtn.setScale(0.1 * globalScale);
      this.backBtn = new Entity(backBtn);
      this.backBtn.setParent(this);
    }

    this.onStateChanged();
  }
}

const worldWidth = 2000;
const worldHeight = 2000;

function createFuzz(scene) {
  scene.fuzzes = [];
  for (let i = 0; i < 100; i++) {
    let x = worldWidth * Math.random();
    let y = worldHeight * Math.random();
    let image = scene.add.image(x, y, 'fuzz');
    image.alpha = Math.random() * 0.8;
    image.origX = x;
    image.origY = y;
    image.freq = (Math.random() * 2 - 1) * 0.3;
    image.amp = Math.random() * 20;
    scene.fuzzes.push(image);
  }
}

function updateFuzzes(scene, time, dtMs) {
  for (let fuzz of scene.fuzzes) {
    fuzz.x = fuzz.origX + Math.sin(2 * Math.PI * fuzz.freq * time / 1000) * fuzz.amp;
    fuzz.y = fuzz.origY + Math.cos(2 * Math.PI * fuzz.freq * time / 1000) * fuzz.amp;
  }
}

class MainScene extends Phaser.Scene {
  constructor() {
    super({
      key: 'main',
      active: true,
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false,
        }
      },
    });
  }
  preload() {
    this.load.setBaseURL('../assets');
    this.load.image('back', 'back.png');
    this.load.image('cell', 'cell.png');
    this.load.image('mito', 'mito.png');
    this.load.image('nuc', 'nuc.png');
    this.load.image('fuzz', 'fuzz.png');
    this.load.image('sugar', 'molecule.png');
    this.load.image('arrow', 'arrow.png');
    this.load.image('endoret', 'endoret.png');
    this.load.image('ribosome', 'ribosome.png');
    this.load.image('golgi', 'golgi.png');
    this.load.image('particles/blue', 'particles/blue.png');

    this.load.audio('click', 'sounds/click.wav');
    this.load.audio('create', 'sounds/create.wav');
    this.load.audio('powerup', 'sounds/powerup.wav');
    this.load.audio('bgmusic', 'music/ftl-title-theme.mp3');
  }

  create() {
    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
    this.sound.add('bgmusic', { loop: true, volume: 0.2 }).play();

    this.clickAudio = this.sound.add('click', { volume: 0.3 });
    this.powerupAudio = this.sound.add('powerup', { volume: 0.1 });
    this.createSound = this.sound.add('create', { volume: 0.1 });

    createFuzz(this);

    this.rootEntity = new Entity(null);

    var cellImage = this.physics.add.image(config.width / 2, config.height / 2, 'cell');
    cellImage.setCircle(32);
    cellImage.setVelocity(1, 1);
    cellImage.setBounce(1, 1);
    cellImage.setCollideWorldBounds(true);

    let cell = new CellEntity(cellImage);
    selectedCellEntity = cell;
    this.cameras.main.startFollow(cellImage);
    this.cameras.main.setLerp(0.1);
    cell.setParent(this.rootEntity);

    for (let i = 0; i < 5; i++) {
      var sugarImage = this.physics.add.image(Math.random() * config.width, Math.random() * config.height, 'sugar');
      sugarImage.setCircle(32);
      sugarImage.setVelocity((Math.random() - 0.5) * 50, (Math.random() - 0.5) * 50);
      sugarImage.setAngularVelocity((Math.random() - 0.5) * 180);
      sugarImage.setBounce(1, 1);
      sugarImage.setCollideWorldBounds(true);
      let sugar = new SugarEntity(sugarImage);
      sugar.setParent(this.rootEntity);

      this.physics.add.overlap(sugarImage, cellImage, (sugarImage, cellImage) => {
        explosionEmitter.explode(100, sugarImage.x, sugarImage.y);
        sugar.destroy();
        this.powerupAudio.play();
        this.cameras.main.shake(400, 0.005);

        currState.numSugars++;
        currState.onChange();
      });
    }

    var particles = this.add.particles('particles/blue');
    particles.depth = 1;
    var emitter = particles.createEmitter({
      speed: 500,
      lifespan: 1000,
      scale: { start: 1, end: 0 },
      blendMode: 'ADD'
    });
    emitter.stop();

    explosionEmitter = emitter;

    clickEmitter = particles.createEmitter({
      speed: 200,
      lifespan: 250,
      scale: { start: 1, end: 0 },
      blendMode: 'ADD'
    });
    clickEmitter.stop();

    let getObjectsUnderPointer = (pointer) => {
      return this.physics.overlapRect(pointer.worldX, pointer.worldY, 1, 1);
    };

    let prevHoveredEnts = new Set();

    this.input.on('pointermove', (pointer) => {
      let hoveredEnts = new Set();
      for (let body of getObjectsUnderPointer(pointer)) {
        if (body.gameObject.entity) {
          hoveredEnts.add(body.gameObject.entity);
        }
      }

      for (let ent of hoveredEnts) {
        if (!prevHoveredEnts.has(ent)) {
          ent.onPointerIn();
        }
      }

      for (let ent of prevHoveredEnts) {
        if (!hoveredEnts.has(ent)) {
          ent.onPointerOut();
        }
      }

      prevHoveredEnts = hoveredEnts;
    });

    // Scene-wide click handler
    this.input.on('pointerdown', (pointer) => {
      let x = pointer.worldX;
      let y = pointer.worldY;
      console.log(`clicked @${x}, ${y}`);
      if (!this.isCellMode()) {
        clickEmitter.explode(30, x, y);
      }
      this.clickAudio.play();

      let clickedAny = false;
      for (let body of getObjectsUnderPointer(pointer)) {
        if (body.gameObject.entity) {
          body.gameObject.entity.onClick(this);
          clickedAny = true;
        }
      }

      if (!clickedAny) {
        // Clicked bg
        if (!this.isCellMode()) {
          cell.commandToWorldPos(x, y);
        }
      }
    });

    this.enterCellMode = (cellEnt) => {
      this.cameras.main.zoomTo(12, 1000, Phaser.Math.Easing.Cubic.In, true);
      if (this.mode == "cell") return;
      this.mode = "cell";
      if (!this.cellModeState) {
        this.cellModeState = {};
      }
      this.cellMode = new CellMode(this, this.scene.get('hud'), cellEnt, this.cellModeState);
    };

    this.enterMoveMode = () => {
      if (this.mode == "move") return;
      this.mode = "move";
      this.cameras.main.setBackgroundColor("#221111")
      this.cameras.main.zoomTo(1, 1000, Phaser.Math.Easing.Quartic.Out, true);
      if (this.cellMode) {
        this.cellMode.destroy();
        this.cellMode = null;
      }
    };

    this.isCellMode = () => { return this.mode == 'cell'; };

    this.enterMoveMode();
  }

  update(time, dtMs) {
    this.rootEntity.update(dtMs);
    updateFuzzes(this, time, dtMs);
  }
}

var config = {
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  scene: [
    MainScene,
    HudScene,
  ]
};

var game = new Phaser.Game(config);