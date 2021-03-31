
class TutorialText extends Entity {
  constructor(scene) {
    super(null);
    this.scene = scene;
    currState.addListener(() => { this.onStateChanged(); });

    let cam = this.scene.cameras.main;
    const W = cam.displayWidth;
    const H = cam.displayHeight;
    let x = W - 50;
    let y = 50;

    const textStyle = {
      font: "36px ProggySquare", fill: "#fff",
      stroke: "#000", strokeThickness: 0,
      shadow: { offsetX: 2, offsetY: 2, stroke: false, fill: true }
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

  }

  setText(text) {
    const textObj = this.mainText.gameObject;
    textObj.text = text;
    const bgObj = this.bgRect.gameObject;
    bgObj.setOrigin(1, 0);
    bgObj.width = textObj.width + 2 * this.halfPad;
    bgObj.height = textObj.height + 2 * this.halfPad;
  }

  update() {
    this.setText('test \n test\n fdsjkflsdjfkldsjfklsd');

  }

  onStateChanged() {
  }
}