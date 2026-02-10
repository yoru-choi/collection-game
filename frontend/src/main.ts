import Phaser from 'phaser';
import config from './game';

window.addEventListener('load', () => {
  new Phaser.Game(config);
});
