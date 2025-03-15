import Phaser from "phaser";
// Import assets to let Vite process them
import phaserLogo from './assets/phaser-logo.png';
import adventurerSheet from './assets/sprites/adventurer-v1.5-Sheet.png';

// Constants for asset names
const logoName = "logo";
const playerSpriteName = "player";

// Animation keys
const ANIM_IDLE = "idle";
const ANIM_RUN = "run";
const ANIM_JUMP = "jump";
const ANIM_FALL = "fall";
const ANIM_DOUBLE_JUMP = "doubleJump";
const ANIM_ATTACK1 = "attack1";
const ANIM_ATTACK2 = "attack2";
const ANIM_ATTACK3 = "attack3";
const ANIM_SHOOT = "shoot";

// A Scene is like a level or screen in our game
// Each scene can have its own objects, characters, and rules
class MainScene extends Phaser.Scene {
  // Define class properties with their types
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
    jump: Phaser.Input.Keyboard.Key;
    attack: Phaser.Input.Keyboard.Key;
    attack2: Phaser.Input.Keyboard.Key;
    attack3: Phaser.Input.Keyboard.Key;
    shoot: Phaser.Input.Keyboard.Key;
  };
  private isJumping: boolean = false;
  private canJump: boolean = true; // Initialize canJump to true
  private hasDoubleJump: boolean = true; // Track if double jump is available
  private jumpReleased: boolean = true; // Track if jump key has been released
  private facingLeft: boolean = false; // Track which direction player is facing
  private isAttacking: boolean = false; // Track if player is currently attacking
  private isShooting: boolean = false; // Track if player is currently shooting
  private attackHitbox!: Phaser.GameObjects.Rectangle;
  private attackCombo: number = 0; // Track attack combo (0, 1, 2)
  private lastAttackTime: number = 0; // Track time of last attack for combo system
  private enemies: Phaser.Physics.Arcade.Group | null = null;
  private attackCooldown: boolean = false; // Track attack cooldown
  private shootCooldown: boolean = false; // Track shoot cooldown
  private obstacle!: Phaser.GameObjects.Rectangle;
  private obstacleHealth: number = 500;
  private obstacleHealthText!: Phaser.GameObjects.Text;
  private damageTexts: Phaser.GameObjects.Text[] = [];
  private lastHitTime: number = 0; // Track time of last hit for damage cooldown
  private hitCooldown: number = 800; // Cooldown between hits in milliseconds (just under a second)
  private projectiles!: Phaser.Physics.Arcade.Group;

  constructor() {
    // "MainScene" is the name we give to this scene so we can find it later
    super("MainScene");
  }

  preload() {
    // The preload method runs once at the beginning of the scene
    // This is where you load all assets (images, sounds, spritesheets, etc.)
    // Assets loaded here will be ready to use in the create method

    // Load the logo image
    this.load.image(logoName, phaserLogo);

    // Load the adventurer spritesheet
    this.load.spritesheet(
      playerSpriteName,
      adventurerSheet,
      {
        frameWidth: 50, // Width of each frame in the spritesheet
        frameHeight: 37, // Height of each frame in the spritesheet
      }
    );

    // Load projectile image
    this.load.image(
      "projectile",
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAYAAABWdVznAAAACXBIWXMAAAsTAAALEwEAmpwYAAAA+0lEQVQokZWSMUoDQRSGv7e7kxULQbC0EKwlnZdQvIGFhYKFhQdIo4WlhQdIYWVhYWEhWFjYiKWVYCGIhUQRdmfGYrIQdtcN+eFVj/+b9+bNE1VlE9iNYIwJVHUoIj1gAJwCXWAKvAJPwL2qvjvnFmtQEATHwDVwAWwvtQR8AHfAjXPuLYqiE+AW6K8JLPMFXMVxfA68rIMWUAc+kyTJgOdNoAAUQJIkPeBhA2yR7rJaFEUAXeDcGLO1Zt0BnDHmEDhbFVR1KCL7QRBsW2vRX7DWYq0NIQyBw2U+XsxpNpvEcfxVr9cLa20J/Lar1WqlMaY0xpT1ev27Xq8XwDfQnFiMU8+uiAAAAABJRU5ErkJggg=="
    );
  }

  create() {
    // The create method runs once after preload completes
    // This is where you set up your game objects, physics, and initial state
    // It's called after all assets from preload are available

    // Create the player sprite
    this.player = this.physics.add.sprite(100, 300, playerSpriteName);
    this.player.setBounce(0.1);
    this.player.setCollideWorldBounds(true);
    this.player.setDrag(300, 0); // Add drag to slow down horizontal movement
    this.player.setFriction(0.2, 0); // Add friction for more realistic movement

    // Scale the player to be visible (these sprites are quite small)
    this.player.setScale(2);

    // Create animations for the player
    this.createPlayerAnimations();

    // Create attack hitbox (invisible by default)
    this.attackHitbox = this.add.rectangle(0, 0, 60, 40, 0x000000, 0);
    this.physics.add.existing(this.attackHitbox, false);
    (this.attackHitbox.body as Phaser.Physics.Arcade.Body).allowGravity = false;
    (this.attackHitbox.body as Phaser.Physics.Arcade.Body).setImmovable(true);

    // Create a group for enemies
    this.enemies = this.physics.add.group();

    // Create a test enemy
    this.createEnemy(600, 450);

    // Create a group for projectiles
    this.projectiles = this.physics.add.group({
      defaultKey: "projectile",
      maxSize: 10, // Maximum number of projectiles at once
    });

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
    this.obstacle = this.add.rectangle(
      obstacleX,
      obstacleY,
      obstacleWidth,
      obstacleHeight,
      0x8b4513
    );
    obstacle.add(this.obstacle);

    // Add health text above the obstacle
    this.obstacleHealthText = this.add.text(
      obstacleX - 40,
      obstacleY - 70,
      `HP: ${this.obstacleHealth}`,
      {
        fontSize: "16px",
        color: "#fff",
        backgroundColor: "#000",
      }
    );

    // Make the player and obstacle collide with the ground
    this.physics.add.collider(
      this.player,
      ground,
      this.handleGroundCollision,
      undefined,
      this
    );
    this.physics.add.collider(this.player, obstacle);

    // Make enemies collide with the ground and obstacles
    if (this.enemies) {
      this.physics.add.collider(this.enemies, ground);
      this.physics.add.collider(this.enemies, obstacle);
    }

    // Set up collision between attack hitbox and enemies
    if (this.enemies) {
      this.physics.add.overlap(
        this.attackHitbox,
        this.enemies,
        this
          .handleAttackHit as unknown as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
        undefined,
        this
      );
    }

    // Set up collision between attack hitbox and obstacle
    this.physics.add.overlap(
      this.attackHitbox,
      obstacle,
      this
        .handleObstacleHit as unknown as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );

    // Set up collision between projectiles and enemies
    if (this.enemies) {
      this.physics.add.overlap(
        this.projectiles,
        this.enemies,
        this
          .handleProjectileHit as unknown as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
        undefined,
        this
      );
    }

    // Set up collision between projectiles and obstacle
    this.physics.add.overlap(
      this.projectiles,
      obstacle,
      this
        .handleProjectileObstacleHit as unknown as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );

    // Add movement with keyboard WASD and attack keys
    this.cursors = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      jump: Phaser.Input.Keyboard.KeyCodes.SPACE,
      attack: Phaser.Input.Keyboard.KeyCodes.J,
      attack2: Phaser.Input.Keyboard.KeyCodes.K,
      attack3: Phaser.Input.Keyboard.KeyCodes.L,
      shoot: Phaser.Input.Keyboard.KeyCodes.F,
    }) as {
      up: Phaser.Input.Keyboard.Key;
      down: Phaser.Input.Keyboard.Key;
      left: Phaser.Input.Keyboard.Key;
      right: Phaser.Input.Keyboard.Key;
      jump: Phaser.Input.Keyboard.Key;
      attack: Phaser.Input.Keyboard.Key;
      attack2: Phaser.Input.Keyboard.Key;
      attack3: Phaser.Input.Keyboard.Key;
      shoot: Phaser.Input.Keyboard.Key;
    };

    // Start with the idle animation
    this.player.anims.play(ANIM_IDLE);

    // Add text instructions for controls
    this.add.text(
      10,
      10,
      "Controls: WASD to move, SPACE to jump, J/K/L for attacks, F to shoot",
      {
        fontSize: "16px",
        color: "#fff",
        backgroundColor: "#000",
      }
    );
  }

  createEnemy(x: number, y: number) {
    if (!this.enemies) return;

    // Create a simple enemy (red rectangle)
    const enemy = this.add.rectangle(x, y, 30, 50, 0xff0000);
    this.physics.add.existing(enemy);

    // Add the enemy to the group
    this.enemies.add(enemy);

    // Set enemy properties
    (enemy.body as Phaser.Physics.Arcade.Body).setBounce(0.1);
    (enemy.body as Phaser.Physics.Arcade.Body).setCollideWorldBounds(true);

    // Store health on the enemy
    (enemy as any).health = 3;
  }

  handleAttackHit(
    _hitbox: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    enemy: Phaser.Types.Physics.Arcade.GameObjectWithBody
  ) {
    const currentTime = this.time.now;

    // Only register a hit if we're attacking and not in cooldown
    if (this.isAttacking && currentTime - this.lastHitTime > this.hitCooldown) {
      // Determine damage based on attack combo
      let damage = 1;
      if (this.attackCombo === 1) damage = 1;
      else if (this.attackCombo === 2) damage = 2;
      else if (this.attackCombo === 3) damage = 3;

      // Apply damage to enemy
      (enemy as any).health -= damage;

      // Update last hit time
      this.lastHitTime = currentTime;

      // Visual feedback - enemy flashes white
      this.tweens.add({
        targets: enemy,
        fillColor: 0xffffff,
        duration: 100,
        yoyo: true,
        onComplete: () => {
          // If enemy health <= 0, destroy it
          if ((enemy as any).health <= 0) {
            enemy.destroy();
          }
        },
      });

      // Apply knockback based on player facing direction
      const knockbackForce = 200;
      const direction = this.facingLeft ? -1 : 1;
      (enemy.body as Phaser.Physics.Arcade.Body).setVelocityX(
        knockbackForce * direction
      );
      (enemy.body as Phaser.Physics.Arcade.Body).setVelocityY(-100);
    }
  }

  handleObstacleHit(
    _hitbox: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    _obstacle: Phaser.Types.Physics.Arcade.GameObjectWithBody
  ) {
    const currentTime = this.time.now;

    // Only register a hit if we're attacking and not in cooldown
    if (
      this.isAttacking &&
      this.obstacleHealth > 0 &&
      currentTime - this.lastHitTime > this.hitCooldown
    ) {
      // Determine damage based on attack combo
      let damage = 5; // Base damage
      if (this.attackCombo === 1) damage = 5;
      else if (this.attackCombo === 2) damage = 10;
      else if (this.attackCombo === 3) damage = 15;

      // Apply damage to obstacle
      this.obstacleHealth -= damage;

      // Update last hit time
      this.lastHitTime = currentTime;

      // Update health text
      this.obstacleHealthText.setText(`HP: ${this.obstacleHealth}`);

      // Create floating damage text
      this.createFloatingDamageText(
        this.obstacle.x,
        this.obstacle.y - 50,
        damage
      );

      // Apply knockback effect based on player facing direction
      const knockbackDistance = 10; // Pixels to move
      const direction = this.facingLeft ? -1 : 1;
      const originalX = this.obstacle.x;

      // First knockback tween - move in the direction of the hit
      this.tweens.add({
        targets: [this.obstacle, this.obstacleHealthText],
        x: originalX + knockbackDistance * direction,
        duration: 50,
        ease: "Power1",
        onComplete: () => {
          // Second tween - return to original position
          this.tweens.add({
            targets: [this.obstacle, this.obstacleHealthText],
            x: originalX,
            duration: 150,
            ease: "Elastic.easeOut",
          });
        },
      });

      // Visual feedback - obstacle flashes white
      this.tweens.add({
        targets: this.obstacle,
        fillColor: 0xffffff,
        duration: 100,
        yoyo: true,
        onComplete: () => {
          // If obstacle health <= 0, destroy it
          if (this.obstacleHealth <= 0) {
            this.obstacle.destroy();
            this.obstacleHealthText.destroy();

            // Create a victory message
            const victoryText = this.add.text(400, 300, "OBSTACLE DESTROYED!", {
              fontSize: "32px",
              color: "#fff",
              backgroundColor: "#000",
            });
            victoryText.setOrigin(0.5);

            // Make it fade out after a few seconds
            this.tweens.add({
              targets: victoryText,
              alpha: 0,
              delay: 2000,
              duration: 1000,
            });
          }
        },
      });
    }
  }

  handleProjectileHit(
    projectile: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    enemy: Phaser.Types.Physics.Arcade.GameObjectWithBody
  ) {
    // Apply damage to enemy
    (enemy as any).health -= 2;

    // Destroy the projectile
    projectile.destroy();

    // Visual feedback - enemy flashes white
    this.tweens.add({
      targets: enemy,
      fillColor: 0xffffff,
      duration: 100,
      yoyo: true,
      onComplete: () => {
        // If enemy health <= 0, destroy it
        if ((enemy as any).health <= 0) {
          enemy.destroy();
        }
      },
    });

    // Apply knockback
    const knockbackForce = 150;
    const direction = (projectile as any).direction;
    (enemy.body as Phaser.Physics.Arcade.Body).setVelocityX(
      knockbackForce * direction
    );
    (enemy.body as Phaser.Physics.Arcade.Body).setVelocityY(-80);
  }

  handleProjectileObstacleHit(
    projectile: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    _obstacle: Phaser.Types.Physics.Arcade.GameObjectWithBody
  ) {
    const currentTime = this.time.now;

    // Only register a hit if not in cooldown
    if (
      this.obstacleHealth > 0 &&
      currentTime - this.lastHitTime > this.hitCooldown
    ) {
      // Apply damage to obstacle
      const damage = 8; // Projectile damage
      this.obstacleHealth -= damage;

      // Update last hit time
      this.lastHitTime = currentTime;

      // Update health text
      this.obstacleHealthText.setText(`HP: ${this.obstacleHealth}`);

      // Create floating damage text
      this.createFloatingDamageText(
        this.obstacle.x,
        this.obstacle.y - 50,
        damage
      );

      // Apply knockback effect based on projectile direction
      const knockbackDistance = 5; // Pixels to move
      const direction = (projectile as any).direction;
      const originalX = this.obstacle.x;

      // First knockback tween - move in the direction of the hit
      this.tweens.add({
        targets: [this.obstacle, this.obstacleHealthText],
        x: originalX + knockbackDistance * direction,
        duration: 50,
        ease: "Power1",
        onComplete: () => {
          // Second tween - return to original position
          this.tweens.add({
            targets: [this.obstacle, this.obstacleHealthText],
            x: originalX,
            duration: 150,
            ease: "Elastic.easeOut",
          });
        },
      });

      // Visual feedback - obstacle flashes white
      this.tweens.add({
        targets: this.obstacle,
        fillColor: 0xffffff,
        duration: 100,
        yoyo: true,
        onComplete: () => {
          // If obstacle health <= 0, destroy it
          if (this.obstacleHealth <= 0) {
            this.obstacle.destroy();
            this.obstacleHealthText.destroy();

            // Create a victory message
            const victoryText = this.add.text(400, 300, "OBSTACLE DESTROYED!", {
              fontSize: "32px",
              color: "#fff",
              backgroundColor: "#000",
            });
            victoryText.setOrigin(0.5);

            // Make it fade out after a few seconds
            this.tweens.add({
              targets: victoryText,
              alpha: 0,
              delay: 2000,
              duration: 1000,
            });
          }
        },
      });
    }

    // Destroy the projectile
    projectile.destroy();
  }

  createFloatingDamageText(x: number, y: number, damage: number) {
    // Create a text object for the damage
    const damageText = this.add.text(x, y, damage.toString(), {
      fontSize: "24px",
      color: "#ff0000",
      fontStyle: "bold",
    });
    damageText.setOrigin(0.5);

    // Add to our array to keep track of it
    this.damageTexts.push(damageText);

    // Animate the damage text floating up and fading out
    this.tweens.add({
      targets: damageText,
      y: y - 50,
      alpha: 0,
      duration: 1000,
      onComplete: () => {
        // Remove from array and destroy when animation completes
        const index = this.damageTexts.indexOf(damageText);
        if (index > -1) {
          this.damageTexts.splice(index, 1);
        }
        damageText.destroy();
      },
    });
  }

  createPlayerAnimations() {
    // Create idle animation (frames 0-3)
    this.anims.create({
      key: ANIM_IDLE,
      frames: this.anims.generateFrameNumbers(playerSpriteName, {
        start: 0,
        end: 3,
      }),
      frameRate: 8,
      repeat: -1, // -1 means loop forever
    });

    // Create run animation (frames 8-13)
    this.anims.create({
      key: ANIM_RUN,
      frames: this.anims.generateFrameNumbers(playerSpriteName, {
        start: 8,
        end: 13,
      }),
      frameRate: 10,
      repeat: -1,
    });

    // Create jump animation (frames 14-17)
    this.anims.create({
      key: ANIM_JUMP,
      frames: this.anims.generateFrameNumbers(playerSpriteName, {
        start: 14,
        end: 17,
      }),
      frameRate: 10,
      repeat: 0, // Don't repeat (play once)
    });

    // Create fall animation (frames 22-23)
    this.anims.create({
      key: ANIM_FALL,
      frames: this.anims.generateFrameNumbers(playerSpriteName, {
        start: 22,
        end: 23,
      }),
      frameRate: 5,
      repeat: -1,
    });

    // Create double jump animation (frames 16-19 - somersault/spin)
    this.anims.create({
      key: ANIM_DOUBLE_JUMP,
      frames: this.anims.generateFrameNumbers(playerSpriteName, {
        start: 16,
        end: 19,
      }),
      frameRate: 12,
      repeat: 0,
    });

    // Create attack animations
    // Attack 1 (frames 42-47)
    this.anims.create({
      key: ANIM_ATTACK1,
      frames: this.anims.generateFrameNumbers(playerSpriteName, {
        start: 42,
        end: 47,
      }),
      frameRate: 15,
      repeat: 0,
    });

    // Attack 2 (frames 48-53)
    this.anims.create({
      key: ANIM_ATTACK2,
      frames: this.anims.generateFrameNumbers(playerSpriteName, {
        start: 48,
        end: 53,
      }),
      frameRate: 15,
      repeat: 0,
    });

    // Attack 3 (frames 54-59)
    this.anims.create({
      key: ANIM_ATTACK3,
      frames: this.anims.generateFrameNumbers(playerSpriteName, {
        start: 54,
        end: 59,
      }),
      frameRate: 15,
      repeat: 0,
    });

    // Create shoot animation (using bow frames 69-72)
    this.anims.create({
      key: ANIM_SHOOT,
      frames: this.anims.generateFrameNumbers(playerSpriteName, {
        start: 69,
        end: 72,
      }),
      frameRate: 15,
      repeat: 0,
    });
  }

  handleGroundCollision() {
    // When the player touches the ground, allow jumping again
    this.canJump = true;
    this.isJumping = false;
    this.hasDoubleJump = true; // Reset double jump when touching ground
  }

  performAttack(comboLevel: number) {
    if (this.isAttacking || this.attackCooldown) return;

    // Set attacking state
    this.isAttacking = true;
    this.attackCooldown = true;

    // Determine which attack animation to play based on combo level
    let attackAnim = ANIM_ATTACK1;
    if (comboLevel === 2) attackAnim = ANIM_ATTACK2;
    else if (comboLevel === 3) attackAnim = ANIM_ATTACK3;

    // Play the attack animation
    this.player.anims.play(attackAnim);

    // Position the attack hitbox based on player direction
    const hitboxOffsetX = this.facingLeft ? -40 : 40;
    this.attackHitbox.x = this.player.x + hitboxOffsetX;
    this.attackHitbox.y = this.player.y;

    // Reset attack state when animation completes
    this.player.once("animationcomplete", () => {
      this.isAttacking = false;

      // Reset to idle animation if on ground and not moving
      if (!this.isJumping && Math.abs(this.player.body!.velocity.x) < 50) {
        this.player.anims.play(ANIM_IDLE, true);
      } else if (this.isJumping && this.player.body!.velocity.y > 0) {
        this.player.anims.play(ANIM_FALL, true);
      }

      // Reset attack cooldown after a short delay
      this.time.delayedCall(200, () => {
        this.attackCooldown = false;
      });
    });
  }

  shootProjectile() {
    if (this.isShooting || this.shootCooldown) return;

    // Set shooting state
    this.isShooting = true;
    this.shootCooldown = true;

    // Play the shoot animation
    this.player.anims.play(ANIM_SHOOT);

    // Create a projectile after a short delay (when animation reaches the "release" frame)
    this.time.delayedCall(200, () => {
      // Create projectile at player position
      const direction = this.facingLeft ? -1 : 1;
      const offsetX = this.facingLeft ? -20 : 20;

      const projectile = this.projectiles.get(
        this.player.x + offsetX,
        this.player.y - 5
      ) as Phaser.Physics.Arcade.Sprite;

      if (projectile) {
        projectile.setActive(true);
        projectile.setVisible(true);

        // Set projectile properties
        projectile.setScale(1.5);
        (projectile as any).direction = direction; // Store direction for hit handling
        projectile.setVelocityX(direction * 600); // Fast horizontal velocity

        // Flip projectile based on direction
        projectile.setFlipX(this.facingLeft);

        // Set the projectile color to brown
        projectile.setTint(0x8b4513);

        // Destroy projectile after 1.5 seconds if it hasn't hit anything
        this.time.delayedCall(1500, () => {
          if (projectile.active) {
            projectile.destroy();
          }
        });
      }
    });

    // Reset shooting state when animation completes
    this.player.once("animationcomplete", () => {
      this.isShooting = false;

      // Reset to idle animation if on ground and not moving
      if (!this.isJumping && Math.abs(this.player.body!.velocity.x) < 50) {
        this.player.anims.play(ANIM_IDLE, true);
      } else if (this.isJumping && this.player.body!.velocity.y > 0) {
        this.player.anims.play(ANIM_FALL, true);
      }

      // Reset shoot cooldown after a delay
      this.time.delayedCall(400, () => {
        this.shootCooldown = false;
      });
    });
  }

  update(time: number) {
    // The update method runs on every frame of the game loop
    // This is where you put game logic that needs to run continuously
    // It's called approximately 60 times per second depending on performance

    // Skip movement controls if attacking or shooting
    if (!this.isAttacking && !this.isShooting) {
      // Check for horizontal movement
      if (this.cursors.left.isDown) {
        // Move left with acceleration for smoother movement
        this.player.setVelocityX(
          Math.max(this.player.body!.velocity.x - 20, -300)
        );

        // Play the run animation if not jumping
        if (!this.isJumping) {
          this.player.anims.play(ANIM_RUN, true);
        }

        // Flip sprite to face left
        this.player.setFlipX(true);
        this.facingLeft = true;
      } else if (this.cursors.right.isDown) {
        // Move right with acceleration for smoother movement
        this.player.setVelocityX(
          Math.min(this.player.body!.velocity.x + 20, 300)
        );

        // Play the run animation if not jumping
        if (!this.isJumping) {
          this.player.anims.play(ANIM_RUN, true);
        }

        // Make sure sprite is facing right
        this.player.setFlipX(false);
        this.facingLeft = false;
      } else {
        // Slow down naturally when not pressing keys
        if (Math.abs(this.player.body!.velocity.x) < 10) {
          this.player.setVelocityX(0);
        } else if (this.player.body!.velocity.x > 0) {
          this.player.setVelocityX(this.player.body!.velocity.x - 10);
        } else {
          this.player.setVelocityX(this.player.body!.velocity.x + 10);
        }

        // Play the idle animation if not jumping and nearly stopped
        if (!this.isJumping && Math.abs(this.player.body!.velocity.x) < 50) {
          this.player.anims.play(ANIM_IDLE, true);
        }
      }

      // Check if player is falling
      if (this.isJumping && this.player.body!.velocity.y > 100) {
        this.player.anims.play(ANIM_FALL, true);
      }
    }

    // Track if jump key has been released (needed for double jump)
    if (!this.cursors.jump.isDown) {
      this.jumpReleased = true;
    }

    // Check for jump - only allow jumping when on the ground and not attacking/shooting
    if (
      this.cursors.jump.isDown &&
      this.jumpReleased &&
      !this.isAttacking &&
      !this.isShooting
    ) {
      if (this.canJump) {
        // First jump
        this.player.setVelocityY(-600);
        this.isJumping = true;
        this.canJump = false;
        this.jumpReleased = false;

        // Play jump animation
        this.player.anims.play(ANIM_JUMP);

        // When jump animation completes, switch to fall animation
        this.player.on("animationcomplete-" + ANIM_JUMP, () => {
          this.player.anims.play(ANIM_FALL);
        });
      } else if (this.hasDoubleJump) {
        // Double jump (Genji style)
        this.player.setVelocityY(-500); // Slightly less powerful than first jump
        this.hasDoubleJump = false;
        this.jumpReleased = false;

        // Play double jump animation (somersault)
        this.player.anims.play(ANIM_DOUBLE_JUMP);

        // When double jump animation completes, switch to fall animation
        this.player.on("animationcomplete-" + ANIM_DOUBLE_JUMP, () => {
          this.player.anims.play(ANIM_FALL);
        });
      }
    }

    // If the player is moving horizontally while jumping, add some horizontal boost
    if (this.isJumping && !this.isAttacking && !this.isShooting) {
      if (this.cursors.left.isDown) {
        this.player.setVelocityX(
          Math.max(this.player.body!.velocity.x - 5, -350)
        );
      } else if (this.cursors.right.isDown) {
        this.player.setVelocityX(
          Math.min(this.player.body!.velocity.x + 5, 350)
        );
      }
    }

    // Check for attack inputs
    if (!this.isAttacking && !this.attackCooldown && !this.isShooting) {
      if (this.cursors.attack.isDown) {
        // Check if this is part of a combo
        const timeSinceLastAttack = time - this.lastAttackTime;

        if (timeSinceLastAttack < 500 && this.attackCombo < 3) {
          // Continue combo
          this.attackCombo++;
        } else {
          // Start new combo
          this.attackCombo = 1;
        }

        this.lastAttackTime = time;
        this.performAttack(this.attackCombo);
      } else if (this.cursors.attack2.isDown) {
        // Direct attack 2
        this.performAttack(2);
        this.attackCombo = 2;
        this.lastAttackTime = time;
      } else if (this.cursors.attack3.isDown) {
        // Direct attack 3
        this.performAttack(3);
        this.attackCombo = 3;
        this.lastAttackTime = time;
      }
    }

    // Check for shoot input
    if (
      !this.isShooting &&
      !this.shootCooldown &&
      !this.isAttacking &&
      this.cursors.shoot.isDown
    ) {
      this.shootProjectile();
    }

    // Reset combo if too much time has passed since last attack
    if (time - this.lastAttackTime > 1000) {
      this.attackCombo = 0;
    }
  }
}

// This object contains all the settings for our game
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO, // Let Phaser choose the best renderer (WebGL or Canvas)
  width: 800, // Game width in pixels
  height: 600, // Game height in pixels
  scene: [MainScene],
  backgroundColor: "#FFFFFF",
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
