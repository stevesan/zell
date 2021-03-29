
class TutorialText extends Entity {
  constructor(scene) {
    super(null);
    this.scene = scene;
    currState.addListener(() => { this.onStateChanged(); });

    let cam = this.scene.cameras.main;
    const W = cam.displayWidth;
    const H = cam.displayHeight;
    let x = 0.75;
    let y = 0.05;

    const textStyle = {
      font: "36px ProggySquare", fill: "#fff",
      stroke: "#000", strokeThickness: 0,
      shadow: { offsetX: 2, offsetY: 2, stroke: false, fill: true }
    };

    this.mainText = new Entity(this.scene.add.text(x * W, y * H,
      "tutorial text!",
      textStyle));
    this.mainText.setParent(this);
  }

  onStateChanged() {
  }
}