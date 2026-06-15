import Phaser from "phaser"

export class MenuScene extends Phaser.Scene {
  private infoOpen = false
  private menuMusic!: Phaser.Sound.BaseSound

  constructor() {
    super("MenuScene")
  }

  private click() {
    this.sound.play("click", { volume: 0.5 })
  }

  create() {
    this.infoOpen = false
    this.add.rectangle(640, 360, 1280, 720, 0x070707).setDepth(-1)

    // Музыка меню (запускается после первого клика, если браузер блокирует автозвук)
    if (!this.sound.get("music_menu")) {
      this.menuMusic = this.sound.add("music_menu", { loop: true, volume: 0.4 })
    } else {
      this.menuMusic = this.sound.get("music_menu")!
    }
    if (!this.menuMusic.isPlaying) this.menuMusic.play()

    const title = this.add
      .text(640, 200, "STICKMAN.EXE", {
        fontFamily: "monospace",
        fontSize: "88px",
        color: "#cc0000",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
    this.add
      .text(640, 275, "версия 0.1 бета", {
        fontFamily: "monospace",
        fontSize: "26px",
        color: "#888888",
      })
      .setOrigin(0.5)

    this.tweens.add({
      targets: title,
      alpha: 0.55,
      duration: 90,
      yoyo: true,
      repeat: -1,
      repeatDelay: 1700,
    })

    const playBtn = this.add
      .text(640, 410, "  ИГРАТЬ  ", {
        fontFamily: "monospace",
        fontSize: "42px",
        color: "#ffffff",
        backgroundColor: "#770000",
        padding: { x: 26, y: 14 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
    playBtn.on("pointerover", () =>
      playBtn.setStyle({ backgroundColor: "#aa0000" })
    )
    playBtn.on("pointerout", () =>
      playBtn.setStyle({ backgroundColor: "#770000" })
    )
    playBtn.on("pointerdown", () => {
      if (this.infoOpen) return
      this.click()
      if (this.menuMusic.isPlaying) this.menuMusic.stop()
      this.cameras.main.fadeOut(400, 0, 0, 0)
      this.time.delayedCall(420, () => this.scene.start("CharacterSelectScene"))
    })

    const infoBtn = this.add
      .text(640, 500, "  ИНФОРМАЦИЯ  ", {
        fontFamily: "monospace",
        fontSize: "30px",
        color: "#dddddd",
        backgroundColor: "#222222",
        padding: { x: 22, y: 11 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
    infoBtn.on("pointerover", () =>
      infoBtn.setStyle({ backgroundColor: "#3a3a3a" })
    )
    infoBtn.on("pointerout", () =>
      infoBtn.setStyle({ backgroundColor: "#222222" })
    )
    infoBtn.on("pointerdown", () => {
      if (this.infoOpen) return
      this.click()
      this.showInfo()
    })

    this.add
      .text(640, 665, "Нажми ИГРАТЬ, чтобы начать", {
        fontFamily: "monospace",
        fontSize: "18px",
        color: "#555555",
      })
      .setOrigin(0.5)

    this.cameras.main.fadeIn(500, 0, 0, 0)
  }

  private showInfo() {
    this.infoOpen = true
    const c = this.add.container(0, 0).setDepth(3000)

    const block = this.add
      .rectangle(640, 360, 1280, 720, 0x000000, 0.88)
      .setInteractive()
    const panel = this.add
      .rectangle(640, 360, 900, 560, 0x120608)
      .setStrokeStyle(3, 0x770000)

    const title = this.add
      .text(640, 120, "ОБ ИГРЕ", {
        fontFamily: "monospace",
        fontSize: "44px",
        color: "#cc0000",
        fontStyle: "bold",
      })
      .setOrigin(0.5)

    const h1 = this.add.text(230, 185, "Что это за игра:", {
      fontFamily: "monospace",
      fontSize: "24px",
      color: "#ffdd00",
    })
    const p1 = this.add.text(
      230,
      222,
      "STICKMAN.EXE — короткая хоррор-история. Обычный жёлтый стикмен вышел на прогулку в прекрасный день... но что-то идёт не так.",
      {
        fontFamily: "monospace",
        fontSize: "19px",
        color: "#cccccc",
        wordWrap: { width: 820 },
        lineSpacing: 6,
      }
    )

    const h2 = this.add.text(230, 330, "Как играть:", {
      fontFamily: "monospace",
      fontSize: "24px",
      color: "#ffdd00",
    })
    const p2 = this.add.text(
      230,
      370,
      "← →  — идти\nПробел или ↑  — прыжок\nПробел или Enter  — листать диалоги\nF  — полный экран",
      {
        fontFamily: "monospace",
        fontSize: "20px",
        color: "#cccccc",
        lineSpacing: 8,
      }
    )

    const p3 = this.add.text(
      230,
      510,
      "Просто иди вправо и смотри, что будет дальше...",
      {
        fontFamily: "monospace",
        fontSize: "18px",
        color: "#999999",
        fontStyle: "italic",
      }
    )

    const note = this.add
      .text(640, 565, "версия 0.1 бета — могут быть баги", {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#555555",
      })
      .setOrigin(0.5)

    const back = this.add
      .text(640, 615, "  ← НАЗАД  ", {
        fontFamily: "monospace",
        fontSize: "30px",
        color: "#ffffff",
        backgroundColor: "#770000",
        padding: { x: 22, y: 10 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
    back.on("pointerover", () => back.setStyle({ backgroundColor: "#aa0000" }))
    back.on("pointerout", () => back.setStyle({ backgroundColor: "#770000" }))
    back.on("pointerdown", () => {
      this.click()
      c.destroy()
      this.infoOpen = false
    })

    c.add([block, panel, title, h1, p1, h2, p2, p3, note, back])
  }
}
