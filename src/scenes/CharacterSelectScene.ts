import Phaser from "phaser"
import { makeMenuButton } from "../ui/MenuButton"
import { enterImmersive } from "../fullscreen"

export class CharacterSelectScene extends Phaser.Scene {
  constructor() {
    super("CharacterSelectScene")
  }

  create() {
    // Фоновая музыка меню продолжается на экране выбора (без тишины).
    let menuMusic = this.sound.get("music_menu")
    if (!menuMusic) {
      menuMusic = this.sound.add("music_menu", { loop: true, volume: 0.4 })
    }
    const startMusic = () => {
      if (menuMusic && !menuMusic.isPlaying) menuMusic.play()
    }
    if (this.sound.locked) {
      this.sound.once(Phaser.Sound.Events.UNLOCKED, startMusic)
    } else {
      startMusic()
    }

    this.add.rectangle(640, 360, 1280, 720, 0x0b0b0b).setDepth(-2)
    this.add.ellipse(640, 360, 1100, 560, 0x1a0000, 0.5).setDepth(-1)

    this.add
      .text(640, 70, "ВЫБОР ПЕРСОНАЖА", {
        fontFamily: "monospace",
        fontSize: "46px",
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5)

    if (!this.anims.exists("player-run")) {
      this.anims.create({
        key: "player-run",
        frames: this.anims.generateFrameNumbers("player", { start: 0, end: 5 }),
        frameRate: 10,
        repeat: -1,
      })
    }

    // Карточка персонажа
    const card = this.add
      .rectangle(420, 390, 600, 360, 0x000000, 0.55)
      .setStrokeStyle(3, 0xffdd00, 0.8)
    this.tweens.add({
      targets: card,
      strokeAlpha: 0.3,
      duration: 900,
      yoyo: true,
      repeat: -1,
    })

    this.add.image(250, 330, "portrait_player").setDisplaySize(150, 150)
    this.add.text(345, 290, "СТИКМЕН", {
      fontFamily: "monospace",
      fontSize: "36px",
      color: "#ffdd00",
      fontStyle: "bold",
    })
    this.add.text(345, 345, "Обычный парень.", {
      fontFamily: "monospace",
      fontSize: "20px",
      color: "#cccccc",
    })
    this.add.text(
      170,
      430,
      "«Какой прекрасный день!\nСамое время для прогулки...»",
      {
        fontFamily: "monospace",
        fontSize: "20px",
        color: "#aaaaaa",
        lineSpacing: 6,
        fontStyle: "italic",
      }
    )

    // Анимированный герой
    const hero = this.add.sprite(960, 380, "player").setScale(6)
    hero.play("player-run")
    this.tweens.add({
      targets: hero,
      y: 366,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    })

    // Кнопки
    makeMenuButton(this, 760, 640, "ВЫБРАТЬ", {
      width: 300,
      height: 70,
      fontSize: 34,
      fill: 0x1f7a1f,
      fillHover: 0x2faa2f,
      stroke: 0x7bff7b,
      onClick: () => {
        enterImmersive(this)
        this.cameras.main.fadeOut(400, 0, 0, 0)
        this.time.delayedCall(420, () => this.scene.start("GameScene"))
      },
    })

    makeMenuButton(this, 380, 640, "← НАЗАД", {
      width: 240,
      height: 60,
      fontSize: 26,
      fill: 0x2a2a2a,
      fillHover: 0x444444,
      stroke: 0x888888,
      onClick: () => {
        this.cameras.main.fadeOut(350, 0, 0, 0)
        this.time.delayedCall(370, () => this.scene.start("MenuScene"))
      },
    })

    this.cameras.main.fadeIn(500, 0, 0, 0)
  }
}
