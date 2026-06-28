import Phaser from "phaser"
import { BootScene } from "./scenes/BootScene"
import { MenuScene } from "./scenes/MenuScene"
import { CharacterSelectScene } from "./scenes/CharacterSelectScene"
import { LevelSelectScene } from "./scenes/LevelSelectScene"
import { GameScene } from "./scenes/GameScene"
import { ChaseScene } from "./scenes/ChaseScene"
import { BattleScene } from "./scenes/BattleScene"
import { RunnerScene } from "./scenes/RunnerScene"
import { FinaleScene } from "./scenes/FinaleScene"
import { SecretRoomScene } from "./scenes/SecretRoomScene"
// Регистрация service worker: офлайн-кэш + баннер прогресса + авто-обновление
import "./pwa"

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "game",
  pixelArt: true,
  backgroundColor: "#0a0a0a",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1280,
    height: 720,
  },
  physics: {
    default: "arcade",
    arcade: { gravity: { x: 0, y: 1100 }, debug: false },
  },
  input: {
    activePointers: 3, // поддержка мультитача: движение + прыжок одновременно
  },
  scene: [BootScene, MenuScene, CharacterSelectScene, LevelSelectScene, GameScene, ChaseScene, BattleScene, RunnerScene, FinaleScene, SecretRoomScene],
}

new Phaser.Game(config)
