import Phaser from "phaser";

// Game settings that can be modified
export interface GameSettings {
  // Player movement
  playerSpeed: number;
  playerJumpForce: number;
  playerDoubleJumpForce: number;
  playerGravity: number;
  
  // Combat
  projectileSpeed: number;
  projectileDamage: number;
  attackDamage: {
    attack1: number;
    attack2: number;
    attack3: number;
  };
  hitCooldown: number;
  
  // Game physics
  gravity: number;
  friction: number;
  bounce: number;
  
  // Enemy settings
  enemyHealth: number;
  obstacleHealth: number;
}

// Default game settings
export const defaultSettings: GameSettings = {
  playerSpeed: 300,
  playerJumpForce: 600,
  playerDoubleJumpForce: 500,
  playerGravity: 1200,
  
  projectileSpeed: 600,
  projectileDamage: 8,
  attackDamage: {
    attack1: 5,
    attack2: 10,
    attack3: 15,
  },
  hitCooldown: 800,
  
  gravity: 1200,
  friction: 0.2,
  bounce: 0.1,
  
  enemyHealth: 3,
  obstacleHealth: 500,
};

// Current game settings (starts with defaults)
export let currentSettings: GameSettings = { ...defaultSettings };

// UI Scene to control game settings
export class UIScene extends Phaser.Scene {
  private controlPanel!: Phaser.GameObjects.Container;
  private sliders: { [key: string]: Phaser.GameObjects.Graphics } = {};
  private sliderValues: { [key: string]: number } = {};
  private sliderTexts: { [key: string]: Phaser.GameObjects.Text } = {};
  private isPanelVisible: boolean = false;
  private toggleButton!: Phaser.GameObjects.Text;
  
  constructor() {
    super({ key: 'UIScene', active: true });
  }
  
  create() {
    // Create a toggle button to show/hide the control panel
    this.toggleButton = this.add.text(10, 40, '⚙️ Controls', { 
      fontSize: '18px',
      backgroundColor: '#333',
      padding: { x: 10, y: 5 },
      color: '#fff'
    });
    this.toggleButton.setInteractive({ useHandCursor: true });
    this.toggleButton.on('pointerdown', () => this.toggleControlPanel());
    
    // Create the control panel (initially hidden)
    this.createControlPanel();
    this.controlPanel.setVisible(false);
  }
  
  private toggleControlPanel() {
    this.isPanelVisible = !this.isPanelVisible;
    this.controlPanel.setVisible(this.isPanelVisible);
    this.toggleButton.setText(this.isPanelVisible ? '❌ Close' : '⚙️ Controls');
  }
  
  private createControlPanel() {
    // Create a semi-transparent background panel
    this.controlPanel = this.add.container(20, 80);
    
    const panelBg = this.add.graphics();
    panelBg.fillStyle(0x000000, 0.7);
    panelBg.fillRoundedRect(0, 0, 300, 460, 10);
    this.controlPanel.add(panelBg);
    
    // Add title
    const title = this.add.text(150, 15, 'Game Controls', { 
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    title.setOrigin(0.5, 0);
    this.controlPanel.add(title);
    
    // Create sections with sliders
    let yPos = 50;
    
    // Player section
    yPos = this.createSection('Player', yPos);
    yPos = this.createSlider('playerSpeed', 'Speed', 100, 600, currentSettings.playerSpeed, yPos);
    yPos = this.createSlider('playerJumpForce', 'Jump Force', 300, 900, currentSettings.playerJumpForce, yPos);
    yPos = this.createSlider('playerDoubleJumpForce', 'Double Jump', 200, 800, currentSettings.playerDoubleJumpForce, yPos);
    
    // Combat section
    yPos = this.createSection('Combat', yPos + 10);
    yPos = this.createSlider('projectileSpeed', 'Projectile Speed', 200, 1000, currentSettings.projectileSpeed, yPos);
    yPos = this.createSlider('projectileDamage', 'Projectile Damage', 1, 20, currentSettings.projectileDamage, yPos);
    yPos = this.createSlider('attackDamage.attack1', 'Attack 1 Damage', 1, 20, currentSettings.attackDamage.attack1, yPos);
    yPos = this.createSlider('attackDamage.attack3', 'Attack 3 Damage', 5, 50, currentSettings.attackDamage.attack3, yPos);
    
    // Physics section
    yPos = this.createSection('Physics', yPos + 10);
    yPos = this.createSlider('gravity', 'Gravity', 600, 2000, currentSettings.gravity, yPos);
    yPos = this.createSlider('bounce', 'Bounce', 0, 0.5, currentSettings.bounce, yPos);
    
    // Reset button
    const resetButton = this.add.text(150, yPos + 20, 'Reset to Defaults', {
      fontSize: '16px',
      backgroundColor: '#aa0000',
      padding: { x: 10, y: 5 },
      color: '#ffffff'
    });
    resetButton.setOrigin(0.5, 0);
    resetButton.setInteractive({ useHandCursor: true });
    resetButton.on('pointerdown', () => this.resetToDefaults());
    this.controlPanel.add(resetButton);
  }
  
  private createSection(title: string, yPos: number): number {
    const sectionTitle = this.add.text(10, yPos, title, { 
      fontSize: '18px',
      color: '#ffff00',
      fontStyle: 'bold'
    });
    this.controlPanel.add(sectionTitle);
    
    const line = this.add.graphics();
    line.lineStyle(1, 0xffff00, 1);
    line.lineBetween(10, yPos + 22, 290, yPos + 22);
    this.controlPanel.add(line);
    
    return yPos + 30;
  }
  
  private createSlider(key: string, label: string, min: number, max: number, defaultValue: number, yPos: number): number {
    // Create label
    const labelText = this.add.text(10, yPos, label, { fontSize: '14px', color: '#ffffff' });
    this.controlPanel.add(labelText);
    
    // Create slider track
    const track = this.add.graphics();
    track.lineStyle(2, 0x666666, 1);
    track.lineBetween(10, yPos + 25, 220, yPos + 25);
    this.controlPanel.add(track);
    
    // Create slider handle
    const handle = this.add.graphics();
    this.sliders[key] = handle;
    this.sliderValues[key] = defaultValue;
    
    // Calculate initial handle position
    const handleX = 10 + ((defaultValue - min) / (max - min)) * 210;
    this.updateSliderHandle(key, handleX, yPos + 25);
    
    // Create value text
    const valueText = this.add.text(280, yPos + 15, defaultValue.toString(), { 
      fontSize: '14px',
      color: '#ffffff',
      align: 'right'
    });
    valueText.setOrigin(1, 0.5);
    this.controlPanel.add(valueText);
    this.sliderTexts[key] = valueText;
    
    // Make the slider interactive
    const hitArea = this.add.rectangle(115, yPos + 25, 220, 30, 0xffffff, 0);
    hitArea.setOrigin(0.5, 0.5);
    hitArea.setInteractive({ useHandCursor: true });
    this.controlPanel.add(hitArea);
    
    // Handle slider events
    hitArea.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const x = Phaser.Math.Clamp(pointer.x - this.controlPanel.x, 10, 220);
      const value = min + ((x - 10) / 210) * (max - min);
      this.updateSliderValue(key, value, min, max);
      this.updateSliderHandle(key, x, yPos + 25);
    });
    
    hitArea.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (pointer.isDown) {
        const x = Phaser.Math.Clamp(pointer.x - this.controlPanel.x, 10, 220);
        const value = min + ((x - 10) / 210) * (max - min);
        this.updateSliderValue(key, value, min, max);
        this.updateSliderHandle(key, x, yPos + 25);
      }
    });
    
    return yPos + 40;
  }
  
  private updateSliderHandle(key: string, x: number, y: number) {
    const handle = this.sliders[key];
    handle.clear();
    handle.fillStyle(0x00aaff, 1);
    handle.fillCircle(x, y, 8);
    this.controlPanel.add(handle);
  }
  
  private updateSliderValue(key: string, value: number, min: number, max: number) {
    // Format the value based on its range
    let formattedValue: number;
    if (max - min < 2) {
      // For small ranges like bounce (0-0.5), show more decimal places
      formattedValue = Math.round(value * 100) / 100;
    } else {
      // For larger ranges, round to integers
      formattedValue = Math.round(value);
    }
    
    // Update the slider text
    this.sliderTexts[key].setText(formattedValue.toString());
    
    // Update the current settings
    this.sliderValues[key] = formattedValue;
    this.updateGameSettings(key, formattedValue);
  }
  
  private updateGameSettings(key: string, value: number) {
    // Handle nested properties like attackDamage.attack1
    if (key.includes('.')) {
      const [parent, child] = key.split('.');
      (currentSettings as any)[parent][child] = value;
    } else {
      (currentSettings as any)[key] = value;
    }
    
    // Emit an event that the main scene can listen for
    this.events.emit('settingsChanged', currentSettings);
  }
  
  private resetToDefaults() {
    // Reset all values to defaults
    currentSettings = { ...defaultSettings };
    
    // Update all sliders
    for (const key in this.sliderValues) {
      let defaultValue: number;
      
      // Handle nested properties
      if (key.includes('.')) {
        const [parent, child] = key.split('.');
        defaultValue = (defaultSettings as any)[parent][child];
      } else {
        defaultValue = (defaultSettings as any)[key];
      }
      
      // Update slider visuals
      const min = key === 'bounce' ? 0 : (key.includes('Damage') ? 1 : 100);
      const max = key === 'bounce' ? 0.5 : (key.includes('Damage') ? 50 : 2000);
      const x = 10 + ((defaultValue - min) / (max - min)) * 210;
      
      this.updateSliderHandle(key, x, this.sliders[key].y);
      this.sliderTexts[key].setText(defaultValue.toString());
      this.sliderValues[key] = defaultValue;
    }
    
    // Emit the change event
    this.events.emit('settingsChanged', currentSettings);
  }
}
