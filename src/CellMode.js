
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

    if (currState.builtER && !this.endoRet) {
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
    else if (!currState.builtER && this.endoRet) {
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
    currState.addListener(() => this.onStateChanged());

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
