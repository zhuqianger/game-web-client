
export default class ChessPiece {
  constructor(scene, x, y, type, playerId, offsetX, offsetY) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.type = type;
    this.playerId = playerId;
    this.sprite = null;
    this.offsetX = offsetX;
    this.offsetY = offsetY;
    
    // 棋子属性
    this.stats = this.getStatsByType(type);
    this.currentHp = this.stats.hp;
    this.maxHp = this.stats.hp;
    this.hasMoved = false;
    this.hasAttacked = false;
    
    this.createSprite();
  }
  
  getStatsByType(type) {
    const stats = {
      'warrior': { hp: 120, attack: 30, defense: 20, range: 1, moveRange: 3, name: '战士', color: 0x4169E1 },
      'archer': { hp: 90, attack: 35, defense: 10, range: 4, moveRange: 2, name: '弓箭手', color: 0x32CD32 },
      'mage': { hp: 80, attack: 40, defense: 8, range: 3, moveRange: 2, name: '法师', color: 0x9932CC },
      'tank': { hp: 180, attack: 25, defense: 30, range: 1, moveRange: 2, name: '坦克', color: 0x8B4513 },
      'knight': { hp: 100, attack: 35, defense: 15, range: 1, moveRange: 4, name: '骑士', color: 0xFFD700 }
    };
    return stats[type] || stats['warrior'];
  }
  
  createSprite() {
    const color = this.playerId === 1 ? this.stats.color : 0xff4444;
    const borderColor = this.playerId === 1 ? 0x0000ff : 0xff0000;
    
    // 创建棋子主体
    this.sprite = this.scene.add.circle(
      this.x * 80 + this.offsetX + 40, 
      this.y * 80 + this.offsetY + 40, 
      25, 
      color
    );
    
    // 添加边框
    this.sprite.setStrokeStyle(3, borderColor);
    
    // 添加血量条
    this.createHealthBar();
    
    // 添加类型标识
    this.createTypeLabel();
    
    // 添加攻击力标识
    this.createAttackLabel();
  }
  
  createHealthBar() {
    const barWidth = 50;
    const barHeight = 6;
    const barX = this.x * 80 + this.offsetX + 15;
    const barY = this.y * 80 + this.offsetY + 10;
    
    // 背景条
    this.healthBarBg = this.scene.add.rectangle(
      barX + barWidth/2, 
      barY + barHeight/2, 
      barWidth, 
      barHeight, 
      0x000000, 
      0.8
    );
    
    // 血量条
    this.healthBar = this.scene.add.rectangle(
      barX + barWidth/2, 
      barY + barHeight/2, 
      barWidth, 
      barHeight, 
      0x00ff00
    );
    
    this.updateHealthBar();
  }
  
  createTypeLabel() {
    this.typeLabel = this.scene.add.text(
      this.x * 80 + this.offsetX + 40, 
      this.y * 80 + this.offsetY + 65, 
      this.stats.name, 
      {
        fontSize: '12px',
        color: '#ffffff',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 2
      }
    );
    this.typeLabel.setOrigin(0.5);
  }
  
  createAttackLabel() {
    this.attackLabel = this.scene.add.text(
      this.x * 80 + this.offsetX + 40, 
      this.y * 80 + this.offsetY + 20, 
      `${this.stats.attack}`, 
      {
        fontSize: '14px',
        color: '#ffff00',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 2
      }
    );
    this.attackLabel.setOrigin(0.5);
  }
  
  updateHealthBar() {
    const healthPercent = this.currentHp / this.maxHp;
    const barWidth = 50;
    this.healthBar.width = barWidth * healthPercent;
    
    // 根据血量改变颜色
    if (healthPercent > 0.6) {
      this.healthBar.setFillStyle(0x00ff00);
    } else if (healthPercent > 0.3) {
      this.healthBar.setFillStyle(0xffff00);
    } else {
      this.healthBar.setFillStyle(0xff0000);
    }
  }
  
  takeDamage(damage) {
    const actualDamage = Math.max(1, damage - this.stats.defense);
    this.currentHp = Math.max(0, this.currentHp - actualDamage);
    this.updateHealthBar();
    
    // 显示伤害数字
    this.showDamageText(actualDamage);
    
    // 受伤闪烁效果
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0.5,
      duration: 100,
      yoyo: true,
      repeat: 2
    });
    
    return this.currentHp <= 0;
  }
  
  showDamageText(damage) {
    const damageText = this.scene.add.text(
      this.x * 80 + this.offsetX + 40, 
      this.y * 80 + this.offsetY + 15, 
      `-${damage}`, 
      {
        fontSize: '18px',
        color: '#ff0000',
        fontStyle: 'bold',
        stroke: '#ffffff',
        strokeThickness: 2
      }
    );
    damageText.setOrigin(0.5);
    
    // 伤害数字动画
    this.scene.tweens.add({
      targets: damageText,
      y: damageText.y - 40,
      alpha: 0,
      duration: 1200,
      ease: 'Power2',
      onComplete: () => {
        damageText.destroy();
      }
    });
  }
  
  canMove() {
    return !this.hasMoved;
  }
  
  canAttack() {
    return !this.hasAttacked;
  }
  
  resetTurn() {
    this.hasMoved = false;
    this.hasAttacked = false;
  }
  
  // 更新棋子位置（移动时调用）
  updatePosition(x, y) {
    this.x = x;
    this.y = y;
    
    // 更新精灵位置
    this.sprite.x = x * 80 + this.offsetX + 40;
    this.sprite.y = y * 80 + this.offsetY + 40;
    
    // 更新UI元素位置
    this.healthBar.x = x * 80 + this.offsetX + 15 + 25;
    this.healthBar.y = y * 80 + this.offsetY + 10 + 3;
    this.healthBarBg.x = x * 80 + this.offsetX + 15 + 25;
    this.healthBarBg.y = y * 80 + this.offsetY + 10 + 3;
    this.typeLabel.x = x * 80 + this.offsetX + 40;
    this.typeLabel.y = y * 80 + this.offsetY + 65;
    this.attackLabel.x = x * 80 + this.offsetX + 40;
    this.attackLabel.y = y * 80 + this.offsetY + 20;
  }
  
  // 高亮选中效果
  highlight() {
    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 200,
      ease: 'Power2'
    });
  }
  
  // 取消高亮
  unhighlight() {
    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: 1,
      scaleY: 1,
      duration: 200,
      ease: 'Power2'
    });
  }
  
  destroy() {
    if (this.sprite) this.sprite.destroy();
    if (this.healthBar) this.healthBar.destroy();
    if (this.healthBarBg) this.healthBarBg.destroy();
    if (this.typeLabel) this.typeLabel.destroy();
    if (this.attackLabel) this.attackLabel.destroy();
  }
} 