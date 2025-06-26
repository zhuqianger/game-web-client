import Phaser from "phaser";
import ConfigManager from '../common/ConfigManager.js';
import OperationGuide from '../common/OperationGuide.js';

export default class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenuScene' });
    this.currentChapter = 1;
    this.currentLevel = 1;
    this.chapters = [];
    this.configManager = ConfigManager.getInstance();
  }

  async create() {
    // 加载配置
    await this.loadConfigs();
    
    // 创建背景
    this.createBackground();
    
    // 创建标题
    this.createHeader();
    
    // 创建章节选择器
    this.createChapterSelector();
    
    // 创建关卡选择器
    this.createLevelSelector();
    
    // 创建按钮
    this.createButtons();
    
    // 更新显示
    this.updateDisplay();
  }

  async loadConfigs() {
    try {
      const chaptersConfig = await this.configManager.getConfig('chapters');
      // 将配置对象转换为数组，保持向后兼容
      this.chapters = Object.values(chaptersConfig);
    } catch (error) {
      console.error('配置加载失败:', error);
      // 使用默认配置作为后备
      this.chapters = [
        {
          id: 1,
          name: '第一章：初入战场',
          description: '新手教程关卡',
          levels: [
            { id: 1, name: '基础训练', description: '学习基本操作', unlocked: true },
            { id: 2, name: '进阶挑战', description: '掌握战术技巧', unlocked: true },
            { id: 3, name: '最终考验', description: '综合能力测试', unlocked: false }
          ]
        }
      ];
    }
  }

  createBackground() {
    const { width, height } = this.scale;
    const graphics = this.add.graphics();
    graphics.fillGradientStyle(0x1a1a2e, 0x16213e, 0x0f3460, 0x533483, 1);
    graphics.fillRect(0, 0, width, height);
    
    for (let i = 0; i < 20; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);
      const size = Phaser.Math.Between(2, 4);
      const alpha = Phaser.Math.FloatBetween(0.1, 0.2);
      this.add.circle(x, y, size, 0xffffff, alpha);
    }
  }

  createHeader() {
    const { width } = this.scale;
    
    this.title = this.add.text(width / 2, 60, '战棋游戏 - 主菜单', {
      fontSize: '36px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    });
    this.title.setOrigin(0.5);
    this.title.name = 'title';
    
    this.userInfo = this.add.text(width - 30, 30, '玩家: 游客', {
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    this.userInfo.setOrigin(1, 0);
    this.userInfo.name = 'userInfo';
  }

  createChapterSelector() {
    const { width, height } = this.scale;
    // 基于1900x900屏幕，确保面板完全在屏幕内
    const panelWidth = 300;
    const panelHeight = 350;
    const panelX = 400; // 固定位置，确保在屏幕左侧
    const panelY = height / 2;
    
    this.chapterPanel = this.add.rectangle(
      panelX, panelY, 
      panelWidth, panelHeight, 
      0x333333, 0.8
    );
    this.chapterPanel.setStrokeStyle(3, 0x666666);
    this.chapterPanel.name = 'chapterPanel';
    
    this.chapterTitle = this.add.text(
      panelX, panelY - 150,
      '选择章节',
      {
        fontSize: '24px',
        color: '#ffffff',
        fontStyle: 'bold'
      }
    );
    this.chapterTitle.setOrigin(0.5);
    this.chapterTitle.name = 'chapterTitle';
    
    this.chapterContainer = this.add.container(panelX, panelY - 100);
    this.chapterContainer.name = 'chapterContainer';
    this.createChapterButtons();
  }

  createChapterButtons() {
    this.chapterButtons = [];
    const buttonWidth = 260;
    const buttonHeight = 50;
    const buttonSpacing = 70;
    
    this.chapters.forEach((chapter, index) => {
      const button = this.add.rectangle(
        0, index * buttonSpacing, 
        buttonWidth, buttonHeight, 
        chapter.id === this.currentChapter ? 0x4CAF50 : 0x555555, 
        0.9
      );
      button.setStrokeStyle(2, 0xffffff, 0.3);
      button.name = `chapterButton_${chapter.id}`;
      
      const buttonText = this.add.text(
        0, index * buttonSpacing,
        chapter.name,
        {
          fontSize: '14px',
          color: '#ffffff',
          fontStyle: 'bold'
        }
      );
      buttonText.setOrigin(0.5);
      buttonText.name = `chapterText_${chapter.id}`;
      
      const buttonContainer = this.add.container(0, 0);
      buttonContainer.add([button, buttonText]);
      buttonContainer.name = `chapterButtonContainer_${chapter.id}`;
      
      button.setInteractive();
      button.on('pointerdown', () => { this.selectChapter(chapter.id); });
      button.on('pointerover', () => { button.setFillStyle(0x4CAF50, 0.9); });
      button.on('pointerout', () => {
        if (chapter.id !== this.currentChapter) button.setFillStyle(0x555555, 0.9);
      });
      
      this.chapterContainer.add(buttonContainer);
      this.chapterButtons.push({ button, text: buttonText, chapterId: chapter.id });
    });
  }

  createLevelSelector() {
    const { width, height } = this.scale;
    const panelWidth = 300;
    const panelHeight = 350;
    const panelX = 1500; // 固定位置，确保在屏幕右侧
    const panelY = height / 2;
    
    this.levelPanel = this.add.rectangle(
      panelX, panelY, 
      panelWidth, panelHeight, 
      0x333333, 0.8
    );
    this.levelPanel.setStrokeStyle(3, 0x666666);
    this.levelPanel.name = 'levelPanel';
    
    this.levelTitle = this.add.text(
      panelX, panelY - 150,
      '选择关卡',
      {
        fontSize: '24px',
        color: '#ffffff',
        fontStyle: 'bold'
      }
    );
    this.levelTitle.setOrigin(0.5);
    this.levelTitle.name = 'levelTitle';
    
    this.levelDescription = this.add.text(
      panelX, panelY - 110,
      '',
      {
        fontSize: '14px',
        color: '#cccccc',
        wordWrap: { width: panelWidth - 40 }
      }
    );
    this.levelDescription.setOrigin(0.5);
    this.levelDescription.name = 'levelDescription';
    
    this.levelContainer = this.add.container(panelX, panelY - 60);
    this.levelContainer.name = 'levelContainer';
    this.createLevelButtons();
  }

  createLevelButtons() {
    this.levelButtons = [];
    const buttonWidth = 260;
    const buttonHeight = 40;
    const buttonSpacing = 60;
    
    const currentChapter = this.chapters.find(c => c.id === this.currentChapter);
    if (!currentChapter) return;
    
    currentChapter.levels.forEach((level, index) => {
      const button = this.add.rectangle(
        0, index * buttonSpacing, 
        buttonWidth, buttonHeight, 
        level.unlocked ? (level.id === this.currentLevel ? 0x2196F3 : 0x555555) : 0x333333, 
        0.9
      );
      button.setStrokeStyle(2, level.unlocked ? 0xffffff : 0x666666, 0.3);
      button.name = `levelButton_${level.id}`;
      
      const buttonText = this.add.text(
        0, index * buttonSpacing,
        `${level.id}. ${level.name}`,
        {
          fontSize: '12px',
          color: level.unlocked ? '#ffffff' : '#666666',
          fontStyle: 'bold'
        }
      );
      buttonText.setOrigin(0.5);
      buttonText.name = `levelText_${level.id}`;
      
      const buttonContainer = this.add.container(0, 0);
      buttonContainer.add([button, buttonText]);
      buttonContainer.name = `levelButtonContainer_${level.id}`;
      
      if (level.unlocked) {
        button.setInteractive();
        button.on('pointerdown', () => { this.selectLevel(level.id); });
        button.on('pointerover', () => { button.setFillStyle(0x2196F3, 0.9); });
        button.on('pointerout', () => {
          if (level.id !== this.currentLevel) button.setFillStyle(0x555555, 0.9);
        });
      }
      
      this.levelContainer.add(buttonContainer);
      this.levelButtons.push({ button, text: buttonText, levelId: level.id, unlocked: level.unlocked });
    });
  }

  createButtons() {
    const { width, height } = this.scale;
    const buttonWidth = 200;
    const buttonHeight = 50;
    
    // 测试引导按钮
    this.guideButton = this.add.rectangle(
      width / 2 - 250, height - 120,
      buttonWidth, buttonHeight,
      0x9C27B0
    );
    this.guideButton.setStrokeStyle(3, 0x7B1FA2);
    this.guideButton.name = 'guideButton1';
    
    this.guideButtonText = this.add.text(
      width / 2 - 250, height - 120,
      '测试引导1',
      {
        fontSize: '18px',
        color: '#ffffff',
        fontStyle: 'bold'
      }
    );
    this.guideButtonText.setOrigin(0.5);
    this.guideButtonText.name = 'guideButton1Text';
    
    this.guideButton.setInteractive();
    this.guideButton.on('pointerdown', () => { this.testGuide(1); });
    this.guideButton.on('pointerover', () => { this.guideButton.setFillStyle(0x7B1FA2); });
    this.guideButton.on('pointerout', () => { this.guideButton.setFillStyle(0x9C27B0); });
    
    // 测试引导2按钮
    this.guideButton2 = this.add.rectangle(
      width / 2 - 250, height - 60,
      buttonWidth, buttonHeight,
      0xFF9800
    );
    this.guideButton2.setStrokeStyle(3, 0xF57C00);
    this.guideButton2.name = 'guideButton2';
    
    this.guideButton2Text = this.add.text(
      width / 2 - 250, height - 60,
      '测试引导2',
      {
        fontSize: '18px',
        color: '#ffffff',
        fontStyle: 'bold'
      }
    );
    this.guideButton2Text.setOrigin(0.5);
    this.guideButton2Text.name = 'guideButton2Text';
    
    this.guideButton2.setInteractive();
    this.guideButton2.on('pointerdown', () => { this.testGuide(2); });
    this.guideButton2.on('pointerover', () => { this.guideButton2.setFillStyle(0xF57C00); });
    this.guideButton2.on('pointerout', () => { this.guideButton2.setFillStyle(0xFF9800); });
    
    this.startButton = this.add.rectangle(
      width / 2, height - 120,
      buttonWidth, buttonHeight,
      0x4CAF50
    );
    this.startButton.setStrokeStyle(3, 0x45a049);
    this.startButton.name = 'startButton';
    
    this.startButtonText = this.add.text(
      width / 2, height - 120,
      '开始游戏',
      {
        fontSize: '18px',
        color: '#ffffff',
        fontStyle: 'bold'
      }
    );
    this.startButtonText.setOrigin(0.5);
    this.startButtonText.name = 'startButtonText';
    
    this.startButton.setInteractive();
    this.startButton.on('pointerdown', () => { this.startGame(); });
    this.startButton.on('pointerover', () => { this.startButton.setFillStyle(0x45a049); });
    this.startButton.on('pointerout', () => { this.startButton.setFillStyle(0x4CAF50); });
    
    this.backButton = this.add.rectangle(
      width / 2, height - 60,
      buttonWidth, buttonHeight,
      0xf44336
    );
    this.backButton.setStrokeStyle(3, 0xd32f2f);
    this.backButton.name = 'backButton';
    
    this.backButtonText = this.add.text(
      width / 2, height - 60,
      '返回登录',
      {
        fontSize: '18px',
        color: '#ffffff',
        fontStyle: 'bold'
      }
    );
    this.backButtonText.setOrigin(0.5);
    this.backButtonText.name = 'backButtonText';
    
    this.backButton.setInteractive();
    this.backButton.on('pointerdown', () => { this.scene.start('LoginScene'); });
    this.backButton.on('pointerover', () => { this.backButton.setFillStyle(0xd32f2f); });
    this.backButton.on('pointerout', () => { this.backButton.setFillStyle(0xf44336); });
  }

  selectChapter(chapterId) {
    this.currentChapter = chapterId;
    this.currentLevel = 1;
    this.updateDisplay();
  }

  selectLevel(levelId) {
    this.currentLevel = levelId;
    this.updateDisplay();
  }

  updateDisplay() {
    // 更新章节按钮颜色
    this.chapterButtons.forEach(({ button, chapterId }) => {
      if (chapterId === this.currentChapter) {
        button.setFillStyle(0x4CAF50, 0.9);
      } else {
        button.setFillStyle(0x555555, 0.9);
      }
    });
    
    // 更新关卡按钮颜色
    this.levelButtons.forEach(({ button, levelId }) => {
      if (levelId === this.currentLevel) {
        button.setFillStyle(0x2196F3, 0.9);
      } else {
        button.setFillStyle(0x555555, 0.9);
      }
    });
    
    // 更新关卡描述
    const currentChapter = this.chapters.find(c => c.id === this.currentChapter);
    if (currentChapter) {
      const currentLevel = currentChapter.levels.find(l => l.id === this.currentLevel);
      if (currentLevel) {
        this.levelDescription.setText(currentLevel.description);
      }
    }
  }

  startGame() {
    const currentChapter = this.chapters.find(c => c.id === this.currentChapter);
    if (currentChapter) {
      const currentLevel = currentChapter.levels.find(l => l.id === this.currentLevel);
      if (currentLevel && currentLevel.unlocked) {
        this.scene.start('GameScene', {
          chapter: this.currentChapter,
          level: this.currentLevel
        });
      } else {
        this.showMessage('关卡未解锁', 'warning');
      }
    }
  }

  showMessage(text, type = 'info') {
    const { width, height } = this.scale;
    const color = type === 'warning' ? '#ff9800' : '#4CAF50';
    
    const message = this.add.text(
      width / 2, height / 2, text, {
        fontSize: '18px', color: color, fontStyle: 'bold', stroke: '#000000', strokeThickness: 3
      }
    );
    message.setOrigin(0.5);
    
    this.time.delayedCall(3000, () => { message.destroy(); });
  }

  /**
   * 测试引导系统
   */
  async testGuide(guideId) {
    if (OperationGuide.isGuideActive()) {
      this.showMessage('引导正在进行中，请先完成当前引导', 'warning');
      return;
    }
    
    try {
      const success = await OperationGuide.playGuide(this, guideId);
      if (success) {
        console.log(`开始测试引导 ${guideId}`);
      } else {
        this.showMessage(`启动引导 ${guideId} 失败`, 'warning');
      }
    } catch (error) {
      console.error('测试引导失败:', error);
      this.showMessage('引导系统错误', 'warning');
    }
  }
} 