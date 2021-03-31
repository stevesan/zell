
class TutorialText extends Entity {
  constructor(scene, mainScene) {
    super(null);
    this.scene = scene;
    this.mainScene = mainScene;
    currState.addListener(() => this.onStateChanged());
    this.mainScene.addListener(() => this.onStateChanged());

    let cam = this.scene.cameras.main;
    const W = cam.displayWidth;
    const H = cam.displayHeight;
    let x = W - 50;
    let y = 50;

    const textStyle = {
      font: "36px ProggySquare", fill: "#fff",
      stroke: "#000", strokeThickness: 0,
      shadow: { offsetX: 2, offsetY: 2, stroke: false, fill: true },
      wordWrap: { width: 450, useAdvancedWrap: true }
    };

    this.mainText = new Entity(this.scene.add.text(x, y,
      "", textStyle));
    this.mainText.setParent(this);
    this.mainText.gameObject.setOrigin(1, 0);
    this.mainText.gameObject.depth = 1;

    console.log(this.mainText.gameObject.height);

    this.halfPad = 10;

    this.bgRect = new Entity(this.scene.add.rectangle(x + this.halfPad, y - this.halfPad, 100, 100, 0x0088ff));
    this.bgRect.setParent(this);
    this.bgRect.gameObject.setOrigin(1, 0);
    this.bgRect.gameObject.depth = 0;

    this.onStateChanged();

    window.__setTutorialText = (x) => this.setText(x);
  }

  setText(text) {
    const textObj = this.mainText.gameObject;
    textObj.text = text;
    const bgObj = this.bgRect.gameObject;
    bgObj.setSize(
      textObj.width + 2 * this.halfPad,
      textObj.height + 2 * this.halfPad);
    // For some reason, need to call this each time
    bgObj.setOrigin(1, 0);
  }

  update() {
    // this.setText('test \n test\n fdsjkflsdjfkldsjfklsd');
  }

  onStateChanged() {
    if (!currState.builtER) {
      if (currState.numSugars == 0) {
        this.setText('Tap the sugar to eat it. Go on. You know you want to.');
      }
      else {
        if (!this.mainScene.isCellMode()) {
          this.setText('Yum! Now click your cell to zoom in.');
        }
        else {
          this.setText('Now tap the nucleus. It’s just right there.');
        }
      }
    }
  }
}