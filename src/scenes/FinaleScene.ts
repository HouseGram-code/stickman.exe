import Phaser from "phaser"
import { DialogBox } from "../ui/Dialog"
import { TouchControls } from "../ui/TouchControls"

// ГЛАВА 5 — «КОЛЬЦО». Финал беты:
// побег -> платформинг (блоки/шипы как у Sonic.exe) -> большое кольцо ->
// засада STICKMAN.EXE -> бросок зелёного кольца -> телепорт через кольцо.

const W = 1280
const H = 720
const WORLD_W = 6200
const GROUND_TOP = H - 64
const RING_X = 5500
const RING_Y = GROUND_TOP - 170

type Phase =
  | "intro"
  | "run"
  | "reveal"
  | "approach"
  | "ambush"
  | "wakeup"
  | "confront"
  | "throw"
  | "escape"
  | "done"

export class FinaleScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite
  private exe!: Phaser.Physics.Arcade.Sprite
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private touch!: TouchControls
  private ground!: Phaser.Physics.Arcade.StaticGroup
  private blocks!: Phaser.Physics.Arcade.StaticGroup
  private spikes!: Phaser.Physics.Arcade.Group
  private dialog!: DialogBox

  private ring!: Phaser.GameObjects.Container
  private ringSprite!: Phaser.GameObjects.Image
  private ringGlow!: Phaser.GameObjects.Image

  private music?: Phaser.Sound.BaseSound
  private phase: Phase = "intro"
  private invuln = false

  constructor() {
    super("FinaleScene")
  }

  // ---------- ТЕКСТУРЫ КОЛЕЦ (генерируются кодом) ----------
  private makeRingTexture(
    key: string,
    radius: number,
    thickness: number,
    outer: number,
    inner: number
  ) {
    if (this.textures.exists(key)) return
    const size = (radius + thickness) * 2 + 6
    const c = size / 2
    const g = this.make.graphics({ x: 0, y: 0 }, false)
    g.lineStyle(thickness, outer, 1)
    g.strokeCircle(c, c, radius)
    g.lineStyle(Math.max(2, thickness * 0.4), inner, 1)
    g.strokeCircle(c, c, radius)
    g.lineStyle(Math.max(1, thickness * 0.18), 0xffffff, 0.9)
    g.strokeCircle(c, c, radius + thickness * 0.28)
    g.generateTexture(key, size, size)
    g.destroy()
  }

  private makeGlowTexture(key: string, radius: number, color: number) {
    if (this.textures.exists(key)) return
    const size = radius * 2 + 4
    const c = size / 2
    const g = this.make.graphics({ x: 0, y: 0 }, false)
    for (let r = radius; r > 0; r -= 2) {
      const a = (1 - r / radius) * 0.06
      g.fillStyle(color, a)
      g.fillCircle(c, c, r)
    }
    g.generateTexture(key, size, size)
    g.destroy()
  }

  create() {
    this.phase = "intro"
    this.invuln = false

    this.makeRingTexture("ring_gold", 120, 28, 0xffcc00, 0xfff3a0)
    this.makeRingTexture("ring_green", 20, 8, 0x33dd55, 0xbfffce)
    this.makeGlowTexture("ring_glow", 200, 0xffdd33)

    this.physics.world.setBounds(0, 0, WORLD_W, H)
    this.cameras.main.setBounds(0, 0, WORLD_W, H)

    this.buildWorld()
    this.buildBigRing()

    // Игрок
    this.player = this.physics.add.sprite(140, GROUND_TOP - 80, "player")
    this.player.setCollideWorldBounds(true)
    this.player.setDepth(10)
    this.physics.add.collider(this.player, this.ground)
    this.physics.add.collider(this.player, this.blocks)
    if (!this.anims.exists("player-run")) {
      this.anims.create({
        key: "player-run",
        frames: this.anims.generateFrameNumbers("player", { start: 0, end: 5 }),
        frameRate: 12,
        repeat: -1,
      })
    }

    // STICKMAN.EXE (пока за кадром справа)
    this.exe = this.physics.add.sprite(WORLD_W + 200, GROUND_TOP - 80, "villain_evil")
    ;(this.exe.body as Phaser.Physics.Arcade.Body).setAllowGravity(false)
    this.exe.setImmovable(true)
    this.exe.setDepth(11)
    this.exe.setVisible(false)

    // Шипы ранят игрока
    this.physics.add.overlap(
      this.player,
      this.spikes,
      () => this.hitSpike(),
      undefined,
      this
    )

    this.cameras.main.startFollow(this.player, true, 0.1, 0.1)
    this.cameras.main.fadeIn(700, 0, 0, 0)

    // Звук
    this.music = this.sound.add("finale_music", { loop: true, volume: 0.45 })
    this.music.play()

    // Управление / диалог
    this.dialog = new DialogBox(this)
    this.input.keyboard!.on("keydown-SPACE", () => {
      if (this.dialog.active) this.dialog.next()
    })
    this.input.keyboard!.on("keydown-ENTER", () => {
      if (this.dialog.active) this.dialog.next()
    })
    this.input.keyboard!.addKey("F").on("down", () => this.scale.toggleFullscreen())
    this.cursors = this.input.keyboard!.createCursorKeys()
    this.touch = new TouchControls(this)

    this.startIntro()
  }

  // ---------- ПОСТРОЕНИЕ МИРА ----------
  private buildWorld() {
    // Небо (мрачный градиент)
    this.add.rectangle(640, 220, 1280, 440, 0x0c0016).setScrollFactor(0).setDepth(-20)
    this.add.rectangle(640, 600, 1280, 240, 0x1a0008).setScrollFactor(0).setDepth(-19)
    this.add.rectangle(640, 452, 1280, 6, 0xff2a4a, 0.5).setScrollFactor(0).setDepth(-18)

    // Дальние силуэты (параллакс)
    for (let i = 0; i < 26; i++) {
      const bx = 60 + i * 240
      const bh = Phaser.Math.Between(90, 240)
      this.add
        .rectangle(bx, GROUND_TOP - bh / 2 + 12, 80, bh, 0x06000c)
        .setScrollFactor(0.4)
        .setDepth(-12)
    }

    // Глитч-частицы
    for (let i = 0; i < 40; i++) {
      const ex = Phaser.Math.Between(0, WORLD_W)
      const ey = Phaser.Math.Between(80, GROUND_TOP)
      const e = this.add.rectangle(ex, ey, 3, 3, 0xff3344, 0.6).setDepth(-4)
      this.tweens.add({
        targets: e,
        y: ey - 200,
        alpha: 0,
        duration: Phaser.Math.Between(2400, 4600),
        repeat: -1,
        delay: Phaser.Math.Between(0, 2500),
      })
    }

    // Земля
    this.ground = this.physics.add.staticGroup()
    for (let x = 0; x <= WORLD_W; x += 64) {
      this.ground.create(x, H - 32, "tile_dark").refreshBody()
    }

    // Платформы (блоки) и шипы — в стиле Sonic.exe
    this.blocks = this.physics.add.staticGroup()
    this.spikes = this.physics.add.group({ allowGravity: false, immovable: true })

    // Раскладка препятствий: [x шипов] и [x, y платформы]
    const spikeXs = [900, 1450, 1480, 2100, 2700, 2730, 3350, 3900, 4500, 4530]
    for (const sx of spikeXs) this.addSpike(sx)

    const plats: Array<[number, number]> = [
      [1200, GROUND_TOP - 100],
      [1750, GROUND_TOP - 110],
      [1950, GROUND_TOP - 150],
      [2400, GROUND_TOP - 110],
      [3050, GROUND_TOP - 100],
      [3250, GROUND_TOP - 150],
      [3650, GROUND_TOP - 120],
      [4200, GROUND_TOP - 130],
      [4800, GROUND_TOP - 120],
    ]
    for (const [px, py] of plats) this.addBlock(px, py)
  }

  private addBlock(x: number, y: number) {
    const b = this.blocks.create(x, y, "tile_dark") as Phaser.Physics.Arcade.Sprite
    b.setScale(1.6, 1).refreshBody()
    b.setDepth(2)
    b.setTint(0x553344)
  }

  private addSpike(x: number) {
    const s = this.spikes.create(x, GROUND_TOP + 6, "spike") as Phaser.Physics.Arcade.Sprite
    s.setOrigin(0.5, 1)
    s.setScale(0.9)
    s.setDepth(3)
    s.refreshBody()
    const body = s.body as Phaser.Physics.Arcade.Body
    body.setAllowGravity(false)
    // подгоняем хитбокс под видимый шип
    body.setSize(s.width * 0.6, s.height * 0.5)
  }

  // ---------- БОЛЬШОЕ КОЛЬЦО ----------
  private buildBigRing() {
    this.ringGlow = this.add.image(0, 0, "ring_glow").setDepth(4).setAlpha(0.0)
    this.ringSprite = this.add.image(0, 0, "ring_gold").setDepth(5)
    this.ring = this.add.container(RING_X, RING_Y, [this.ringGlow, this.ringSprite])
    this.ring.setDepth(5)
    this.ring.setVisible(true)

    // вращение кольца (имитация 3D через сжатие по ширине)
    this.tweens.add({
      targets: this.ringSprite,
      scaleX: { from: 1, to: 0.12 },
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    })
    // пульсация свечения
    this.tweens.add({
      targets: this.ringGlow,
      alpha: { from: 0.25, to: 0.6 },
      scale: { from: 0.9, to: 1.15 },
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    })
    // лёгкое парение
    this.tweens.add({
      targets: this.ring,
      y: RING_Y - 16,
      duration: 1600,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    })
  }

  // ---------- ИНТРО ----------
  private startIntro() {
    this.time.delayedCall(700, () => {
      this.dialog.show(
        [
          { speaker: "Стикмен", text: "Я вырубил его... но он скоро очнётся. Нужно убираться отсюда.", portrait: "portrait_player" },
          { speaker: "Стикмен", text: "Где-то здесь есть Кольцо — портал. Единственный выход из этого .EXE-мира.", portrait: "portrait_player" },
          { speaker: "Стикмен", text: "Надо просто дойти до него. Осторожно — повсюду шипы.", portrait: "portrait_player" },
        ],
        () => this.showLevelTitle()
      )
    })
  }

  private showLevelTitle() {
    const ov = this.add
      .rectangle(640, 360, 1280, 720, 0x000000)
      .setScrollFactor(0)
      .setDepth(3000)
      .setAlpha(0)
    const t1 = this.add
      .text(640, 320, "ГЛАВА 5", { fontFamily: "monospace", fontSize: "64px", color: "#ffcc00" })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(3001)
      .setAlpha(0)
    const t2 = this.add
      .text(640, 400, "«КОЛЬЦО»", { fontFamily: "monospace", fontSize: "36px", color: "#ffffff" })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(3001)
      .setAlpha(0)
    this.tweens.add({ targets: ov, alpha: 0.8, duration: 500 })
    this.tweens.add({ targets: [t1, t2], alpha: 1, duration: 600, delay: 300 })
    this.time.delayedCall(2200, () => {
      this.tweens.add({
        targets: [ov, t1, t2],
        alpha: 0,
        duration: 600,
        onComplete: () => {
          ov.destroy()
          t1.destroy()
          t2.destroy()
          this.phase = "run"
          const hint = this.add
            .text(640, 120, "→ Беги к Кольцу. Прыгай через шипы!  (Пробел/↑)", {
              fontFamily: "monospace",
              fontSize: "22px",
              color: "#ffcc00",
              stroke: "#000000",
              strokeThickness: 4,
            })
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(1500)
          this.tweens.add({
            targets: hint,
            alpha: 0,
            delay: 4000,
            duration: 1000,
            onComplete: () => hint.destroy(),
          })
        },
      })
    })
  }

  // ---------- ШИПЫ ----------
  private hitSpike() {
    if (this.phase !== "run" || this.invuln) return
    this.invuln = true
    this.sound.play("impact", { volume: 0.5 })
    this.cameras.main.shake(220, 0.016)
    this.cameras.main.flash(140, 120, 0, 0)
    // отбрасывание назад
    this.player.setVelocityX(-260)
    this.player.setVelocityY(-360)
    this.floatText(this.player.x, this.player.y - 70, "АЙ!", "#ff5555")
    this.tweens.add({
      targets: this.player,
      alpha: 0.3,
      duration: 110,
      yoyo: true,
      repeat: 5,
      onComplete: () => {
        this.player.setAlpha(1)
        this.invuln = false
      },
    })
  }

  // ---------- ОБНОВЛЕНИЕ ----------
  update() {
    if (this.phase === "run") {
      this.clampFloor()
      this.runControls()
      // дошли до зоны кольца -> кат-сцена
      if (this.player.x > RING_X - 900) this.startReveal()
      return
    }
    if (this.phase === "approach") {
      this.clampFloor()
      // авто-подход к кольцу до момента засады
      this.player.setVelocityX(180)
      this.player.setFlipX(false)
      this.player.play("player-run", true)
      if (this.player.x > RING_X - 520) this.startAmbush()
      return
    }
  }

  // Жёсткий пол: не даём провалиться сквозь землю (платформы выше уровня — не задеваются)
  private clampFloor() {
    const body = this.player.body as Phaser.Physics.Arcade.Body
    if (!body || !body.enable) return
    if (this.player.y > GROUND_TOP - 30) {
      this.player.y = GROUND_TOP - 30
      if (body.velocity.y > 0) body.setVelocityY(0)
    }
  }

  private runControls() {
    const speed = 270
    const left = this.cursors.left.isDown || this.touch.left
    const right = this.cursors.right.isDown || this.touch.right
    if (left) {
      this.player.setVelocityX(-speed)
      this.player.setFlipX(true)
      this.player.play("player-run", true)
    } else if (right) {
      this.player.setVelocityX(speed)
      this.player.setFlipX(false)
      this.player.play("player-run", true)
    } else {
      this.player.setVelocityX(0)
      this.player.stop()
      this.player.setFrame(0)
    }
    const onGround = this.player.body!.blocked.down || this.player.y >= GROUND_TOP - 30
    const jump =
      Phaser.Input.Keyboard.JustDown(this.cursors.space) ||
      Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
      this.touch.consumeJump()
    if (jump && onGround) {
      this.player.setVelocityY(-680)
      this.sound.play("jump_cue", { volume: 0.3 })
    }
  }

  // ---------- КАТ-СЦЕНА: КОЛЬЦО ----------
  private startReveal() {
    this.phase = "reveal"
    this.player.setVelocityX(0)
    this.player.stop()
    this.player.setFrame(0)
    this.touch.setVisible(false)
    this.sound.play("big_ring_hum", { volume: 0.6 })
    this.cameras.main.stopFollow()
    this.cameras.main.pan(RING_X, RING_Y + 30, 1200, "Sine.easeInOut")
    this.time.delayedCall(1350, () => {
      this.dialog.show(
        [
          { speaker: "Стикмен", text: "Вот оно... Огромное Кольцо. Я почти спасён.", portrait: "portrait_player" },
          { speaker: "Стикмен", text: "Нужно лишь дойти и прыгнуть в него.", portrait: "portrait_player" },
        ],
        () => {
          this.cameras.main.pan(this.player.x, this.player.y, 800, "Sine.easeInOut")
          this.time.delayedCall(820, () => {
            this.cameras.main.startFollow(this.player, true, 0.1, 0.1)
            this.touch.setVisible(true)
            this.phase = "approach"
          })
        }
      )
    })
  }

  // ---------- КАТ-СЦЕНА: ЗАСАДА ----------
  private startAmbush() {
    this.phase = "ambush"
    this.touch.setVisible(false)
    const body = this.player.body as Phaser.Physics.Arcade.Body
    body.setVelocity(0, 0)
    body.enable = false // дальше всё на тваннах (кат-сцена)
    this.player.stop()
    this.player.setFrame(0)

    // фиксируем камеру на сцене боя, чтобы полёт игрока было видно в кадре
    this.cameras.main.stopFollow()
    this.cameras.main.pan(this.player.x + 120, GROUND_TOP - 160, 500, "Sine.easeInOut")

    // КРУТАЯ боевая музыка + страшный стингер на появление STICKMAN.EXE
    this.sound.play("exe_appear", { volume: 0.9 })
    this.switchMusic("exe_battle", 0.55)

    this.exe.setVisible(true)
    this.exe.setPosition(this.player.x + 620, GROUND_TOP - 80)
    this.exe.setFlipX(true)
    this.cameras.main.flash(250, 120, 0, 0)
    this.cameras.main.shake(260, 0.008)
    this.banner("!", "#ff2222", 500)
    this.tweens.add({
      targets: this.exe,
      x: this.player.x + 80,
      duration: 600,
      ease: "Quad.easeIn",
      onComplete: () => this.ambushHit(),
    })
  }

  private ambushHit() {
    this.sound.play("impact", { volume: 0.85 })
    this.sound.play("hit", { volume: 0.6 })
    this.cameras.main.shake(500, 0.03)
    this.cameras.main.flash(280, 180, 0, 0)

    // брызги крови из точки удара (летят в стороны и ПАДАЮТ вниз)
    this.bloodBurst(this.player.x - 10, this.player.y - 20)

    const landX = Math.max(220, this.player.x - 300)
    // дуга полёта: вверх-назад, затем приземление лёжа
    this.tweens.chain({
      targets: this.player,
      tweens: [
        {
          x: (this.player.x + landX) / 2,
          y: GROUND_TOP - 150,
          angle: -160,
          duration: 320,
          ease: "Quad.easeOut",
        },
        {
          x: landX,
          y: GROUND_TOP - 30,
          angle: 90,
          duration: 380,
          ease: "Quad.easeIn",
        },
      ],
      onComplete: () => {
        this.player.setAngle(90)
        // лужа крови под упавшим игроком
        this.add
          .image(landX, GROUND_TOP - 4, "blood")
          .setOrigin(0.5, 1)
          .setDepth(6)
          .setAlpha(0.85)
        this.time.delayedCall(600, () => this.wakeUp())
      },
    })
  }

  // Брызги крови, которые разлетаются и падают на землю
  private bloodBurst(x: number, y: number) {
    for (let i = 0; i < 16; i++) {
      const r = Phaser.Math.Between(3, 7)
      const p = this.add.circle(x, y, r, 0x990000).setDepth(30)
      const vx = Phaser.Math.Between(-200, 120)
      const peakY = y - Phaser.Math.Between(30, 100)
      this.tweens.chain({
        targets: p,
        tweens: [
          { x: x + vx * 0.4, y: peakY, duration: 220, ease: "Quad.easeOut" },
          {
            x: x + vx,
            y: GROUND_TOP - Phaser.Math.Between(0, 18),
            alpha: 0.2,
            duration: 440,
            ease: "Quad.easeIn",
          },
        ],
        onComplete: () => p.destroy(),
      })
    }
  }

  // ---------- КАТ-СЦЕНА: ПРОБУЖДЕНИЕ ----------
  private wakeUp() {
    this.phase = "wakeup"
    this.dialog.show(
      [
        { speaker: "Стикмен", text: "Кх... кха... Как... как я ещё жив?", portrait: "portrait_player" },
        { speaker: "Стикмен", text: "Этот удар должен был меня прикончить...", portrait: "portrait_player" },
      ],
      () => {
        this.tweens.add({
          targets: this.player,
          angle: 0,
          duration: 420,
          onComplete: () => this.confront(),
        })
      }
    )
  }

  // ---------- КАТ-СЦЕНА: ПРОТИВОСТОЯНИЕ ----------
  private confront() {
    this.phase = "confront"
    this.player.setFlipX(false)
    this.dialog.show(
      [
        { speaker: "СТИКМЕН.EXE", text: "Живучий... Это даже забавно.", portrait: "portrait_villain_evil" },
        { speaker: "Стикмен", text: "Хватит. Это конец. EXE — готовься умереть.", portrait: "portrait_player" },
      ],
      () => {
        this.tweens.add({
          targets: this.exe,
          x: this.player.x + 190,
          duration: 700,
          ease: "Sine.easeInOut",
          onComplete: () => this.throwRing(),
        })
      }
    )
  }

  // ---------- КАТ-СЦЕНА: БРОСОК ЗЕЛЁНОГО КОЛЬЦА ----------
  private throwRing() {
    this.phase = "throw"
    this.floatText(this.player.x, this.player.y - 95, "...достаёт зелёное Кольцо", "#33dd55")
    const gr = this.add
      .image(this.player.x + 20, this.player.y - 10, "ring_green")
      .setDepth(20)
      .setScale(0)
    this.tweens.add({
      targets: gr,
      scale: 1,
      duration: 350,
      ease: "Back.easeOut",
      onComplete: () => {
        this.sound.play("ring_throw", { volume: 0.7 })
        this.tweens.add({ targets: gr, angle: 720, duration: 600 })
        this.tweens.add({
          targets: gr,
          x: this.exe.x,
          y: this.exe.y - 10,
          duration: 600,
          ease: "Quad.easeIn",
          onComplete: () => this.exeCatch(gr),
        })
      },
    })
  }

  private exeCatch(gr: Phaser.GameObjects.Image) {
    this.sound.play("ring_collect", { volume: 0.7 })
    this.exe.setTintFill(0x33dd55)
    this.cameras.main.shake(400, 0.02)
    this.time.delayedCall(150, () => this.exe.clearTint())
    this.tweens.add({
      targets: this.exe,
      alpha: { from: 1, to: 0.4 },
      duration: 80,
      yoyo: true,
      repeat: 6,
    })
    this.tweens.add({
      targets: gr,
      alpha: 0,
      scale: 0.2,
      duration: 500,
      onComplete: () => gr.destroy(),
    })
    this.dialog.show(
      [
        { speaker: "СТИКМЕН.EXE", text: "Что... ЧТО СО МНОЙ?! Оно... жжёт изнутри...", portrait: "portrait_villain_evil" },
        { speaker: "СТИКМЕН.EXE", text: "Не-е-ет... я... не могу... дви...", portrait: "portrait_villain_evil" },
      ],
      () => {
        this.sound.play("kill", { volume: 0.7 })
        if (this.music && this.music.isPlaying) this.music.stop() // тишина перед падением
        this.cameras.main.shake(500, 0.025)
        this.exe.setTint(0x333333)
        this.tweens.add({
          targets: this.exe,
          angle: 90,
          y: GROUND_TOP - 14,
          alpha: 0.5,
          duration: 800,
          ease: "Bounce.easeOut",
          onComplete: () => this.time.delayedCall(500, () => this.escape()),
        })
      }
    )
  }

  // ---------- КАТ-СЦЕНА: ПОБЕГ ЧЕРЕЗ КОЛЬЦО ----------
  private escape() {
    this.phase = "escape"
    this.player.setFlipX(false)
    this.player.play("player-run", true)
    this.dialog.show(
      [
        { speaker: "Стикмен", text: "Получилось... Прощай, кошмар. Я иду домой.", portrait: "portrait_player" },
      ],
      () => {
        this.cameras.main.stopFollow()
        this.cameras.main.pan(RING_X, RING_Y, 900, "Sine.easeInOut")
        this.tweens.add({
          targets: this.player,
          x: RING_X - 40,
          duration: 1100,
          ease: "Sine.easeIn",
          onComplete: () => {
            this.sound.play("teleport", { volume: 0.8 })
            this.player.stop()
            this.tweens.add({
              targets: this.player,
              x: RING_X,
              y: RING_Y,
              duration: 450,
              ease: "Quad.easeOut",
            })
            this.tweens.add({
              targets: this.player,
              scale: 0.1,
              alpha: 0,
              angle: 360,
              duration: 600,
              delay: 250,
              onComplete: () => {
                this.cameras.main.flash(600, 255, 255, 255)
                this.cameras.main.zoomTo(2.2, 700)
                this.sound.play("ring_win", { volume: 0.8 }) // приятный победный звук
                this.tweens.add({ targets: this.ringGlow, alpha: 1, scale: 2.4, duration: 600 })
                this.time.delayedCall(950, () => this.finish())
              },
            })
          },
        })
      }
    )
  }

  private finish() {
    this.phase = "done"
    if (this.music && this.music.isPlaying) this.music.stop()
    const ov = this.add
      .rectangle(640, 360, 1280, 720, 0x000000)
      .setScrollFactor(0)
      .setDepth(5000)
      .setAlpha(0)
    this.tweens.add({
      targets: ov,
      alpha: 1,
      duration: 1200,
      onComplete: () => {
        this.cameras.main.setZoom(1)
        this.bigText(140, "СТИКМЕН СБЕЖАЛ ИЗ .EXE-МИРА", "30px", "#33dd33")
        this.bigText(190, "...но что ждёт его по ту сторону Кольца?", "19px", "#aaaaaa")
        this.bigText(260, "ГЛАВА 5 ЗАВЕРШЕНА", "26px", "#ffcc00")
        this.bigText(320, "КОНЕЦ БЕТЫ — спасибо, что играл!", "20px", "#ffffff")
        this.menuButton(430, "В меню")
        this.bigText(530, "Нашли баг или есть идея? Поддержка:", "17px", "#999999")
        this.supportLink(580)
      },
    })
  }

  // ---------- ВСПОМОГАТЕЛЬНЫЕ ----------
  private switchMusic(key: string, vol: number) {
    if (this.music && this.music.isPlaying) this.music.stop()
    this.music = this.sound.add(key, { loop: true, volume: vol })
    this.music.play()
  }

  private bigText(y: number, txt: string, size: string, color: string) {
    this.add
      .text(640, y, txt, { fontFamily: "monospace", fontSize: size, color, align: "center" })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(5001)
  }

  private banner(text: string, color: string, dur: number) {
    const t = this.add
      .text(640, 150, text, {
        fontFamily: "monospace",
        fontSize: "70px",
        color,
        stroke: "#000000",
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(2500)
    this.tweens.add({
      targets: t,
      scale: { from: 1, to: 1.3 },
      alpha: { from: 1, to: 0 },
      duration: dur,
      onComplete: () => t.destroy(),
    })
  }

  private floatText(x: number, y: number, msg: string, color: string) {
    const t = this.add
      .text(x, y, msg, {
        fontFamily: "monospace",
        fontSize: "24px",
        color,
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(2600)
    this.tweens.add({
      targets: t,
      y: y - 55,
      alpha: 0,
      duration: 1100,
      onComplete: () => t.destroy(),
    })
  }

  private makeButton(
    x: number,
    y: number,
    label: string,
    color: number,
    onClick: () => void
  ) {
    const bw = 320
    const bh = 54
    const bg = this.add.rectangle(0, 0, bw, bh, color, 0.92).setStrokeStyle(3, 0xffffff)
    const txt = this.add
      .text(0, 0, label, { fontFamily: "monospace", fontSize: "22px", color: "#ffffff" })
      .setOrigin(0.5)
    const c = this.add
      .container(x, y, [bg, txt])
      .setScrollFactor(0)
      .setDepth(5002)
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

  private menuButton(y: number, label: string) {
    this.makeButton(640, y, label, 0x661111, () => {
      if (this.music && this.music.isPlaying) this.music.stop()
      this.scene.start("MenuScene")
    })
  }

  private supportLink(y: number) {
    const icon = this.add
      .image(486, y, "tg_icon")
      .setDisplaySize(54, 54)
      .setScrollFactor(0)
      .setDepth(5002)
    this.tweens.add({
      targets: icon,
      y: y - 8,
      duration: 850,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    })
    const handle = this.add
      .text(522, y, "@StickmanGameSupportBot", {
        fontFamily: "monospace",
        fontSize: "22px",
        color: "#33bbff",
      })
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(5002)
      .setInteractive({ useHandCursor: true })
    handle.on("pointerover", () => handle.setColor("#66d0ff"))
    handle.on("pointerout", () => handle.setColor("#33bbff"))
    handle.on("pointerdown", () => {
      window.open("https://t.me/StickmanGameSupportBot", "_blank")
    })
  }
}


