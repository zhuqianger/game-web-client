/**
 * 剧情系统类
 * 轻量级对话系统，直接在现有场景中显示对话框
 * 
 * 使用方法：
 * 1. 播放剧情: Cutscene.play(scene, 'cutscene1', () => console.log('完成'))
 * 2. 设置回调: Cutscene.setDialogueChangeCallback(scene, (dialogue, index) => {})
 * 3. 停止剧情: Cutscene.stop(scene)
 * 4. 销毁: Cutscene.destroy(scene)
 * 
 * 剧情数据格式 (src/assets/cutscenes/cutscene1.json):
 * {
 *   "id": "cutscene1",
 *   "dialogues": [
 *     {
 *       "character": {
 *         "name": "角色名",
 *         "image": "图片名",
 *         "position": "left|right"
 *       },
 *       "content": "对话内容"
 *     }
 *   ]
 * }
 */
export default class Cutscene {
  // 全局实例管理
  static instances = new Map()

  /**
   * 获取或创建场景的剧情实例
   */
  static getInstance(scene) {
    if (!this.instances.has(scene)) {
      this.instances.set(scene, new CutsceneInstance(scene))
    }
    return this.instances.get(scene)
  }

  /**
   * 播放剧情
   * @param {Phaser.Scene} scene - 场景实例
   * @param {string} cutsceneId - 剧情ID
   * @param {Function} onComplete - 完成回调
   */
  static async play(scene, cutsceneId, onComplete = null) {
    const instance = this.getInstance(scene)
    return instance.play(cutsceneId, onComplete)
  }

  /**
   * 停止剧情
   * @param {Phaser.Scene} scene - 场景实例
   */
  static stop(scene) {
    const instance = this.getInstance(scene)
    instance.stop()
  }

  /**
   * 跳过剧情
   * @param {Phaser.Scene} scene - 场景实例
   */
  static skip(scene) {
    const instance = this.getInstance(scene)
    instance.skip()
  }

  /**
   * 设置打字速度
   * @param {Phaser.Scene} scene - 场景实例
   * @param {number} speed - 打字速度
   */
  static setTypeSpeed(scene, speed) {
    const instance = this.getInstance(scene)
    instance.setTypeSpeed(speed)
  }

  /**
   * 设置对话变化回调
   * @param {Phaser.Scene} scene - 场景实例
   * @param {Function} callback - 回调函数
   */
  static setDialogueChangeCallback(scene, callback) {
    const instance = this.getInstance(scene)
    instance.setDialogueChangeCallback(callback)
  }

  /**
   * 销毁剧情系统
   * @param {Phaser.Scene} scene - 场景实例
   */
  static destroy(scene) {
    const instance = this.getInstance(scene)
    instance.destroy()
    this.instances.delete(scene)
  }

  /**
   * 检查是否正在播放剧情
   * @param {Phaser.Scene} scene - 场景实例
   * @returns {boolean}
   */
  static isPlaying(scene) {
    const instance = this.getInstance(scene)
    return instance.isPlaying
  }
}

/**
 * 剧情实例类（内部使用）
 */
class CutsceneInstance {
  constructor(scene) {
    this.scene = scene
    this.game = scene.game
    this.currentCutscene = null
    this.currentDialogueIndex = 0
    this.isPlaying = false
    this.isTyping = false
    this.typeSpeed = 50
    this.typeInterval = null
    
    // UI 元素
    this.dialogueBox = null
    this.characterLeft = null
    this.characterRight = null
    this.nameText = null
    this.contentText = null
    this.continueText = null
    
    // 事件回调
    this.onComplete = null
    this.onDialogueChange = null
    
    // 输入事件处理
    this.inputHandler = null
    this.keyboardHandler = null
  }

  /**
   * 播放剧情
   * @param {string} cutsceneId - 剧情ID
   * @param {Function} onComplete - 完成回调
   */
  async play(cutsceneId, onComplete = null) {
    try {
      this.onComplete = onComplete
      this.currentCutscene = await this.loadCutsceneData(cutsceneId)
      this.currentDialogueIndex = 0
      this.isPlaying = true

      this.createUI()
      this.setupInput()
      this.playCurrentDialogue()
      
    } catch (error) {
      console.error('播放剧情失败:', error)
      this.stop()
    }
  }

  /**
   * 加载剧情数据
   */
  async loadCutsceneData(cutsceneId) {
    try {
      const response = await fetch(`/src/assets/cutscenes/${cutsceneId}.json`)
      if (!response.ok) {
        throw new Error(`无法加载剧情文件: ${cutsceneId}`)
      }
      return await response.json()
    } catch (error) {
      console.error('加载剧情数据失败:', error)
      throw error
    }
  }

  /**
   * 创建UI界面
   */
  createUI() {
    const { width, height } = this.game.scale
    
    // 如果UI已存在，先重置状态
    if (this.dialogueBox) {
      this.resetUI()
      return
    }
    
    // 背景遮罩
    this.backgroundOverlay = this.scene.add.rectangle(
      width / 2, height / 2, width, height, 0x000000, 0.7
    )
    this.backgroundOverlay.setDepth(1000)

    // 对话框
    this.dialogueBox = this.scene.add.rectangle(
      width / 2, height - 150, width - 100, 200, 0x000000, 0.8
    )
    this.dialogueBox.setDepth(1002)
    this.dialogueBox.setStrokeStyle(2, 0xffffff)

    // 角色容器
    this.characterLeft = this.scene.add.container(width / 4, height / 2)
    this.characterLeft.setDepth(1003)

    this.characterRight = this.scene.add.container(width * 3 / 4, height / 2)
    this.characterRight.setDepth(1003)

    // 姓名文本
    this.nameText = this.scene.add.text(
      width / 2, height - 200, '', {
        fontSize: '24px',
        fill: '#ffffff',
        fontFamily: 'Arial',
        stroke: '#000000',
        strokeThickness: 2
      }
    )
    this.nameText.setDepth(1004)
    this.nameText.setOrigin(0.5, 0.5)

    // 对话内容文本
    this.contentText = this.scene.add.text(
      width / 2, height - 150, '', {
        fontSize: '18px',
        fill: '#ffffff',
        fontFamily: 'Arial',
        wordWrap: { width: width - 150 },
        lineSpacing: 5
      }
    )
    this.contentText.setDepth(1004)
    this.contentText.setOrigin(0.5, 0.5)

    // 继续提示
    this.continueText = this.scene.add.text(
      width - 100, height - 50, '点击继续...', {
        fontSize: '16px',
        fill: '#ffffff',
        fontFamily: 'Arial',
        fontStyle: 'italic'
      }
    )
    this.continueText.setDepth(1004)
    this.continueText.setOrigin(0.5, 0.5)
    this.continueText.setAlpha(0.7)

    // 闪烁动画
    this.scene.tweens.add({
      targets: this.continueText,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1
    })
  }

  /**
   * 重置UI状态
   */
  resetUI() {
    if (this.backgroundOverlay) this.backgroundOverlay.setVisible(true)
    if (this.dialogueBox) this.dialogueBox.setVisible(true)
    if (this.characterLeft) this.characterLeft.setVisible(false)
    if (this.characterRight) this.characterRight.setVisible(false)
    if (this.nameText) {
      this.nameText.setVisible(true)
      this.nameText.setText('')
    }
    if (this.contentText) {
      this.contentText.setVisible(true)
      this.contentText.setText('')
    }
    if (this.continueText) {
      this.continueText.setVisible(false)
      this.continueText.setAlpha(0.7)
    }
  }

  /**
   * 设置输入事件
   */
  setupInput() {
    this.removeInputHandlers()
    
    this.inputHandler = () => {
      if (this.isPlaying) {
        this.nextDialogue()
      }
    }
    
    this.keyboardHandler = (event) => {
      if (this.isPlaying && (event.code === 'Space' || event.code === 'Enter')) {
        this.nextDialogue()
      }
    }
    
    this.scene.input.on('pointerdown', this.inputHandler)
    this.scene.input.keyboard.on('keydown', this.keyboardHandler)
  }

  /**
   * 移除输入事件监听器
   */
  removeInputHandlers() {
    if (this.inputHandler) {
      this.scene.input.off('pointerdown', this.inputHandler)
      this.inputHandler = null
    }
    if (this.keyboardHandler) {
      this.scene.input.keyboard.off('keydown', this.keyboardHandler)
      this.keyboardHandler = null
    }
  }

  /**
   * 播放当前对话
   */
  playCurrentDialogue() {
    if (!this.currentCutscene || this.currentDialogueIndex >= this.currentCutscene.dialogues.length) {
      this.complete()
      return
    }

    const dialogue = this.currentCutscene.dialogues[this.currentDialogueIndex]
    const character = dialogue.character

    this.updateCharacters(character)
    this.nameText.setText(character.name)
    this.typeText(dialogue.content)

    if (this.onDialogueChange) {
      this.onDialogueChange(dialogue, this.currentDialogueIndex)
    }
  }

  /**
   * 更新角色显示
   */
  updateCharacters(currentCharacter) {
    this.characterLeft.removeAll()
    this.characterRight.removeAll()

    if (currentCharacter.position === 'left') {
      this.showCharacter(this.characterLeft, currentCharacter)
      this.characterLeft.setVisible(true)
      this.characterRight.setVisible(false)
    } else {
      this.showCharacter(this.characterRight, currentCharacter)
      this.characterRight.setVisible(true)
      this.characterLeft.setVisible(false)
    }
  }

  /**
   * 显示角色
   */
  showCharacter(container, character) {
    try {
      const characterImage = this.scene.add.image(0, 0, character.image)
      characterImage.setDisplaySize(200, 300)
      container.add(characterImage)

      const nameText = this.scene.add.text(0, 160, character.name, {
        fontSize: '16px',
        fill: '#ffffff',
        fontFamily: 'Arial',
        stroke: '#000000',
        strokeThickness: 1
      })
      nameText.setOrigin(0.5, 0.5)
      container.add(nameText)

    } catch (error) {
      console.warn(`无法加载角色图片: ${character.image}`, error)
      const placeholder = this.scene.add.rectangle(0, 0, 200, 300, 0x666666)
      container.add(placeholder)
    }
  }

  /**
   * 打字效果显示文本
   */
  typeText(text) {
    // 清除之前的打字定时器
    if (this.typeInterval) {
      clearInterval(this.typeInterval)
      this.typeInterval = null
    }
    
    this.isTyping = true
    this.contentText.setText('')
    this.continueText.setVisible(false)

    let currentIndex = 0
    this.typeInterval = setInterval(() => {
      if (currentIndex < text.length) {
        this.contentText.setText(text.substring(0, currentIndex + 1))
        currentIndex++
      } else {
        clearInterval(this.typeInterval)
        this.typeInterval = null
        this.isTyping = false
        this.continueText.setVisible(true)
      }
    }, this.typeSpeed)
  }

  /**
   * 下一段对话
   */
  nextDialogue() {
    if (this.isTyping) {
      const dialogue = this.currentCutscene.dialogues[this.currentDialogueIndex]
      this.contentText.setText(dialogue.content)
      this.isTyping = false
      this.continueText.setVisible(true)
      return
    }

    this.currentDialogueIndex++
    this.playCurrentDialogue()
  }

  /**
   * 完成剧情
   */
  complete() {
    this.isPlaying = false
    this.hideUI()
    
    if (this.onComplete) {
      this.onComplete()
    }
  }

  /**
   * 隐藏UI
   */
  hideUI() {
    if (this.backgroundOverlay) this.backgroundOverlay.setVisible(false)
    if (this.dialogueBox) this.dialogueBox.setVisible(false)
    if (this.characterLeft) this.characterLeft.setVisible(false)
    if (this.characterRight) this.characterRight.setVisible(false)
    if (this.nameText) this.nameText.setVisible(false)
    if (this.contentText) this.contentText.setVisible(false)
    if (this.continueText) this.continueText.setVisible(false)
  }

  /**
   * 停止剧情
   */
  stop() {
    this.isPlaying = false
    this.hideUI()
    this.currentCutscene = null
    this.currentDialogueIndex = 0
    this.removeInputHandlers()
    
    // 清除打字定时器
    if (this.typeInterval) {
      clearInterval(this.typeInterval)
      this.typeInterval = null
    }
  }

  /**
   * 跳过剧情
   */
  skip() {
    this.complete()
  }

  /**
   * 设置打字速度
   */
  setTypeSpeed(speed) {
    this.typeSpeed = speed
  }

  /**
   * 设置对话变化回调
   */
  setDialogueChangeCallback(callback) {
    this.onDialogueChange = callback
  }

  /**
   * 销毁剧情系统
   */
  destroy() {
    this.stop()
    
    // 清除打字定时器
    if (this.typeInterval) {
      clearInterval(this.typeInterval)
      this.typeInterval = null
    }
    
    if (this.backgroundOverlay) this.backgroundOverlay.destroy()
    if (this.dialogueBox) this.dialogueBox.destroy()
    if (this.characterLeft) this.characterLeft.destroy()
    if (this.characterRight) this.characterRight.destroy()
    if (this.nameText) this.nameText.destroy()
    if (this.contentText) this.contentText.destroy()
    if (this.continueText) this.continueText.destroy()
    
    this.backgroundOverlay = null
    this.dialogueBox = null
    this.characterLeft = null
    this.characterRight = null
    this.nameText = null
    this.contentText = null
    this.continueText = null
  }
}
