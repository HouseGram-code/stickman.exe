import Phaser from "phaser"
import { makeMenuButton } from "../ui/MenuButton"
import { autoImmersiveOnFirstGesture, enterImmersive } from "../fullscreen"

export class MenuScene extends Phaser.Scene {
  private infoOpen = false
  private menuMusic!: Phaser.Sound.BaseSound

  constructor() {
    super("MenuScene")
  }

  create() {
    this.infoOpen = false

    // на телефоне первый тап -> фуллскрин + альбомная ориентация
    autoImmersiveOnFirstGesture(this)

    this.buildBackground()

    // Музыка меню (запускается после первого клика, если браузер блокирует автозвук)
    if (!this.sound.get("music_menu")) {
      this.menuMusic = this.sound.add("music_menu", { loop: true, volume: 0.4 })
    } else {
      this.menuMusic = this.sound.get("music_menu")!
    }
    if (!this.menuMusic.isPlaying) this.menuMusic.play()

    // Заголовок с лёгкой тенью-глитчем
    this.add
      .text(643, 173, "STICKMAN.EXE", {
        fontFamily: "monospace",
        fontSize: "92px",
        color: "#3a0000",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
    const title = this.add
      .text(640, 170, "STICKMAN.EXE", {
        fontFamily: "monospace",
        fontSize: "92px",
        color: "#cc0000",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
    this.tweens.add({
      targets: title,
      alpha: 0.5,
      duration: 80,
      yoyo: true,
      repeat: -1,
      repeatDelay: 1600,
    })

    this.add
      .text(640, 248, "версия 0.2 бета", {
        fontFamily: "monospace",
        fontSize: "24px",
        color: "#8a8a8a",
      })
      .setOrigin(0.5)

    // Кнопки
    makeMenuButton(this, 640, 365, "ИГРАТЬ", {
      width: 420,
      height: 78,
      fontSize: 40,
      fill: 0x7a0000,
      fillHover: 0xb00000,
      stroke: 0xff5555,
      onClick: () => this.startPlay(),
    })

    makeMenuButton(this, 640, 460, "ВЫБОР ПЕРСОНАЖА", {
      width: 420,
      height: 60,
      fontSize: 26,
      fill: 0x222230,
      fillHover: 0x33334a,
      stroke: 0x6a6a90,
      onClick: () => this.goCharacterSelect(),
    })

    makeMenuButton(this, 640, 535, "ИНФОРМАЦИЯ", {
      width: 420,
      height: 60,
      fontSize: 26,
      fill: 0x222222,
      fillHover: 0x3a3a3a,
      stroke: 0x777777,
      onClick: () => {
        if (!this.infoOpen) this.showInfo()
      },
    })

    this.add
      .text(640, 678, "Совет: лучше играть в полноэкранном режиме (на телефоне — горизонтально)", {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#555555",
      })
      .setOrigin(0.5)

    this.cameras.main.fadeIn(500, 0, 0, 0)
  }

  private buildBackground() {
    this.add.rectangle(640, 360, 1280, 720, 0x070707).setDepth(-2)
    // тёплое багровое свечение за заголовком
    this.add.ellipse(640, 200, 1000, 460, 0x2a0000, 0.55).setDepth(-1)

    // парящие угольки
    for (let i = 0; i < 16; i++) {
      const x = Phaser.Math.Between(0, 1280)
      const y = Phaser.Math.Between(360, 760)
      const e = this.add
        .circle(x, y, Phaser.Math.Between(1, 3), 0xff5522, 0.55)
        .setDepth(-1)
      this.tweens.add({
        targets: e,
        y: y - Phaser.Math.Between(200, 480),
        alpha: 0,
        duration: Phaser.Math.Between(3500, 7000),
        repeat: -1,
        delay: Phaser.Math.Between(0, 3000),
      })
    }
  }

  private fadeAndStart(scene: string) {
    if (this.infoOpen) return
    if (this.menuMusic.isPlaying) this.menuMusic.stop()
    this.cameras.main.fadeOut(400, 0, 0, 0)
    this.time.delayedCall(420, () => this.scene.start(scene))
  }

  private startPlay() {
    if (this.infoOpen) return
    enterImmersive(this) // авто-фуллскрин (на ПК — при старте игры)
    this.fadeAndStart("CharacterSelectScene")
  }

  private goCharacterSelect() {
    if (this.infoOpen) return
    enterImmersive(this)
    this.fadeAndStart("CharacterSelectScene")
  }

  // ---------- ИНФОРМАЦИЯ ----------
  private showInfo() {
    this.infoOpen = true
    const c = this.add.container(0, 0).setDepth(3000)

    const block = this.add
      .rectangle(640, 360, 1280, 720, 0x000000, 0.9)
      .setInteractive()
    const panel = this.add
      .rectangle(640, 360, 940, 580, 0x120608)
      .setStrokeStyle(3, 0x990000)

    const title = this.add
      .text(640, 110, "ОБ ИГРЕ", {
        fontFamily: "monospace",
        fontSize: "44px",
        color: "#cc0000",
        fontStyle: "bold",
      })
      .setOrigin(0.5)

    const h1 = this.add.text(205, 170, "Что это за игра:", {
      fontFamily: "monospace",
      fontSize: "23px",
      color: "#ffdd00",
    })
    const p1 = this.add.text(
      205,
      206,
      "STICKMAN.EXE — короткая хоррор-история. Обычный жёлтый стикмен вышел на прогулку в прекрасный день... но что-то идёт не так.",
      {
        fontFamily: "monospace",
        fontSize: "19px",
        color: "#cccccc",
        wordWrap: { width: 860 },
        lineSpacing: 6,
      }
    )

    const h2 = this.add.text(205, 310, "Как играть:", {
      fontFamily: "monospace",
      fontSize: "23px",
      color: "#ffdd00",
    })
    const p2 = this.add.text(
      205,
      348,
      "Клавиатура:\n  ← →  — идти,   Пробел / ↑  — прыжок\n  Пробел / Enter  — листать диалоги,   E — поговорить\n  F  — полный экран\n\nТелефон:\n  кнопки на экране (◀ ▶ и ПРЫЖОК), тап — листать диалоги\n  игра сама развернётся на весь экран в горизонтали",
      {
        fontFamily: "monospace",
        fontSize: "19px",
        color: "#cccccc",
        lineSpacing: 7,
      }
    )

    const note = this.add
      .text(640, 575, "версия 0.2 бета — могут быть баги", {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#666666",
      })
      .setOrigin(0.5)

    const back = makeMenuButton(this, 640, 625, "← НАЗАД", {
      width: 240,
      height: 56,
      fontSize: 26,
      fill: 0x7a0000,
      fillHover: 0xb00000,
      onClick: () => {
        c.destroy()
        this.infoOpen = false
      },
    })

    c.add([block, panel, title, h1, p1, h2, p2, note, back])
  }
}
