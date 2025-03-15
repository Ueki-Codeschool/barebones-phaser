import Phaser from "phaser";

// This is the name we'll use to refer to our logo image
// Using a constant like this helps us avoid typos when we use it multiple times
const logoName = "logo";

// A Scene is like a level or screen in our game
// Each scene can have its own objects, characters, and rules
class MainScene extends Phaser.Scene {
  // Define class properties with their types
  private logo!: Phaser.Physics.Arcade.Image;
  private cursors!: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
    jump: Phaser.Input.Keyboard.Key;
  };
  private isJumping: boolean = false;
  private canJump: boolean = true; // Initialize canJump to true
  private hasDoubleJump: boolean = true; // Track if double jump is available
  private jumpReleased: boolean = true; // Track if jump key has been released

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
    this.logo = this.physics.add.image(100, 300, logoName);

    // Change the size of the image
    // setScale(x, y) changes the width and height of the image
    // Values less than 1 make it smaller, greater than 1 make it larger
    // Using the same value for both keeps the proportions the same
    this.logo.setScale(0.1); // Make the logo half its original size

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
    const obstacleY = 500; // Changed to sit on the ground

    // Create a graphics object - this is like a digital pen or brush
    // We use it to draw shapes that aren't from image files
    const graphics = this.add.graphics();

    // Set fill style (color, alpha)
    // 0x009900 is the color code for green (like #009900 in CSS)
    // 1 means fully visible (not transparent at all)
    graphics.fillStyle(0x009900, 1);

    // Draw the rectangle (x, y, width, height)
    // x=0 means start from the left edge
    // y=groundY means start 550 pixels from the top
    // Then make it as wide and tall as our variables specify
    graphics.fillRect(0, groundY, groundWidth, groundHeight);

    // Create the ground as a static physics body
    const ground = this.physics.add.staticGroup();
    const groundSprite = this.add.rectangle(
      400,
      groundY + 25,
      groundWidth,
      groundHeight,
      0x009900
    );
    ground.add(groundSprite);

    // Draw the obstacle as a brown rectangle
    graphics.fillStyle(0x8b4513, 1); // Brown color
    graphics.fillRect(
      obstacleX - obstacleWidth / 2,
      obstacleY - obstacleHeight / 2,
      obstacleWidth,
      obstacleHeight
    );

    // Create the obstacle as a static physics body
    const obstacle = this.physics.add.staticGroup();
    const obstacleSprite = this.add.rectangle(
      obstacleX,
      obstacleY,
      obstacleWidth,
      obstacleHeight,
      0x8b4513
    );
    obstacle.add(obstacleSprite);

    // Make the logo and obstacle collide with the ground
    this.physics.add.collider(this.logo, ground, this.handleGroundCollision, undefined, this);
    this.physics.add.collider(this.logo, obstacle);

    // Set the logo to bounce a little bit
    this.logo.setBounce(0.1);
    this.logo.setCollideWorldBounds(true);
    this.logo.setDrag(300, 0); // Add drag to slow down horizontal movement
    this.logo.setFriction(0.2, 0); // Add friction for more realistic movement

    // Add movement with keyboard WASD
    this.cursors = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      jump: Phaser.Input.Keyboard.KeyCodes.SPACE,
    }) as {
      up: Phaser.Input.Keyboard.Key;
      down: Phaser.Input.Keyboard.Key;
      left: Phaser.Input.Keyboard.Key;
      right: Phaser.Input.Keyboard.Key;
      jump: Phaser.Input.Keyboard.Key;
    };
  }

  handleGroundCollision() {
    // When the logo touches the ground, allow jumping again
    this.canJump = true;
    this.isJumping = false;
    this.hasDoubleJump = true; // Reset double jump when touching ground
  }

  update() {
    // The update method runs on every frame of the game loop
    // This is where you put game logic that needs to run continuously
    // It's called approximately 60 times per second depending on performance

    // Check for horizontal movement
    if (this.cursors.left.isDown) {
      // Move left with acceleration for smoother movement
      this.logo.setVelocityX(Math.max(this.logo.body.velocity.x - 20, -300));
    } else if (this.cursors.right.isDown) {
      // Move right with acceleration for smoother movement
      this.logo.setVelocityX(Math.min(this.logo.body.velocity.x + 20, 300));
    } else {
      // Slow down naturally when not pressing keys
      if (Math.abs(this.logo.body.velocity.x) < 10) {
        this.logo.setVelocityX(0);
      } else if (this.logo.body.velocity.x > 0) {
        this.logo.setVelocityX(this.logo.body.velocity.x - 10);
      } else {
        this.logo.setVelocityX(this.logo.body.velocity.x + 10);
      }
    }

    // Track if jump key has been released (needed for double jump)
    if (!this.cursors.jump.isDown) {
      this.jumpReleased = true;
    }

    // Check for jump - only allow jumping when on the ground
    if (this.cursors.jump.isDown && this.jumpReleased) {
      if (this.canJump) {
        // First jump
        this.logo.setVelocityY(-600);
        this.isJumping = true;
        this.canJump = false;
        this.jumpReleased = false;
      } else if (this.hasDoubleJump) {
        // Double jump (Genji style)
        this.logo.setVelocityY(-500); // Slightly less powerful than first jump
        this.hasDoubleJump = false;
        this.jumpReleased = false;
        
        // Add a visual effect for double jump (simple rotation)
        this.tweens.add({
          targets: this.logo,
          angle: 360,
          duration: 400,
          ease: 'Power1'
        });
      }
    }

    // If the player is moving horizontally while jumping, add some horizontal boost
    if (this.isJumping) {
      if (this.cursors.left.isDown) {
        this.logo.setVelocityX(Math.max(this.logo.body.velocity.x - 5, -350));
      } else if (this.cursors.right.isDown) {
        this.logo.setVelocityX(Math.min(this.logo.body.velocity.x + 5, 350));
      }
    }
  }
}

// This object contains all the settings for our game
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO, // Let Phaser choose the best renderer (WebGL or Canvas)
  width: 800, // Game width in pixels
  height: 600, // Game height in pixels
  scene: [MainScene],
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: 1200 },
      debug: false,
    },
  },
};

// This line creates and starts our game using the settings above
// Without this line, nothing would happen!
const game = new Phaser.Game(config);
