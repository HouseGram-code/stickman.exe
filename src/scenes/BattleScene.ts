import Phaser from "phaser"
import { DialogBox, DialogLine } from "../ui/Dialog"

const W = 1280
const H = 720
const GROUND_TOP = H - 64
const PLAYER_X = 440
const EXE_X = 950

type Turn = "intro" | "player" | "enemy" | "over"

export class BattleScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite
  private exe!: Phaser.GameObjects.Sprite
  private ground!: Phaser.Physics.Arcade.StaticGroup
  private dialog!: DialogBox
  private music?: Phaser.Sound.BaseSound

  private maxPlayerHp = 100
  private maxExeHp = 120
  private playerHp = 100
  private exeHp = 120
  private playerFill!: Phaser.GameObjects.Rectangle
  private exeFill!: Phaser.GameObjects.Rectangle
  private playerHpText!: Phaser.GameObjects.Text
  private exeHpText!: Phaser.GameObjects.Text

  private turn: Turn = "intro"
  private busy = false
  private exeBlinded = false
  private choiceActive = false
  private choiceUi: Phaser.GameObjects.GameObject[] = []
  private btnRock?: Phaser.GameObjects.Container
  private btnDirt?: Phaser.GameObjects.Container

  constructor() {
    super("BattleScene")
  }

  create() {
    this.playerHp = this.maxPlayerHp
    this.exeHp = this.maxExeHp
    this.turn = "intro"
    this.busy = false
    this.exeBlinded = false
    this.choiceActive = false
    this.choiceUi = []
    this.btnRock = undefined
    this.btnDirt = undefined

    // Красное небо
    this.add.rectangle(640, 360, 1280, 720, 0x2a0303).setScrollFactor(0).setDepth(-20)
    this.add.rectangle(640, 720, 1280, 420, 0x550808, 0.55).setScrollFactor(0).setDepth(-19)

    // Угли
    for (let i = 0; i < 40; i++) {
      const ex = Phaser.Math.Between(0, W)
      const ey = Phaser.Math.Between(160, H)
      const e = this.add.rectangle(ex, ey, 3, 3, 0xff6a1a, 0.8).setDepth(-4)
      this.tweens.add({
        targets: e,
        y: ey - 220,
        alpha: 0,
        duration: Phaser.Math.Between(2200, 4200),
        repeat: -1,
        delay: Phaser.Math.Between(0, 2500),
      })
    }

    // Земля
    this.ground = this.physics.add.staticGroup()
    for (let x = 0; x <= W; x += 64) {
      this.ground.create(x, H - 32, "tile_dark").refreshBody()
    }

    // Анимация бега
    if (!this.anims.exists("player-run")) {
      this.anims.create({
        key: "player-run",
        frames: this.anims.generateFrameNumbers("player", { start: 0, end: 5 }),
        frameRate: 12,
        repeat: -1,
      })
    }

    // Игрок (заходит слева)
    this.player = this.physics.add.sprite(120, GROUND_TOP - 30, "player")
    this.player.setCollideWorldBounds(true)
    this.player.setDepth(8)
    this.player.setFlipX(false)
    this.physics.add.collider(this.player, this.ground)

    // Стикмен.exe
    this.exe = this.add.sprite(EXE_X, GROUND_TOP - 50, "villain_evil")
    this.exe.setScale(1.5)
    this.exe.setFlipX(true)
    this.exe.setDepth(9)

    this.dialog = new DialogBox(this)

    // Управление
    this.input.keyboard!.on("keydown-SPACE", () => {
      if (this.dialog.active) this.dialog.next()
    })
    this.input.keyboard!.on("keydown-ENTER", () => {
      if (this.dialog.active) this.dialog.next()
    })
    this.input.keyboard!.on("keydown-ONE", () => this.tryChoose("fight"))
    this.input.keyboard!.on("keydown-TWO", () => this.tryChoose("curse"))
    this.input.keyboard!.addKey("F").on("down", () => this.scale.toggleFullscreen())

    // Музыка
    this.music = this.sound.add("ambient_horror", { loop: true, volume: 0.35 })
    this.music.play()

    // Титр "Спустя 2 часа..."
    const card = this.add
      .rectangle(640, 360, 1280, 720, 0x000000)
      .setScrollFactor(0)
      .setDepth(4000)
    const ct = this.add
      .text(640, 360, "Спустя 2 часа...", {
        fontFamily: "monospace",
        fontSize: "42px",
        color: "#cccccc",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(4001)
    this.cameras.main.fadeIn(800, 0, 0, 0)
    this.time.delayedCall(2300, () => {
      this.tweens.add({
        targets: [card, ct],
        alpha: 0,
        duration: 900,
        onComplete: () => {
          card.destroy()
          ct.destroy()
          this.startWalkIn()
        },
      })
    })
  }

  private startWalkIn() {
    this.player.play("player-run", true)
    this.tweens.add({
      targets: this.player,
      x: PLAYER_X,
      duration: 1500,
      onComplete: () => {
        this.player.stop()
        this.player.setFrame(0)
        this.talk()
      },
    })
  }

  private talk() {
    this.dialog.show(
      [
        { speaker: "Стикмен", text: "Опять ты... Сколько можно за мной гоняться?!", portrait: "portrait_player" },
        { speaker: "СТИКМЕН.EXE", text: "Ты не сбежишь. Никогда. Этот мир теперь мой.", portrait: "portrait_villain_evil" },
        { speaker: "Стикмен", text: "Хватит бегать. В этот раз решаю я.", portrait: "portrait_player" },
      ],
      () => this.showChoice()
    )
  }

  // ---------- ВЫБОР ----------
  private showChoice() {
    this.turn = "intro"
    this.choiceActive = true

    const panel = this.add
      .rectangle(640, 540, 760, 200, 0x000000, 0.85)
      .setStrokeStyle(3, 0xaa0000)
      .setScrollFactor(0)
      .setDepth(38)
    const title = this.add
      .text(640, 470, "Что будешь делать?", {
        fontFamily: "monospace",
        fontSize: "26px",
        color: "#ffffff",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(39)

    const b1 = this.makeButton(640, 535, "1 — БОЙ", 0x227722, () =>
      this.tryChoose("fight")
    )
    const b2 = this.makeButton(640, 600, "2 — ПОСЛАТЬ ЕГО МАТОМ", 0x772222, () =>
      this.tryChoose("curse")
    )
    this.choiceUi = [panel, title, b1, b2]
  }

  private tryChoose(kind: "fight" | "curse") {
    if (!this.choiceActive) return
    this.choiceActive = false
    this.choiceUi.forEach((o) => o.destroy())
    this.choiceUi = []
    if (kind === "fight") this.chooseFight()
    else this.chooseCurse()
  }

  // ---------- ПУТЬ: ПОСЛАТЬ МАТОМ ----------
  private chooseCurse() {
    this.dialog.show(
      [
        { speaker: "Стикмен", text: "Да пошёл ты к чёрту, мерзкая тварь! Чтоб тебя стёрли с диска!", portrait: "portrait_player" },
        { speaker: "СТИКМЕН.EXE", text: "...Зря.", portrait: "portrait_villain_evil" },
      ],
      () =>
        this.deathSequence(
          [{ speaker: "???", text: "Хе-хе... жалкий человечишка.", portrait: "portrait_villain_evil" }],
          "Не туда ты выбрал, дружище...\nНо мне понравилось. Попробуй заново!"
        )
    )
  }

  // ---------- ПУТЬ: БОЙ ----------
  private chooseFight() {
    this.dialog.show(
      [
        { speaker: "Стикмен", text: "Ладно, тварь. Иди сюда! Я тебя больше не боюсь!", portrait: "portrait_player" },
        { speaker: "", text: "(Кидай КАМЕНЬ или ЗЕМЛЮ кнопками над головой. Земля может ослепить врага!)", portrait: "portrait_player" },
      ],
      () => this.startBattle()
    )
  }

  private startBattle() {
    if (this.music && this.music.isPlaying) this.music.stop()
    this.music = this.sound.add("chase_music", { loop: true, volume: 0.4 })
    this.music.play()

    // HP-бары
    this.playerFill = this.makeBar(300, "СТИКМЕН", 0xffcc00)
    this.exeFill = this.makeBar(980, "СТИКМЕН.EXE", 0xcc1111)
    this.playerHpText = this.add
      .text(300, 96, "", { fontFamily: "monospace", fontSize: "16px", color: "#ffffff" })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(31)
    this.exeHpText = this.add
      .text(980, 96, "", { fontFamily: "monospace", fontSize: "16px", color: "#ffffff" })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(31)

    // Кнопки над головой
    this.btnRock = this.makeButton(330, 470, "🪨 КАМЕНЬ", 0x555555, () =>
      this.playerAttack("rock")
    )
    this.btnDirt = this.makeButton(560, 470, "🟤 ЗЕМЛЯ", 0x6b3f1a, () =>
      this.playerAttack("dirt")
    )

    this.updateBars()
    this.playerTurn()
  }

  private makeBar(cx: number, label: string, color: number) {
    const bw = 280
    this.add
      .text(cx, 44, label, { fontFamily: "monospace", fontSize: "18px", color: "#ffffff" })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(30)
    this.add
      .rectangle(cx, 72, bw, 24, 0x222222)
      .setStrokeStyle(2, 0x000000)
      .setScrollFactor(0)
      .setDepth(30)
    return this.add
      .rectangle(cx - bw / 2, 72, bw, 24, color)
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(31)
  }

  private updateBars() {
    const bw = 280
    this.playerFill.setSize(Math.max(0, (this.playerHp / this.maxPlayerHp) * bw), 24)
    this.exeFill.setSize(Math.max(0, (this.exeHp / this.maxExeHp) * bw), 24)
    this.playerHpText.setText(`${this.playerHp} / ${this.maxPlayerHp}`)
    this.exeHpText.setText(`${this.exeHp} / ${this.maxExeHp}`)
  }

  private playerTurn() {
    this.turn = "player"
    this.busy = false
    this.setButtons(true)
    this.banner("ТВОЙ ХОД", "#ffee44", 900)
  }

  private playerAttack(type: "rock" | "dirt") {
    if (this.busy || this.turn !== "player") return
    this.busy = true
    this.setButtons(false)
    const fromX = this.player.x + 28
    const fromY = this.player.y - 30
    this.projectile(type, fromX, fromY, this.exe.x - 26, this.exe.y, () => {
      const dmg =
        type === "rock"
          ? Phaser.Math.Between(14, 24)
          : Phaser.Math.Between(7, 13)
      this.exeHp = Math.max(0, this.exeHp - dmg)
      this.updateBars()
      this.flash(this.exe, 0xffffff)
      this.cameras.main.shake(170, 0.012)
      this.floatText(this.exe.x, this.exe.y - 100, "-" + dmg, "#ffdd55")
      this.sound.play("hit", { volume: 0.7 })
      if (type === "dirt" && Math.random() < 0.5) {
        this.exeBlinded = true
        this.floatText(this.exe.x, this.exe.y - 140, "ОСЛЕПЛЁН!", "#88ccff")
      }
      this.time.delayedCall(650, () => {
        if (this.exeHp <= 0) this.win()
        else this.exeAttack()
      })
    })
  }

  private exeAttack() {
    this.turn = "enemy"
    if (this.exeBlinded) {
      this.exeBlinded = false
      this.floatText(this.player.x, this.player.y - 80, "ПРОМАХ!", "#66ff66")
      this.time.delayedCall(700, () => this.playerTurn())
      return
    }
    const ox = this.exe.x
    this.tweens.add({
      targets: this.exe,
      x: this.player.x + 95,
      duration: 240,
      yoyo: true,
      onYoyo: () => {
        const dmg = Phaser.Math.Between(9, 17)
        this.playerHp = Math.max(0, this.playerHp - dmg)
        this.updateBars()
        this.flash(this.player, 0xff3333)
        this.cameras.main.shake(220, 0.02)
        this.cameras.main.flash(160, 120, 0, 0)
        this.floatText(this.player.x, this.player.y - 80, "-" + dmg, "#ff5555")
        this.sound.play("hit", { volume: 0.7 })
      },
      onComplete: () => {
        this.exe.x = ox
        if (this.playerHp <= 0) {
          this.deathSequence(
            [{ speaker: "СТИКМЕН.EXE", text: "Сл����бак. Так я и думал.", portrait: "portrait_villain_evil" }],
            "Он оказался сильнее на этот раз...\nПопробуй заново, дружище!"
          )
        } else {
          this.playerTurn()
        }
      },
    })
  }

  // ---------- ПОБЕДА ----------
  private win() {
    this.turn = "over"
    this.setButtons(false)
    this.btnRock?.destroy()
    this.btnDirt?.destroy()
    this.sound.play("win", { volume: 0.6 })
    this.banner("ПОБЕДА!", "#ffee44", 1800)
    this.exe.setTint(0x333333)
    this.tweens.add({
      targets: this.exe,
      angle: 90,
      y: this.exe.y + 28,
      alpha: 0.55,
      duration: 700,
    })
    this.time.delayedCall(1500, () => {
      this.dialog.show(
        [
          { speaker: "Стикмен", text: "Получай! Вот тебе, тварь!", portrait: "portrait_player" },
          { speaker: "Стикмен", text: "Он... вырубился. Это мой шанс. Бежать! Сейчас же!", portrait: "portrait_player" },
        ],
        () => this.runAway()
      )
    })
  }

  private runAway() {
    this.player.setFlipX(false)
    this.player.play("player-run", true)
    // Полностью отключаем физику игрока, чтобы НИЧТО (границы/стены) не мешало убежать
    this.player.setCollideWorldBounds(false)
    const body = this.player.body as Phaser.Physics.Arcade.Body
    body.setAllowGravity(false)
    body.setVelocity(0, 0)
    body.enable = false
    this.tweens.add({
      targets: this.player,
      x: 1500,
      duration: 1800,
      ease: "Sine.easeIn",
      onComplete: () => {
        this.player.setVisible(false)
        this.finishChapter()
      },
    })
  }

  private finishChapter() {
    if (this.music && this.music.isPlaying) this.music.stop()
    const ov = this.add
      .rectangle(640, 360, 1280, 720, 0x000000)
      .setScrollFactor(0)
      .setDepth(4000)
      .setAlpha(0)
    this.tweens.add({
      targets: ov,
      alpha: 1,
      duration: 1200,
      onComplete: () => {
        this.bigText(280, "МОЛОДЕЦ! Ты его вырубил!", "40px", "#33dd33")
        this.bigText(350, "Но это ещё не конец этого кошмара...", "22px", "#aaaaaa")
        this.bigText(430, "Глава 3 завершена", "22px", "#888888")
        this.bigText(500, "ПРОДОЛЖЕНИЕ СЛЕДУЕТ...", "30px", "#cc0000")
        const next = this.makeButton(640, 590, "Глава 4 ▶", 0x227722, () => {
          if (this.music && this.music.isPlaying) this.music.stop()
          this.scene.start("RunnerScene")
        })
        next.setDepth(4500)
        this.menuButton(655, "В меню")
      },
    })
  }

  // ---------- СМЕРТЬ ----------
  private deathSequence(deathLines: DialogLine[], userMsg: string) {
    this.turn = "over"
    this.setButtons(false)
    this.btnRock?.destroy()
    this.btnDirt?.destroy()
    if (this.music && this.music.isPlaying) this.music.stop()
    this.sound.play("kill", { volume: 0.9 })
    this.cameras.main.shake(600, 0.03)
    const ov = this.add
      .rectangle(640, 360, 1280, 720, 0x000000)
      .setScrollFactor(0)
      .setDepth(50)
      .setAlpha(0)
    this.tweens.add({
      targets: ov,
      alpha: 1,
      duration: 700,
      onComplete: () => {
        this.add.rectangle(640, 360, 1280, 720, 0x1a0000).setScrollFactor(0).setDepth(51)
        // Лужа крови + тело
        this.add
          .image(560, GROUND_TOP + 6, "blood")
          .setOrigin(0.5, 1)
          .setDepth(55)
          .setScale(2.4)
          .setTint(0x990000)
        this.add
          .image(520, GROUND_TOP - 12, "player", 0)
          .setDepth(60)
          .setAngle(90)
          .setTint(0xaa8800)
        this.time.delayedCall(700, () => {
          this.dialog.show(deathLines, () => this.showUserMessage(userMsg))
        })
      },
    })
  }

  private showUserMessage(msg: string) {
    this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.93).setScrollFactor(0).setDepth(2000)
    this.add
      .text(640, 230, "СООБЩЕНИЕ ДЛЯ ИГРОКА", {
        fontFamily: "monospace",
        fontSize: "22px",
        color: "#ff4444",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(2001)
    this.add
      .text(640, 330, msg, {
        fontFamily: "monospace",
        fontSize: "26px",
        color: "#ffffff",
        align: "center",
        wordWrap: { width: 920 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(2001)
    this.add
      .text(640, 450, "🙂", { fontSize: "80px" })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(2001)
    this.add
      .text(640, 540, "Ха-ха-ха-ха!", {
        fontFamily: "monospace",
        fontSize: "30px",
        color: "#cc0000",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(2001)
    this.sound.play("laugh", { volume: 0.8 })
    this.menuButton(630, "Попробовать заново")
  }

  // ---------- ВСПОМОГАТЕЛЬНЫЕ ----------
  private menuButton(y: number, label: string) {
    const b = this.makeButton(640, y, label, 0x661111, () => {
      if (this.music && this.music.isPlaying) this.music.stop()
      this.scene.start("MenuScene")
    })
    b.setDepth(4500)
  }

  private bigText(y: number, txt: string, size: string, color: string) {
    this.add
      .text(640, y, txt, { fontFamily: "monospace", fontSize: size, color, align: "center" })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(4001)
  }

  private makeButton(
    x: number,
    y: number,
    label: string,
    color: number,
    onClick: () => void
  ) {
    const bw = 300
    const bh = 54
    const bg = this.add
      .rectangle(0, 0, bw, bh, color, 0.92)
      .setStrokeStyle(3, 0xffffff)
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

  private setButtons(on: boolean) {
    for (const b of [this.btnRock, this.btnDirt]) {
      if (!b) continue
      if (b.input) b.input.enabled = on
      b.setAlpha(on ? 1 : 0.45)
    }
  }

  private flash(spr: Phaser.GameObjects.Sprite, color: number) {
    spr.setTintFill(color)
    this.time.delayedCall(120, () => {
      spr.clearTint()
      if (spr === this.exe && this.turn === "over") this.exe.setTint(0x333333)
    })
  }

  private floatText(x: number, y: number, msg: string, color: string) {
    const t = this.add
      .text(x, y, msg, {
        fontFamily: "monospace",
        fontSize: "30px",
        color,
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(2600)
    this.tweens.add({
      targets: t,
      y: y - 60,
      alpha: 0,
      duration: 900,
      onComplete: () => t.destroy(),
    })
  }

  private banner(text: string, color: string, dur: number) {
    const t = this.add
      .text(640, 150, text, {
        fontFamily: "monospace",
        fontSize: "60px",
        color,
        stroke: "#000000",
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(2500)
    this.tweens.add({
      targets: t,
      scale: { from: 1, to: 1.2 },
      alpha: { from: 1, to: 0 },
      duration: dur,
      onComplete: () => t.destroy(),
    })
  }

  private projectile(
    type: "rock" | "dirt",
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    onHit: () => void
  ) {
    let obj: Phaser.GameObjects.Image | Phaser.GameObjects.Arc
    if (type === "rock") {
      obj = this.add
        .image(fromX, fromY, "rock")
        .setScale(0.14)
        .setTint(0x999999)
        .setDepth(45)
    } else {
      obj = this.add.circle(fromX, fromY, 10, 0x6b3f1a).setDepth(45)
    }
    this.tweens.add({
      targets: obj,
      x: toX,
      y: toY,
      rotation: type === "rock" ? 6 : 0,
      duration: 360,
      ease: "Quad.easeIn",
      onComplete: () => {
        obj.destroy()
        onHit()
      },
    })
  }
}
