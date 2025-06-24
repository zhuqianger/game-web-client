<template>
  <div id="app">
    <div id="phaser-container" style="width: 100vw; height: 100vh;"></div>
  </div>
</template>

<script>
import { onMounted, onUnmounted } from 'vue'
import Phaser from 'phaser'
import LoginScene from './scenes/LoginScene.js'
import GameScene from './scenes/GameScene.js'

export default {
  name: 'App',
  setup() {
    let game = null

    onMounted(() => {
      // 直接初始化 Phaser 游戏
      game = new Phaser.Game({
        type: Phaser.CANVAS, // 强制使用 Canvas 而不是 WebGL
        width: window.innerWidth,
        height: window.innerHeight,
        parent: 'phaser-container',
        scene: [LoginScene, GameScene],
        backgroundColor: '#1a1a2e',
        scale: {
          mode: Phaser.Scale.RESIZE,
          autoCenter: Phaser.Scale.CENTER_BOTH
        },
        // 性能优化设置
        render: {
          pixelArt: false,
          antialias: false, // 关闭抗锯齿
          roundPixels: true,
          powerPreference: 'default'
        },
        physics: {
          default: false
        },
        fps: {
          target: 30, // 降低帧率到30fps
          forceSetTimeOut: true
        }
      })

      // 窗口大小改变时重新调整游戏尺寸
      const handleResize = () => {
        if (game) {
          game.scale.resize(window.innerWidth, window.innerHeight)
        }
      }
      
      window.addEventListener('resize', handleResize)
      
      // 清理事件监听器
      onUnmounted(() => {
        window.removeEventListener('resize', handleResize)
        if (game) {
          game.destroy(true)
          game = null
        }
      })
    })

    return {}
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

#phaser-container {
  position: fixed;
  left: 0;
  top: 0;
  width: 100vw;
  height: 100vh;
  z-index: 10;
}

/* 移除默认的margin */
body {
  margin: 0;
  padding: 0;
  overflow: hidden;
}
</style>
