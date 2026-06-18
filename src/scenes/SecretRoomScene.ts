import Phaser from "phaser"
import { DialogBox } from "../ui/Dialog"
import { TouchControls } from "../ui/TouchControls"

// 🥚 Секретная пасхалка: уютная комната Сырка (вход — уход назад в Главе 1).
// Сырок предлагает молоко -> выбор Да/Нет -> мини кат-сцена -> рестарт игры.

const W = 1280
const H = 720
const FLOOR_Y = 560 // верх пола

const SYROK_X = 360
const TABLE_X = 560
const CUP_X = 545
const JUG_X = 470
const CUP_Y = FLOOR_Y - 66

export class SecretRoomScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private touch!: TouchControls
  private dialog!: DialogBox
  private music?: Phaser.Sound.BaseSound

  private syrok!: Phaser.GameObjects.Image
  private cup!: Phaser.GameObjects.Container
  private liquid!: Phaser.GameObjects.Rectangle
  private jug!: Phaser.GameObjects.Container

  private canMove = false
  private talked = false
  private choiceActive = false
  private choiceUi: Phaser.GameObjects.GameObject[] = []
  private leaving = false

  constructor() {
    super("SecretRoomScene")
  }

  create() {
    this.canMove = false
    this.talked = false
    this.choiceActive = false
    this.choiceUi = []
    this.leaving = false

    this.buildRoom()

    // Анимация бега
    if (!this.anims.exists("player-run")) {
      this.anims.create({
        key: "player-run",
        frames: this.anims.generateFrameNumbers("player", { start: 0, end: 5 }),
        frameRate: 12,
        repeat: -1,
      })
    }

    // Сырок (аватарка), мягко покачивается
    this.syrok = this.add
      .image(SYROK_X, FLOOR_Y - 70, "syrok")
      .setDisplaySize(140, 140)
      .setDepth(6)
    this.syrok.setOrigin(0.5, 0.5)
    this.add
      .rectangle(SYROK_X, FLOOR_Y - 70, 146, 146)
      .setStrokeStyle(3, 0xff8fc7)
      .setDepth(6)
    this.tweens.add({
      targets: this.syrok,
      y: FLOOR_Y - 78,
      duration: 1300,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    })

    this.buildTable()

    // Игрок появляется справа (как «возврат назад»)
    this.player = this.physics.add.sprite(1060, FLOOR_Y - 32, "player")
    ;(this.player.body as Phaser.Physics.Arcade.Body).setAllowGravity(false)
    this.player.setFlipX(true)
    this.player.setDepth(8)

    // Управление
    this.dialog = new DialogBox(this)
    this.cursors = this.input.keyboard!.createCursorKeys()
    this.touch = new TouchControls(this)
    this.input.keyboard!.on("keydown-SPACE", () => {
      if (this.dialog.active) this.dialog.next()
    })
    this.input.keyboard!.on("keydown-ENTER", () => {
      if (this.dialog.active) this.dialog.next()
    })
    this.input.keyboard!.on("keydown-ONE", () => this.choose(true))
    this.input.keyboard!.on("keydown-TWO", () => this.choose(false))
    this.input.keyboard!.addKey("F").on("down", () => this.scale.toggleFullscreen())

    // Уютная музыка
    this.music = this.sound.add("music_happy", { loop: true, volume: 0.4 })
    this.music.play()

    // Появление «как в Sonic.exe» — глитч-вспышка
    this.glitchAppear()
  }

  // ---------- КОМНАТА ----------
  private buildRoom() {
    this.add.rectangle(640, 360, 1280, 720, 0x241a2b).setDepth(-20)
    // тёплый свет
    this.add.ellipse(640, 300, 900, 520, 0x3a2740, 0.6).setDepth(-19)
    // пол
    this.add.rectangle(640, (FLOOR_Y + H) / 2, 1280, H - FLOOR_Y, 0x3a2a3f).setDepth(-10)
    this.add.rectangle(640, FLOOR_Y, 1280, 4, 0x53405e).setDepth(-9)
    // ковёр
    this.add.ellipse(640, FLOOR_Y + 70, 760, 80, 0x5a2440, 0.7).setDepth(-8)

    // картинка-сердечко на стене
    this.add.rectangle(900, 200, 120, 120, 0x2e2236).setStrokeStyle(4, 0x6b4f78).setDepth(-7)
    this.add.text(900, 200, "♥", { fontSize: "60px", color: "#ff7ab0" }).setOrigin(0.5).setDepth(-7)
    // окно
    this.add.rectangle(220, 200, 150, 120, 0x16101d).setStrokeStyle(5, 0x6b4f78).setDepth(-7)
    this.add.rectangle(220, 200, 4, 120, 0x6b4f78).setDepth(-7)
    this.add.rectangle(220, 200, 150, 4, 0x6b4f78).setDepth(-7)

    // плавающие пылинки
    for (let i = 0; i < 18; i++) {
      const d = this.add
        .circle(Phaser.Math.Between(0, W), Phaser.Math.Between(60, FLOOR_Y), 2, 0xffe6f2, 0.5)
        .setDepth(-6)
      this.tweens.add({
        targets: d,
        y: d.y - Phaser.Math.Between(20, 60),
        alpha: 0,
        duration: Phaser.Math.Between(2600, 5200),
        repeat: -1,
        delay: Phaser.Math.Between(0, 2500),
      })
    }
  }

  private buildTable() {
    // столик
    const topY = FLOOR_Y - 40
    this.add.rectangle(TABLE_X, topY, 230, 18, 0x6b4422).setStrokeStyle(2, 0x4a2e16).setDepth(4)
    this.add.rectangle(TABLE_X - 90, topY + 45, 12, 80, 0x5a3a1d).setDepth(3)
    this.add.rectangle(TABLE_X + 90, topY + 45, 12, 80, 0x5a3a1d).setDepth(3)

    // чашка с чаем (контейнер, можно двигать)
    const cy = CUP_Y
    const saucer = this.add.ellipse(0, 26, 70, 14, 0xeaeaea)
    const body = this.add.rectangle(0, 0, 48, 44, 0xffffff).setStrokeStyle(3, 0xcfcfcf)
    this.liquid = this.add.rectangle(0, -8, 38, 22, 0x6a3b12) // чай
    const handle = this.add.circle(28, 0, 12).setStrokeStyle(5, 0xffffff)
    this.cup = this.add.container(CUP_X, cy, [saucer, body, this.liquid, handle]).setDepth(5)
    // пар
    this.steam(CUP_X, cy - 26)

    // кувшин молока
    const jbody = this.add.rectangle(0, 0, 34, 44, 0xffffff).setStrokeStyle(2, 0xdcdcdc)
    const jneck = this.add.rectangle(12, -24, 14, 12, 0xffffff).setStrokeStyle(2, 0xdcdcdc)
    const jlabel = this.add.rectangle(0, 6, 26, 14, 0x7ec8ff)
    this.jug = this.add.container(JUG_X, cy + 2, [jbody, jneck, jlabel]).setDepth(5)
  }

  private steam(x: number, y: number) {
    for (let i = 0; i < 3; i++) {
      const s = this.add.circle(x + (i - 1) * 8, y, 4, 0xffffff, 0.35).setDepth(5)
      this.tweens.add({
        targets: s,
        y: y - 40,
        alpha: 0,
        duration: 1600,
        repeat: -1,
        delay: i * 500,
        ease: "Sine.easeOut",
      })
    }
  }

  private glitchAppear() {
    this.cameras.main.flash(400, 255, 255, 255)
    for (let i = 0; i < 8; i++) {
      const ln = this.add
        .rectangle(640, Phaser.Math.Between(60, H - 60), 1280, Phaser.Math.Between(3, 14), 0xffffff, 0.5)
        .setDepth(50)
      this.tweens.add({
        targets: ln,
        alpha: 0,
        duration: Phaser.Math.Between(200, 500),
        delay: Phaser.Math.Between(0, 250),
        onComplete: () => ln.destroy(),
      })
    }
    this.time.delayedCall(550, () => {
      this.canMove = true
      const hint = this.add
        .text(640, 120, "...где это я? (Иди влево к Сырку)", {
          fontFamily: "monospace",
          fontSize: "22px",
          color: "#ffd0ec",
          stroke: "#000000",
          strokeThickness: 4,
        })
        .setOrigin(0.5)
        .setDepth(40)
      this.tweens.add({ targets: hint, alpha: 0, delay: 3500, duration: 1000, onComplete: () => hint.destroy() })
    })
  }

  // ---------- ДВИЖЕНИЕ ----------
  update() {
    if (!this.canMove || this.dialog.active || this.choiceActive || this.leaving) {
      if (this.player) {
        this.player.stop()
        this.player.setFrame(0)
      }
      return
    }
    const left = this.cursors.left.isDown || this.touch.left
    const right = this.cursors.right.isDown || this.touch.right
    if (left) {
      this.player.x -= 4
      this.player.setFlipX(true)
      this.player.play("player-run", true)
    } else if (right) {
      this.player.x += 4
      this.player.setFlipX(false)
      this.player.play("player-run", true)
    } else {
      this.player.stop()
      this.player.setFrame(0)
    }
    this.player.x = Phaser.Math.Clamp(this.player.x, 120, 1160)
    // подошли к Сырку/столу -> приветствие
    if (!this.talked && this.player.x <= TABLE_X + 170) this.greet()
  }

  // ---------- ДИАЛОГ И ВЫБОР ----------
  private greet() {
    this.talked = true
    this.canMove = false
    this.player.stop()
    this.player.setFrame(0)
    this.player.setFlipX(true)
    this.dialog.show(
      [{ speaker: "Сырок", text: "Приветик) Будешь чай с молоком? :3", portrait: "syrok" }],
      () => this.showChoice()
    )
  }

  private showChoice() {
    this.choiceActive = true
    this.touch.setVisible(false)
    const panel = this.add
      .rectangle(640, 560, 720, 170, 0x000000, 0.85)
      .setStrokeStyle(3, 0xff8fc7)
      .setScrollFactor(0)
      .setDepth(38)
    const title = this.add
      .text(640, 502, "Будешь чай с молоком? :3", {
        fontFamily: "monospace",
        fontSize: "24px",
        color: "#ffd0ec",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(39)
    const b1 = this.makeButton(470, 578, "1 — ДА :3", 0x227722, () => this.choose(true))
    const b2 = this.makeButton(810, 578, "2 — НЕТ", 0x772222, () => this.choose(false))
    this.choiceUi = [panel, title, b1, b2]
  }

  private choose(yes: boolean) {
    if (!this.choiceActive) return
    this.choiceActive = false
    this.choiceUi.forEach((o) => o.destroy())
    this.choiceUi = []
    if (yes) this.pathYes()
    else this.pathNo()
  }

  // ---------- ПУТЬ: ДА ----------
  private pathYes() {
    this.dialog.show(
      [{ speaker: "Сырок", text: "Хорошо)", portrait: "syrok" }],
      () => this.pourSequence()
    )
  }

  private pourSequence() {
    this.sound.play("click", { volume: 0.3 })
    // кувшин Сырка наклоняется к чашке (льёт со своей, левой стороны)
    this.tweens.add({
      targets: this.jug,
      angle: 38,
      x: CUP_X - 46,
      duration: 500,
      yoyo: true,
      hold: 700,
    })
    // струя молока
    this.time.delayedCall(480, () => {
      const stream = this.add
        .rectangle(CUP_X - 6, CUP_Y - 34, 5, 0, 0xffffff)
        .setOrigin(0.5, 0)
        .setDepth(6)
      this.tweens.add({
        targets: stream,
        height: 34,
        duration: 250,
        yoyo: true,
        hold: 350,
        onComplete: () => stream.destroy(),
      })
      // чай становится «чаем с молоком»
      this.time.delayedCall(300, () => this.liquid.setFillStyle(0xc9a87a))
    })
    // отдаёт чашку игроку
    this.time.delayedCall(1550, () => this.giveCup())
  }

  private giveCup() {
    this.tweens.add({
      targets: this.cup,
      x: this.player.x - 38,
      y: this.player.y - 12,
      duration: 700,
      ease: "Sine.easeInOut",
      onComplete: () => this.drink(),
    })
  }

  private drink() {
    this.sound.play("click", { volume: 0.2 })
    // наклоняем чашку и опустошаем
    this.tweens.add({ targets: this.cup, angle: 32, duration: 500, yoyo: true, hold: 300 })
    this.tweens.add({
      targets: this.liquid,
      scaleY: 0,
      duration: 700,
      delay: 220,
      onComplete: () => this.returnCup(),
    })
  }

  private returnCup() {
    this.tweens.add({
      targets: this.cup,
      x: CUP_X,
      y: CUP_Y,
      angle: 0,
      duration: 600,
      ease: "Sine.easeInOut",
      onComplete: () => this.thanks(),
    })
  }

  private thanks() {
    this.sound.play("ring_collect", { volume: 0.5 })
    this.dialog.show(
      [
        { speaker: "Стикмен", text: "Спасибо большое!", portrait: "portrait_player" },
        { speaker: "Сырок", text: "Пожалуйста ^^", portrait: "syrok" },
      ],
      () => this.restartGame()
    )
  }

  // ---------- ПУТЬ: НЕТ ----------
  private pathNo() {
    this.dialog.show(
      [{ speaker: "Сырок", text: "Эх, жаль... Ну пока)", portrait: "syrok" }],
      () => this.restartGame()
    )
  }

  // ---------- РЕСТАРТ ИГРЫ ----------
  private restartGame() {
    if (this.leaving) return
    this.leaving = true
    this.cameras.main.fadeOut(800, 0, 0, 0)
    this.cameras.main.once("camerafadeoutcomplete", () => {
      if (this.music && this.music.isPlaying) this.music.stop()
      this.scene.start("GameScene")
    })
  }

  // ---------- ВСПОМОГАТЕЛЬНОЕ ----------
  private makeButton(
    x: number,
    y: number,
    label: string,
    color: number,
    onClick: () => void
  ) {
    const bw = 300
    const bh = 56
    const bg = this.add.rectangle(0, 0, bw, bh, color, 0.92).setStrokeStyle(3, 0xffffff)
    const txt = this.add
      .text(0, 0, label, { fontFamily: "monospace", fontSize: "22px", color: "#ffffff" })
      .setOrigin(0.5)
    const c = this.add
      .container(x, y, [bg, txt])
      .setScrollFactor(0)
      .setDepth(40)
      .setSize(bw, bh)
    c.setInteractive(
      new Phaser.Geom.Rectangle(-bw / 2, -bh / 2, bw, bh),
      Phaser.Geom.Rectangle.Contains
    )
    c.on("pointerover", () => bg.setFillStyle(color, 1))
    c.on("pointerout", () => bg.setFillStyle(color, 0.92))
    c.on("pointerdown", () => {
      this.sound.play("click", { volume: 0.5 })
      onClick()
    })
    return c
  }
}

