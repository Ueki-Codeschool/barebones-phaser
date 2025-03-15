import Phaser from "phaser";

class MainScene extends Phaser.Scene {
  constructor() {
    super("MainScene");
  }

  preload() {
    // The preload method runs once at the beginning of the scene
    // This is where you load all assets (images, sounds, spritesheets, etc.)
    // Assets loaded here will be ready to use in the create method
    this.load.image("logo", "assets/phaser-logo.png");
  }

  create() {
    // The create method runs once after preload completes
    // This is where you set up your game objects, physics, and initial state
    // It's called after all assets from preload are available
    this.add.image(400, 300, "logo");
  }

  update() {
    // The update method runs on every frame of the game loop
    // This is where you put game logic that needs to run continuously
    // It's called approximately 60 times per second depending on performance
  }
}

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  scene: [MainScene],
};

// initialize game
const game = new Phaser.Game(config);
