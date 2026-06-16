import Phaser from "phaser"

// Экранное управление для Android / iPhone (появляется только на сенсорных экранах).
export class TouchControls {
  public left = false
  public right = false
  private jumpQueued = false
  public enabled = false
  private scene: Phaser.Scene
  private objects: Phaser.GameObjects.GameObject[] = []

  constructor(scene: Phaser.Scene, opts: { move?: boolean } = {}) {
    this.scene = scene
    const hasTouch = scene.sys.game.device.input.touch
    if (!hasTouch) return // На ПК не показываем — играем с клавиатуры
    this.enabled = true
    const showMove = opts.move !== false
    const H = 720
    const depth = 950

    const makeBtn = (
      x: number,
      y: number,
      r: number,
      label: string,
      color: number
    ) => {
      const shadow = this.scene.add
        .circle(x, y + 4, r, 0x000000, 0.35)
        .setScrollFactor(0)
        .setDepth(depth - 1)
      const base = this.scene.add
        .circle(x, y, r, color, 0.4)
        .setStrokeStyle(5, 0xffffff, 0.7)
        .setScrollFactor(0)
        .setDepth(depth)
        .setInteractive()
      const gloss = this.scene.add
        .circle(x, y - r * 0.35, r * 0.55, 0xffffff, 0.12)
        .setScrollFactor(0)
        .setDepth(depth)
      const txt = this.scene.add
        .text(x, y, label, {
          fontFamily: "monospace",
          fontSize: `${Math.floor(r * 0.95)}px`,
          color: "#ffffff",
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(depth + 1)
      base.setAlpha(0.85)
      this.objects.push(shadow, base, gloss, txt)
      const press = () => {
        base.setAlpha(1)
        base.setScale(0.92)
        txt.setScale(0.92)
      }
      const release = () => {
        base.setAlpha(0.85)
        base.setScale(1)
        txt.setScale(1)
      }
      return { base, press, release }
    }

    if (showMove) {
      const l = makeBtn(100, H - 100, 50, "◀", 0x2233aa)
      l.base.on("pointerdown", () => {
        this.left = true
        l.press()
      })
      l.base.on("pointerup", () => {
        this.left = false
        l.release()
      })
      l.base.on("pointerout", () => {
        this.left = false
        l.release()
      })
      l.base.on("pointerupoutside", () => {
        this.left = false
        l.release()
      })

      const rr = makeBtn(228, H - 100, 50, "▶", 0x2233aa)
      rr.base.on("pointerdown", () => {
        this.right = true
        rr.press()
      })
      rr.base.on("pointerup", () => {
        this.right = false
        rr.release()
      })
      rr.base.on("pointerout", () => {
        this.right = false
        rr.release()
      })
      rr.base.on("pointerupoutside", () => {
        this.right = false
        rr.release()
      })
    }

    const j = makeBtn(1280 - 105, H - 105, 60, "↑", 0x22aa44)
    const jLabel = this.scene.add
      .text(1280 - 105, H - 105 + 36, "ПРЫЖОК", {
        fontFamily: "monospace",
        fontSize: "13px",
        color: "#ffffff",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(depth + 1)
    this.objects.push(jLabel)
    j.base.on("pointerdown", () => {
      this.jumpQueued = true
      j.press()
    })
    j.base.on("pointerup", () => j.release())
    j.base.on("pointerout", () => j.release())
    j.base.on("pointerupoutside", () => j.release())

    // Во время диалогов прячем кнопки и сбрасываем ввод,
    // чтобы тап по реплике не «застревал» как прыжок/движение.
    scene.events.on("dialog-open", this.onDialogOpen, this)
    scene.events.on("dialog-close", this.onDialogClose, this)
    // Снимаем слушатели при остановке/рестарте сцены, чтобы не накапливались.
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      scene.events.off("dialog-open", this.onDialogOpen, this)
      scene.events.off("dialog-close", this.onDialogClose, this)
    })
  }

  private onDialogOpen() {
    this.left = false
    this.right = false
    this.jumpQueued = false
    this.setVisible(false)
  }

  private onDialogClose() {
    this.setVisible(true)
  }

  // Возвращает true один раз после нажатия кнопки прыжка.
  consumeJump(): boolean {
    if (this.jumpQueued) {
      this.jumpQueued = false
      return true
    }
    return false
  }

  setVisible(v: boolean) {
    for (const o of this.objects) {
      ;(o as unknown as Phaser.GameObjects.Components.Visible).setVisible(v)
    }
  }
}
