import { Loader, Scene } from 'phaser';

export default class PreloadScene extends Scene{
  constructor(){
    super('PreloadScene');
  }

  preload(){
    this.load.start();
    this.load.once(Loader.Events.COMPLETE, () => {
      this.scene.start('GameScene');
    });

    this.load.path = 'src/Assets/';
    this.load.spritesheet('tank', 'tanks.png', {
      frameWidth: 32,
      frameHeight: 32
    });
  }
}