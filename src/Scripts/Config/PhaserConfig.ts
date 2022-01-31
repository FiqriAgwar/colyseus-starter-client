import {Types, AUTO, Scale} from 'phaser';

export type PhaserConfig = Types.Core.GameConfig;

const config: PhaserConfig = {
  title: 'Explor.io',
  type: AUTO,
  scale: {
    parent: 'phaser-app',
    mode: Scale.FIT,
    autoCenter: Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade',
    arcade: {
      debug: true
    }
  },
  backgroundColor: '#101010',
  scene: []
}

export default config;