import Phaser from "phaser";

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  scene: {
    preload: preload,
    create: create,
    update: update,
  },
};

const game = new Phaser.Game(config);

function preload() {
  // Load the local image from assets directory
  this.load.image("logo", "assets/phaser-logo.png");
}

function create() {
  // Display the image in the center of the screen
  this.add.image(400, 300, "logo");
}

function update() {
  // Game loop logic goes here
}
