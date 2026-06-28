import Phaser from "phaser"
import { makeMenuButton } from "../ui/MenuButton"
import { enterImmersive, installInputResizeFix } from "../fullscreen"

// Экран ВЫБОРА УРОВНЯ (главы). Заменяет старый «Выбор персонажа».
// Каждая карточка показывает нарисованное превью главы (из настоящих ассетов игры)
// и при клике запускает соответствующую сцену-главу.

type LevelInfo = { key: string; num: number; name: string; accent: number }

const LEVELS: LevelInfo[] = [
  { key: "GameScene", num: 1, name: "«Прогулка»", accent: 0x5fd16a },
  { key: "ChaseScene", num: 2, name: "«Огонь»", accent: 0xff7a1a },
  { key: "BattleScene", num: 3, name: "«Битва»", accent: 0xff3b3b },
  { key: "RunnerScene", num: 4, name: "«Руины»", accent: 0xb84aff },
  { key: "FinaleScene", num: 5, name: "«Кольцо»", accent: 0xffcc00 },
]

const CARD_W = 200
const CARD_H = 188
const PREVIEW_W = 184
const PREVIEW_H = 100
const PREVIEW_CY = -34 // локальный Y центра превью внутри карточки

export class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super("LevelSelectScene")
  }

  create() {
    // Поворот/ресайз экрана пересчитывает зоны нажатия (как в меню).
    installInputResizeFix(this)
    this.continueMenuMusic()
    this.buildBackground()

    this.add
      .text(640, 66, "УРОВНИ", {
        fontFamily: "monospace",
        fontSize: "52px",
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
    this.add
      .text(640, 116, "Выбери главу", {
        fontFamily: "monospace",
        fontSize: "22px",
        color: "#9a9a9a",
      })
      .setOrigin(0.5)

    // Раскладка карточек в ряд по центру
    const n = LEVELS.length
    const gap = 22
    const total = n * CARD_W + (n - 1) * gap
    const startX = (1280 - total) / 2 + CARD_W / 2
    const cardY = 382
    LEVELS.forEach((lvl, i) => this.makeCard(startX + i * (CARD_W + gap), cardY, lvl, i))

    makeMenuButton(this, 640, 668, "← НАЗАД", {
      width: 240,
      height: 58,
      fontSize: 26,
      fill: 0x2a2a2a,
      fillHover: 0x444444,
      stroke: 0x888888,
      onClick: () => {
        this.cameras.main.fadeOut(350, 0, 0, 0)
        this.time.delayedCall(370, () => this.scene.start("MenuScene"))
      },
    })

    this.cameras.main.fadeIn(450, 0, 0, 0)
  }

  // ---------- ФОН ----------
  private buildBackground() {
    this.add.rectangle(640, 360, 1280, 720, 0x070707).setDepth(-2)
    this.add.ellipse(640, 360, 1100, 620, 0x1a0008, 0.5).setDepth(-1)
    for (let i = 0; i < 14; i++) {
      const x = Phaser.Math.Between(0, 1280)
      const y = Phaser.Math.Between(360, 760)
      const e = this.add.circle(x, y, Phaser.Math.Between(1, 3), 0xff5522, 0.5).setDepth(-1)
      this.tweens.add({
        targets: e,
        y: y - Phaser.Math.Between(220, 480),
        alpha: 0,
        duration: Phaser.Math.Between(3500, 7000),
        repeat: -1,
        delay: Phaser.Math.Between(0, 3000),
      })
    }
  }

  // ---------- МУЗЫКА ----------
  private continueMenuMusic() {
    let menuMusic = this.sound.get("music_menu")
    if (!menuMusic) menuMusic = this.sound.add("music_menu", { loop: true, volume: 0.4 })
    const startMusic = () => {
      if (menuMusic && !menuMusic.isPlaying) menuMusic.play()
    }
    if (this.sound.locked) this.sound.once(Phaser.Sound.Events.UNLOCKED, startMusic)
    else startMusic()
  }

  // ---------- КАРТОЧКА ГЛАВЫ ----------
  private makeCard(x: number, y: number, lvl: LevelInfo, idx: number) {
    const accent = lvl.accent

    const shadow = this.add.rectangle(0, 7, CARD_W, CARD_H, 0x000000, 0.45)
    const panel = this.add.rectangle(0, 0, CARD_W, CARD_H, 0x12121a).setStrokeStyle(3, accent, 0.9)

    const preview = this.drawPreview(idx, 0, PREVIEW_CY, PREVIEW_W, PREVIEW_H)
    const frame = this.add
      .rectangle(0, PREVIEW_CY, PREVIEW_W, PREVIEW_H, 0x000000, 0)
      .setStrokeStyle(2, accent, 0.55)

    const badge = this.add.circle(-CARD_W / 2 + 22, -CARD_H / 2 + 22, 15, accent)
    const badgeTxt = this.add
      .text(-CARD_W / 2 + 22, -CARD_H / 2 + 21, String(lvl.num), {
        fontFamily: "monospace",
        fontSize: "20px",
        color: "#000000",
        fontStyle: "bold",
      })
      .setOrigin(0.5)

    const chap = this.add
      .text(0, 42, `ГЛАВА ${lvl.num}`, {
        fontFamily: "monospace",
        fontSize: "20px",
        color: "#dddddd",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
    const name = this.add
      .text(0, 68, lvl.name, {
        fontFamily: "monospace",
        fontSize: "19px",
        color: hexToCss(accent),
      })
      .setOrigin(0.5)

    const c = this.add
      .container(x, y, [shadow, panel, ...preview, frame, badge, badgeTxt, chap, name])
      .setSize(CARD_W, CARD_H)

    const pad = 6
    c.setInteractive(
      new Phaser.Geom.Rectangle(-CARD_W / 2 - pad, -CARD_H / 2 - pad, CARD_W + pad * 2, CARD_H + pad * 2),
      Phaser.Geom.Rectangle.Contains
    )
    if (c.input) c.input.cursor = "pointer"

    const enter = () => {
      panel.setStrokeStyle(4, accent, 1)
      panel.setFillStyle(0x1c1c28)
      this.tweens.add({ targets: c, scaleX: 1.06, scaleY: 1.06, duration: 120, ease: "Quad.easeOut" })
    }
    const leave = () => {
      panel.setStrokeStyle(3, accent, 0.9)
      panel.setFillStyle(0x12121a)
      this.tweens.add({ targets: c, scaleX: 1, scaleY: 1, duration: 120, ease: "Quad.easeOut" })
    }
    c.on("pointerover", enter)
    c.on("pointerout", leave)
    c.on("pointerdown", () => {
      this.tweens.add({ targets: c, scaleX: 0.97, scaleY: 0.97, duration: 70, yoyo: true })
      try {
        this.sound.play("click", { volume: 0.5 })
      } catch {
        // звук может быть ещё не разблокирован — не критично
      }
      this.startLevel(lvl.key)
    })
  }

  private startLevel(key: string) {
    // музыку меню останавливаем, чтобы она не накладывалась на музыку главы
    const m = this.sound.get("music_menu")
    if (m && m.isPlaying) m.stop()
    enterImmersive(this)
    this.cameras.main.fadeOut(400, 0, 0, 0)
    this.time.delayedCall(420, () => this.scene.start(key))
  }

  // ---------- ПРЕВЬЮ ГЛАВ (рисуем из настоящих ассетов игры) ----------
  private drawPreview(
    idx: number,
    cx: number,
    cy: number,
    bw: number,
    bh: number
  ): Phaser.GameObjects.GameObject[] {
    const top = cy - bh / 2
    const bottom = cy + bh / 2
    const left = cx - bw / 2
    const right = cx + bw / 2
    const o: Phaser.GameObjects.GameObject[] = []

    switch (idx) {
      // ГЛАВА 1 — «Прогулка»: солнечный день, деревья, стикмен
      case 0: {
        o.push(this.add.rectangle(cx, cy, bw, bh, 0x87ceeb))
        o.push(this.add.circle(right - 26, top + 22, 12, 0xfff2a0))
        o.push(this.add.image(left + 40, top + 26, "cloud").setDisplaySize(46, 22))
        o.push(this.add.image(right - 50, top + 40, "cloud").setDisplaySize(38, 18).setAlpha(0.85))
        o.push(this.add.rectangle(cx, bottom - 8, bw, 18, 0x3a9b46))
        o.push(this.add.image(left + 32, bottom - 14, "tree").setOrigin(0.5, 1).setDisplaySize(30, 44))
        o.push(this.add.image(cx + 24, bottom - 14, "player").setOrigin(0.5, 1).setDisplaySize(20, 28))
        break
      }
      // ГЛАВА 2 — «Огонь»: горящий лес, пламя, угли
      case 1: {
        o.push(this.add.rectangle(cx, cy, bw, bh, 0x2a0500))
        o.push(this.add.rectangle(cx, bottom - 18, bw, 36, 0x661500).setAlpha(0.6))
        o.push(this.add.rectangle(cx, bottom - 8, bw, 16, 0x140a06))
        o.push(
          this.add.image(left + 30, bottom - 14, "tree").setOrigin(0.5, 1).setDisplaySize(28, 42).setTint(0x180808)
        )
        o.push(this.add.image(cx - 8, bottom - 11, "fire").setOrigin(0.5, 1).setDisplaySize(26, 36))
        o.push(this.add.image(cx + 34, bottom - 12, "fire").setOrigin(0.5, 1).setDisplaySize(20, 28))
        o.push(this.add.image(left + 30, bottom - 13, "fire").setOrigin(0.5, 1).setDisplaySize(18, 26))
        for (let i = 0; i < 6; i++) {
          o.push(this.add.circle(left + 18 + i * 26, cy - 18 - (i % 3) * 10, 2, 0xff7a1a, 0.9))
        }
        break
      }
      // ГЛАВА 3 — «Битва»: стикмен против STICKMAN.EXE, полоски HP
      case 2: {
        o.push(this.add.rectangle(cx, cy, bw, bh, 0x2a0303))
        o.push(this.add.rectangle(cx, bottom - 20, bw, 40, 0x550808).setAlpha(0.5))
        o.push(this.add.rectangle(cx, bottom - 8, bw, 16, 0x180a0a))
        o.push(this.add.image(cx - 46, bottom - 14, "player").setOrigin(0.5, 1).setDisplaySize(22, 30))
        o.push(
          this.add.image(cx + 46, bottom - 14, "villain_evil").setOrigin(0.5, 1).setDisplaySize(30, 40).setFlipX(true)
        )
        // HP игрока
        o.push(this.add.rectangle(cx - 46, top + 16, 44, 6, 0x440000))
        o.push(this.add.rectangle(cx - 68, top + 16, 32, 5, 0x33cc33).setOrigin(0, 0.5))
        // HP врага
        o.push(this.add.rectangle(cx + 46, top + 16, 44, 6, 0x440000))
        o.push(this.add.rectangle(cx + 24, top + 16, 38, 5, 0xcc2a2a).setOrigin(0, 0.5))
        break
      }
      // ГЛАВА 4 — «Руины»: тёмный разрушенный мир, лазер, глитчи
      case 3: {
        o.push(this.add.rectangle(cx, cy, bw, bh, 0x140020))
        o.push(this.add.rectangle(cx, bottom - 22, bw, 44, 0x3a0010))
        o.push(this.add.rectangle(cx, cy + 4, bw, 3, 0xff2a2a).setAlpha(0.6))
        const heights = [26, 40, 30, 52, 34, 46, 28]
        for (let i = 0; i < heights.length; i++) {
          const bx = left + 14 + i * 26
          o.push(this.add.rectangle(bx, bottom - 12, 18, heights[i], 0x05000a).setOrigin(0.5, 1))
        }
        o.push(this.add.rectangle(cx + 10, cy - 6, 66, 5, 0xff3344))
        o.push(this.add.rectangle(cx + 10, cy - 6, 66, 2, 0xffd0d0))
        for (let i = 0; i < 6; i++) {
          o.push(this.add.rectangle(left + 16 + i * 24, cy - 24 - (i % 2) * 8, 3, 3, 0xff3344).setAlpha(0.8))
        }
        o.push(this.add.image(left + 30, bottom - 14, "player").setOrigin(0.5, 1).setDisplaySize(20, 28))
        break
      }
      // ГЛАВА 5 — «Кольцо»: большое золотое кольцо, платформы, шип
      default: {
        o.push(this.add.rectangle(cx, cy, bw, bh, 0x0a0612))
        o.push(this.add.rectangle(cx, bottom - 8, bw, 16, 0x150a1f))
        const rx = cx + 16
        const ry = cy - 4
        o.push(this.add.circle(rx, ry, 34, 0xffdd33, 0.16))
        o.push(this.add.circle(rx, ry, 27, 0x000000, 0).setStrokeStyle(7, 0xffcc00))
        o.push(this.add.circle(rx, ry, 27, 0x000000, 0).setStrokeStyle(2, 0xfff3a0))
        o.push(this.add.rectangle(left + 26, bottom - 4, 34, 10, 0x6b4422).setStrokeStyle(2, 0x4a2e16))
        o.push(this.add.rectangle(cx - 10, cy + 22, 30, 10, 0x6b4422).setStrokeStyle(2, 0x4a2e16))
        o.push(this.add.image(left + 52, bottom - 12, "spike").setOrigin(0.5, 1).setDisplaySize(16, 16))
        o.push(this.add.image(left + 24, cy + 16, "player").setOrigin(0.5, 1).setDisplaySize(18, 26))
        break
      }
    }
    return o
  }
}

function hexToCss(color: number): string {
  return "#" + color.toString(16).padStart(6, "0")
}
