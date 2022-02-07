import { Loader, Scene } from "phaser";

export default class PreloadScene extends Scene {
  constructor() {
    super("PreloadScene");
  }

  preload() {
    this.load.start();
    this.load.once(Loader.Events.COMPLETE, () => {
      this.scene.start("GameScene");
    });

    this.load.path = "src/Assets/";
    this.load.image("tank", "tanklocal.png");
    this.load.image("enemy", "tankother.png");
    this.load.image("crashed", "tankcrashed.png");

    this.load.spritesheet("coin", "coin.png", {
      frameWidth: 20,
      frameHeight: 20,
    });

    this.load.spritesheet("grass", "grass.png", {
      frameWidth: 32,
      frameHeight: 32,
    });

    this.load.spritesheet("fire", "fire.png", {
      frameWidth: 16,
      frameHeight: 16,
      margin: 16,
      spacing: 16,
    });
  }
}
