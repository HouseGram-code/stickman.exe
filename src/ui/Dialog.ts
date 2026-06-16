import Phaser from "phaser"

export type DialogLine = { speaker: string; text: string; portrait?: string }

export class DialogBox {
  private scene: Phaser.Scene
  private container: Phaser.GameObjects.Container
  private nameText: Phaser.GameObjects.Text
  private bodyText: Phaser.GameObjects.Text
  private portrait: Phaser.GameObjects.Image
  private lines: DialogLine[] = []
  private index = 0
  private onComplete?: () => void
  public active = false

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    const W = 1280
    const boxH = 180
    const y = 720 - boxH - 18
    const bg = scene.add
      .rectangle(W / 2, y + boxH / 2, W - 60, boxH, 0x000000, 0.85)
      .setStrokeStyle(3, 0xaa0000)
    this.portrait = scene.add
      .image(112, y + boxH / 2, "portrait_player")
      .setDisplaySize(120, 120)
    this.nameText = scene.add.text(210, y + 20, "", {
      fontFamily: "monospace",
      fontSize: "24px",
      color: "#ff5555",
    })
    this.bodyText = scene.add.text(210, y + 62, "", {
      fontFamily: "monospace",
      fontSize: "23px",
      color: "#ffffff",
      wordWrap: { width: 940 },
      lineSpacing: 6,
    })
    const hint = scene.add
      .text(W - 80, y + boxH - 30, "[Пробел / тап]", {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#888888",
      })
      .setOrigin(1, 0)
    this.container = scene.add
      .container(0, 0, [bg, this.portrait, this.nameText, this.bodyText, hint])
      .setScrollFactor(0)
      .setDepth(1000)
      .setVisible(false)

    // Тап В ЛЮБОМ МЕСТЕ экрана продолжает реплику.
    // Слушаем ввод на уровне всей сцены, чтобы кнопки управления (◀ ▶ ПРЫЖОК)
    // или порядок отрисовки не перехватывали тап в режиме topOnly на телефоне.
    const advance = () => {
      if (this.active) this.next()
    }
    scene.input.on(Phaser.Input.Events.POINTER_DOWN, advance)
    // Снимаем слушатель при остановке сцены, чтобы не было утечки.
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      scene.input.off(Phaser.Input.Events.POINTER_DOWN, advance)
    })
  }

  show(lines: DialogLine[], onComplete?: () => void) {
    this.lines = lines
    this.index = 0
    this.onComplete = onComplete
    this.active = true
    this.container.setVisible(true)
    this.render()
    // Сообщаем сцене, что открылся диалог (например, чтобы спрятать сенсорные кнопки)
    this.scene.events.emit("dialog-open")
  }

  private render() {
    const line = this.lines[this.index]
    this.nameText.setText(line.speaker)
    this.bodyText.setText(line.text)
    if (line.portrait) this.portrait.setTexture(line.portrait)
  }

  next() {
    if (!this.active) return
    this.index++
    if (this.index >= this.lines.length) {
      this.active = false
      this.container.setVisible(false)
      this.scene.events.emit("dialog-close")
      const cb = this.onComplete
      this.onComplete = undefined
      if (cb) cb()
    } else {
      this.render()
    }
  }
}
