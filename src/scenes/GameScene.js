import Phaser from 'phaser'
import ChessPiece from '../gameObjects/ChessPiece.js'
import GameMap from '../gameObjects/GameMap.js'

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
    this.mapWidth = 10;
    this.mapHeight = 8;
    this.tileSize = 80;
    this.currentPlayer = 1;
    this.selectedPiece = null;
    this.validMoves = [];
    this.validAttacks = [];
    this.pieces = [];
    this.gameState = 'selecting';
    this.offsetX = 0;
    this.offsetY = 0;
    this.highlights = [];
    this.gameMap = null;
  }

  create() {
    this.calculateCenterOffset();
    this.createBackground();
    this.createMap();
    this.createPieces();
    this.createUI();
    this.createTurnIndicator();
    this.createGameInfo();
    this.setupInput();
  }

  calculateCenterOffset() {
    const mapWidthPx = this.mapWidth * this.tileSize;
    const mapHeightPx = this.mapHeight * this.tileSize;
    const uiWidth = 300;
    const infoWidth = 200;
    const totalWidth = mapWidthPx + uiWidth + infoWidth + 200; // 增加总间距到200
    
    // 重新计算偏移量，确保所有元素都能显示
    this.offsetX = (this.cameras.main.width - totalWidth) / 2 + infoWidth + 50; // 游戏说明离棋盘50px
    this.offsetY = (this.cameras.main.height - mapHeightPx) / 2;
  }

  createBackground() {
    const graphics = this.add.graphics();
    graphics.fillGradientStyle(0x1a1a2e, 0x16213e, 0x0f3460, 0x533483, 1);
    graphics.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);
  }

  createMap() {
    this.gameMap = new GameMap(
      this, 
      this.mapWidth, 
      this.mapHeight, 
      this.tileSize, 
      this.offsetX, 
      this.offsetY
    );
    this.gameMap.create();
  }

  createPieces() {
    // 玩家1的棋子（蓝色方）
    this.pieces.push(new ChessPiece(this, 0, 0, 'warrior', 1, this.offsetX, this.offsetY));
    this.pieces.push(new ChessPiece(this, 1, 0, 'archer', 1, this.offsetX, this.offsetY));
    this.pieces.push(new ChessPiece(this, 2, 0, 'mage', 1, this.offsetX, this.offsetY));
    this.pieces.push(new ChessPiece(this, 3, 0, 'tank', 1, this.offsetX, this.offsetY));
    this.pieces.push(new ChessPiece(this, 4, 0, 'knight', 1, this.offsetX, this.offsetY));
    
    // 玩家2的棋子（红色方）
    this.pieces.push(new ChessPiece(this, 5, 7, 'warrior', 2, this.offsetX, this.offsetY));
    this.pieces.push(new ChessPiece(this, 6, 7, 'archer', 2, this.offsetX, this.offsetY));
    this.pieces.push(new ChessPiece(this, 7, 7, 'mage', 2, this.offsetX, this.offsetY));
    this.pieces.push(new ChessPiece(this, 8, 7, 'tank', 2, this.offsetX, this.offsetY));
    this.pieces.push(new ChessPiece(this, 9, 7, 'knight', 2, this.offsetX, this.offsetY));
  }

  createUI() {
    const uiX = this.offsetX + this.mapWidth * this.tileSize + 200; // 增加间距到100px避免重叠
    const uiY = this.offsetY + this.mapHeight * this.tileSize / 2;
    
    // 创建UI面板背景
    this.uiPanel = this.add.rectangle(
      uiX,
      uiY,
      280,
      this.mapHeight * this.tileSize,
      0x333333,
      0.9
    );
    this.uiPanel.setStrokeStyle(3, 0x666666);
    
    // 游戏标题
    this.gameTitle = this.add.text(
      uiX,
      uiY - 300,
      '战棋游戏',
      {
        fontSize: '28px',
        color: '#ffffff',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3
      }
    );
    this.gameTitle.setOrigin(0.5);
    
    // 结束回合按钮
    this.endTurnButton = this.add.rectangle(
      uiX,
      uiY + 100,
      200,
      50,
      0x4CAF50
    );
    this.endTurnButton.setStrokeStyle(3, 0x45a049);
    
    this.endTurnText = this.add.text(
      uiX,
      uiY + 100,
      '结束回合',
      {
        fontSize: '18px',
        color: '#ffffff',
        fontStyle: 'bold'
      }
    );
    this.endTurnText.setOrigin(0.5);
    
    this.endTurnButton.setInteractive();
    this.endTurnButton.on('pointerdown', () => {
      this.endTurn();
    });
    
    // 重置游戏按钮
    this.resetButton = this.add.rectangle(
      uiX,
      uiY + 170,
      200,
      50,
      0xf44336
    );
    this.resetButton.setStrokeStyle(3, 0xd32f2f);
    
    this.resetText = this.add.text(
      uiX,
      uiY + 170,
      '重置游戏',
      {
        fontSize: '18px',
        color: '#ffffff',
        fontStyle: 'bold'
      }
    );
    this.resetText.setOrigin(0.5);
    
    this.resetButton.setInteractive();
    this.resetButton.on('pointerdown', () => {
      this.resetGame();
    });
    
    // 返回登录按钮
    this.backButton = this.add.rectangle(
      uiX,
      uiY + 240,
      200,
      50,
      0x2196F3
    );
    this.backButton.setStrokeStyle(3, 0x1976D2);
    
    this.backText = this.add.text(
      uiX,
      uiY + 240,
      '返回登录',
      {
        fontSize: '18px',
        color: '#ffffff',
        fontStyle: 'bold'
      }
    );
    this.backText.setOrigin(0.5);
    
    this.backButton.setInteractive();
    this.backButton.on('pointerdown', () => {
      this.scene.start('LoginScene');
    });
  }

  createTurnIndicator() {
    this.turnIndicator = this.add.text(
      this.cameras.main.centerX,
      this.offsetY - 80,
      `玩家${this.currentPlayer}回合`,
      {
        fontSize: '32px',
        color: this.currentPlayer === 1 ? '#4169E1' : '#ff4444',
        fontStyle: 'bold',
        stroke: '#ffffff',
        strokeThickness: 4
      }
    );
    this.turnIndicator.setOrigin(0.5);
  }

  createGameInfo() {
    const infoX = this.offsetX - 250; // 游戏说明离棋盘50px距离
    const infoY = this.offsetY + 100;
    
    // 游戏信息面板
    this.infoPanel = this.add.rectangle(
      infoX,
      infoY,
      180,
      300,
      0x333333,
      0.9
    );
    this.infoPanel.setStrokeStyle(3, 0x666666);
    
    // 游戏说明
    const instructions = [
      '游戏说明:',
      '1. 点击己方棋子选择',
      '2. 绿色格子可移动',
      '3. 红色格子可攻击',
      '4. 每回合可移动一次',
      '5. 每回合可攻击一次',
      '',
      '棋子类型:',
      '战士: 近战，高防御',
      '弓箭手: 远程，高攻击',
      '法师: 中程，魔法攻击',
      '坦克: 高血量，高防御',
      '骑士: 高移动力'
    ];
    
    instructions.forEach((text, index) => {
      const color = index === 0 || index === 7 ? '#ffff00' : '#ffffff';
      const fontSize = index === 0 || index === 7 ? '14px' : '12px';
      
      this.add.text(
        infoX,
        infoY - 120 + index * 20,
        text,
        {
          fontSize: fontSize,
          color: color,
          fontStyle: 'bold'
        }
      ).setOrigin(0.5);
    });
  }

  setupInput() {
    this.input.on('pointerdown', (pointer) => {
      const tilePos = this.gameMap.worldToTilePosition(pointer.x, pointer.y);
      
      if (this.gameMap.isValidPosition(tilePos.x, tilePos.y)) {
        this.handleTileClick(tilePos.x, tilePos.y);
      }
    });
  }

  handleTileClick(x, y) {
    const piece = this.getPieceAt(x, y);
    
    if (this.gameState === 'selecting') {
      if (piece && piece.playerId === this.currentPlayer) {
        this.selectPiece(piece);
      }
    } else if (this.gameState === 'moving') {
      if (this.isValidMove(x, y)) {
        this.movePiece(x, y);
        // 移动后检查是否还能攻击
        if (this.selectedPiece && this.selectedPiece.canAttack()) {
          this.showValidAttacks();
          this.gameState = 'attacking';
        } else {
          this.clearSelection();
        }
      } else if (this.isValidAttack(x, y)) {
        this.attackPiece(x, y);
      } else if (piece && piece.playerId === this.currentPlayer) {
        this.selectPiece(piece);
      } else {
        this.clearSelection();
      }
    } else if (this.gameState === 'attacking') {
      if (this.isValidAttack(x, y)) {
        this.attackPiece(x, y);
      } else if (piece && piece.playerId === this.currentPlayer) {
        this.selectPiece(piece);
      } else {
        this.clearSelection();
      }
    }
  }

  selectPiece(piece) {
    this.selectedPiece = piece;
    this.showValidMoves();
    this.showValidAttacks();
    this.gameState = 'moving';
    
    // 高亮选中的棋子
    piece.highlight();
  }

  showValidMoves() {
    this.clearHighlights();
    
    if (!this.selectedPiece || !this.selectedPiece.canMove()) return;
    
    const piece = this.selectedPiece;
    this.validMoves = [];
    
    for (let dx = -piece.stats.moveRange; dx <= piece.stats.moveRange; dx++) {
      for (let dy = -piece.stats.moveRange; dy <= piece.stats.moveRange; dy++) {
        const newX = piece.x + dx;
        const newY = piece.y + dy;
        
        if (this.gameMap.isValidPosition(newX, newY) && 
            !this.getPieceAt(newX, newY) &&
            Math.abs(dx) + Math.abs(dy) <= piece.stats.moveRange) {
          
          this.validMoves.push({x: newX, y: newY});
          const highlight = this.gameMap.highlightTile(newX, newY, 0x00ff00, 0.4);
          if (highlight) this.highlights.push(highlight);
        }
      }
    }
  }

  showValidAttacks() {
    if (!this.selectedPiece || !this.selectedPiece.canAttack()) {
      console.log('无法攻击：', !this.selectedPiece ? '没有选中棋子' : '已经攻击过了');
      return;
    }
    
    const piece = this.selectedPiece;
    this.validAttacks = [];
    
    console.log(`检查 ${piece.stats.name} 的攻击范围，范围: ${piece.stats.range}`);
    
    for (let dx = -piece.stats.range; dx <= piece.stats.range; dx++) {
      for (let dy = -piece.stats.range; dy <= piece.stats.range; dy++) {
        const targetX = piece.x + dx;
        const targetY = piece.y + dy;
        
        if (this.gameMap.isValidPosition(targetX, targetY)) {
          const targetPiece = this.getPieceAt(targetX, targetY);
          if (targetPiece && targetPiece.playerId !== piece.playerId) {
            this.validAttacks.push({x: targetX, y: targetY});
            const highlight = this.gameMap.highlightTile(targetX, targetY, 0xff0000, 0.4);
            if (highlight) this.highlights.push(highlight);
            console.log(`找到可攻击目标: ${targetPiece.stats.name} 在 (${targetX}, ${targetY})`);
          }
        }
      }
    }
    
    console.log(`总共找到 ${this.validAttacks.length} 个可攻击目标`);
  }

  isValidMove(x, y) {
    return this.validMoves.some(move => move.x === x && move.y === y);
  }

  isValidAttack(x, y) {
    const isValid = this.validAttacks.some(attack => attack.x === x && attack.y === y);
    if (isValid) {
      console.log(`确认可以攻击位置 (${x}, ${y})`);
    }
    return isValid;
  }

  movePiece(x, y) {
    if (this.selectedPiece) {
      // 更新棋子位置
      this.selectedPiece.updatePosition(x, y);
      this.selectedPiece.hasMoved = true;
      
      // 重新计算攻击范围（因为位置改变了）
      this.showValidAttacks();
    }
  }

  attackPiece(x, y) {
    if (this.selectedPiece) {
      const targetPiece = this.getPieceAt(x, y);
      if (targetPiece) {
        console.log(`${this.selectedPiece.stats.name} 攻击 ${targetPiece.stats.name}`);
        console.log(`攻击力: ${this.selectedPiece.stats.attack}, 防御力: ${targetPiece.stats.defense}`);
        
        const isDead = targetPiece.takeDamage(this.selectedPiece.stats.attack);
        this.selectedPiece.hasAttacked = true;
        
        if (isDead) {
          console.log(`${targetPiece.stats.name} 被击败！`);
          this.removePiece(targetPiece);
        } else {
          console.log(`${targetPiece.stats.name} 剩余血量: ${targetPiece.currentHp}`);
        }
        
        this.clearSelection();
        this.gameState = 'selecting';
      }
    }
  }

  removePiece(piece) {
    const index = this.pieces.indexOf(piece);
    if (index > -1) {
      this.pieces.splice(index, 1);
      piece.destroy();
    }
    
    this.checkGameEnd();
  }

  checkGameEnd() {
    const player1Pieces = this.pieces.filter(p => p.playerId === 1);
    const player2Pieces = this.pieces.filter(p => p.playerId === 2);
    
    if (player1Pieces.length === 0) {
      this.endGame(2);
    } else if (player2Pieces.length === 0) {
      this.endGame(1);
    }
  }

  endGame(winner) {
    const winnerText = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY,
      `玩家${winner}获胜！`,
      {
        fontSize: '64px',
        color: winner === 1 ? '#4169E1' : '#ff4444',
        fontStyle: 'bold',
        stroke: '#ffffff',
        strokeThickness: 6
      }
    );
    winnerText.setOrigin(0.5);
    
    // 添加胜利动画
    this.scene.tweens.add({
      targets: winnerText,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    setTimeout(() => {
      this.scene.start('LoginScene');
    }, 5000);
  }

  endTurn() {
    this.pieces.forEach(piece => {
      piece.resetTurn();
    });
    
    this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
    this.turnIndicator.setText(`玩家${this.currentPlayer}回合`);
    this.turnIndicator.setColor(this.currentPlayer === 1 ? '#4169E1' : '#ff4444');
    
    this.clearSelection();
    this.gameState = 'selecting';
  }

  resetGame() {
    this.scene.restart();
  }

  clearSelection() {
    if (this.selectedPiece) {
      this.selectedPiece.unhighlight();
    }
    
    this.selectedPiece = null;
    this.clearHighlights();
    this.gameState = 'selecting';
  }

  clearHighlights() {
    this.validMoves = [];
    this.validAttacks = [];
    
    this.highlights.forEach(highlight => {
      if (highlight && highlight.destroy) {
        highlight.destroy();
      }
    });
    this.highlights = [];
  }

  getPieceAt(x, y) {
    return this.pieces.find(piece => piece.x === x && piece.y === y);
  }
} 