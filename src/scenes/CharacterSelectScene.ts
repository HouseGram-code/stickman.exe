import Phaser from "phaser"

export class CharacterSelectScene extends Phaser.Scene {
  constructor() {
    super("CharacterSelectScene")
  }

  create() {
    this.add.rectangle(640, 360, 1280, 720, 0x0b0b0b).setDepth(-1)
    this.add
      .text(640, 80, "ВЫБОР ПЕРСОНАЖА", {
        fontFamily: "monospace",
        fontSize: "46px",
        color: "#ffffff",
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
    const hero = this.add.sprite(820, 380, "player").setScale(5)
    hero.play("player-run")

    const card = this.add.rectangle(380, 380, 560, 320, 0x000000, 0.5)
    card.setStrokeStyle(2, 0x444444)
    this.add.image(220, 330, "portrait_player").setDisplaySize(140, 140)
    this.add.text(310, 300, "СТИКМЕН", {
      fontFamily: "monospace",
      fontSize: "34px",
      color: "#ffdd00",
    })
    this.add.text(310, 350, "Обычный парень.", {
      fontFamily: "monospace",
      fontSize: "20px",
      color: "#cccccc",
    })
    this.add.text(
      160,
      430,
      "«Какой прекрасный день!\nСамое время для прогулки...»",
      {
        fontFamily: "monospace",
        fontSize: "20px",
        color: "#aaaaaa",
        lineSpacing: 6,
      }
    )

    const btn = this.add
      .text(640, 630, "  ВЫБРАТЬ  ", {
        fontFamily: "monospace",
        fontSize: "36px",
        color: "#ffffff",
        backgroundColor: "#226622",
        padding: { x: 24, y: 12 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
    btn.on("pointerover", () => btn.setStyle({ backgroundColor: "#2e8b2e" }))
    btn.on("pointerout", () => btn.setStyle({ backgroundColor: "#226622" }))
    btn.on("pointerdown", () => {
      this.sound.play("click", { volume: 0.5 })
      this.cameras.main.fadeOut(400, 0, 0, 0)
      this.time.delayedCall(420, () => this.scene.start("GameScene"))
    })

    this.cameras.main.fadeIn(500, 0, 0, 0)
  }
}
