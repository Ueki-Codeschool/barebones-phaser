import Phaser from "phaser";

// This is the name we'll use to refer to our logo image
// Using a constant like this helps us avoid typos when we use it multiple times
const logoName = "logo";

// A Scene is like a level or screen in our game
// Each scene can have its own objects, characters, and rules
class MainScene extends Phaser.Scene {
  constructor() {
    // "MainScene" is the name we give to this scene so we can find it later
    super("MainScene");
  }

  preload() {
    // The preload method runs once at the beginning of the scene
    // This is where you load all assets (images, sounds, spritesheets, etc.)
    // Assets loaded here will be ready to use in the create method

    // this.load.image() loads a picture into our game
    // First parameter: the name we want to call it (we're using our logoName constant)
    // Second parameter: the file path where the image is stored
    this.load.image(logoName, "assets/phaser-logo.png");
  }

  create() {
    // The create method runs once after preload completes
    // This is where you set up your game objects, physics, and initial state
    // It's called after all assets from preload are available

    // this.add.image() puts a picture on the screen
    // First two parameters: x and y coordinates (400, 300 is the center of our 800x600 game)
    // Third parameter: the name of the image we want to show (the same name we used in preload)
    // We save the image to a variable so we can modify it
    const logo = this.add.image(400, 300, logoName);

    // Change the size of the image
    // setScale(x, y) changes the width and height of the image
    // Values less than 1 make it smaller, greater than 1 make it larger
    // Using the same value for both keeps the proportions the same
    logo.setScale(0.1); // Make the logo half its original size

    // You can also set width and height separately
    // logo.setScale(0.5, 0.8); // Half width, 80% height

    // Create a ground rectangle
    // We'll make a green rectangle at the bottom of the screen to represent ground

    // These variables define the size and position of our ground
    const groundWidth = 800; // Same width as our game
    const groundHeight = 50; // 50 pixels tall
    const groundY = 550; // Position from top (600 - 50 = 550)

    // Obstacle variables
    const obstacleWidth = 100;
    const obstacleHeight = 100;
    const obstacleX = 400;
    const obstacleY = 500;

    // Create a graphics object - this is like a digital pen or brush
    // We use it to draw shapes that aren't from image files
    const graphics = this.add.graphics();

    // Set fill style (color, alpha)
    // 0x009900 is the color code for green (like #009900 in CSS)
    // 1 means fully visible (not transparent at all)
    graphics.fillStyle(0x009900, 1); // Green color

    // Draw the rectangle (x, y, width, height)
    // x=0 means start from the left edge
    // y=groundY means start 550 pixels from the top
    // Then make it as wide and tall as our variables specify
    graphics.fillRect(0, groundY, groundWidth, groundHeight);

    graphics.fillStyle(0xff0000, 1);
    graphics.fillRect(obstacleX, obstacleY, obstacleWidth, obstacleHeight);
  }

  update() {
    // The update method runs on every frame of the game loop
    // This is where you put game logic that needs to run continuously
    // It's called approximately 60 times per second depending on performance
    // This is empty for now, but this is where you would put code to:
    // - Check for player input (like keyboard or mouse)
    // - Move characters around
    // - Check for collisions
    // - Update scores or timers
  }
}

// This object contains all the settings for our game
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO, // Let Phaser choose the best renderer (WebGL or Canvas)
  width: 800, // Game width in pixels
  height: 600, // Game height in pixels
  scene: [MainScene], // The scenes our game will use (we just have one for now)
};

// This line creates and starts our game using the settings above
// Without this line, nothing would happen!
const game = new Phaser.Game(config);
