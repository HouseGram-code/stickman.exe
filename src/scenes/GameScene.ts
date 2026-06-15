import Phaser from "phaser"
import { DialogBox } from "../ui/Dialog"
import { TouchControls } from "../ui/TouchControls"

const WORLD_W = 5200
const H = 720
const GROUND_TOP = H - 64
const VILLAIN_X = 4950
const TRANSITION_X = 1900
const HORROR_X = 3300
const END_X = 4500

const DAY = new Phaser.Display.Color(135, 206, 235)
const BLOOD = new Phaser.Display.Color(45, 0, 0)

export class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite
  private villain!: Phaser.Physics.Arcade.Sprite
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private touch!: TouchControls
  private ground!: Phaser.Physics.Arcade.StaticGroup
  private dialog!: DialogBox
  private sky!: Phaser.GameObjects.Rectangle
  private birds: Phaser.GameObjects.Sprite[] = []
  private bloods: Phaser.GameObjects.Image[] = []
  private trees: Phaser.GameObjects.Image[] = []
  private forest: Phaser.GameObjects.Image[] = []
  private musicHappy!: Phaser.Sound.BaseSound
  private ambient!: Phaser.Sound.BaseSound
  private heartbeat!: Phaser.Sound.BaseSound

  private controlsLocked = true
  private autoWalk = false
  private endingStarted = false
  private revealed = false
  private flagTransition = false
  private flagHorror = false

  constructor() {
    super("GameScene")
  }

  create() {
    this.controlsLocked = true
    this.autoWalk = false
    this.endingStarted = false
    this.revealed = false
    this.flagTransition = false
    this.flagHorror = false
    this.birds = []
    this.bloods = []
    this.trees = []
    this.forest = []

    this.physics.world.setBounds(0, 0, WORLD_W, H)
    this.cameras.main.setBounds(0, 0, WORLD_W, H)

    // Небо (меняет цвет по мере прохождения)
    this.sky = this.add
      .rectangle(640, 360, 1280, 720, DAY.color)
      .setScrollFactor(0)
      .setDepth(-20)

    // Облака (параллакс)
    for (let i = 0; i < 8; i++) {
      const c = this.add
        .image(200 + i * 600, 90 + (i % 3) * 60, "cloud")
        .setScrollFactor(0.3)
        .setDepth(-15)
      this.trees.push() // noop keep types simple
      void c
    }

    // Деревья
    for (let x = 300; x < WORLD_W; x += 520) {
      const tr = this.add
        .image(x, GROUND_TOP - 40, "tree")
        .setDepth(-5)
      this.trees.push(tr)
    }

    // Густой лес вокруг финала (стикмен.exe стоит в лесу)
    for (let x = END_X - 150; x < WORLD_W + 120; x += 58) {
      const back = Math.floor(x) % 116 < 58
      const pine = this.add
        .image(x, GROUND_TOP + 24, "pine")
        .setOrigin(0.5, 1)
        .setDepth(back ? -6 : -3)
        .setScale(back ? 1.35 : 0.95)
      this.forest.push(pine)
    }

    // 🥚 Пасхалка: спрятанное жуткое лицо в земле на заднем плане
    const egg = this.add
      .image(2750, GROUND_TOP + 6, "egg")
      .setOrigin(0.5, 1)
      .setDepth(-4)
      .setScale(0.85)
      .setAlpha(0.92)
    this.tweens.add({
      targets: egg,
      alpha: 0.6,
      duration: 1600,
      yoyo: true,
      repeat: -1,
    })

    // Пол
    this.ground = this.physics.add.staticGroup()
    for (let x = 0; x <= WORLD_W; x += 64) {
      this.ground.create(x, H - 32, "tile").refreshBody()
    }

    // Кровь (появляется в хоррор-зоне)
    for (let x = HORROR_X; x < WORLD_W; x += 240) {
      const b = this.add
        .image(x, GROUND_TOP - 4, "blood")
        .setDepth(1)
        .setAlpha(0)
      this.bloods.push(b)
    }

    // Птицы
    if (!this.anims.exists("bird-fly")) {
      this.anims.create({
        key: "bird-fly",
        frames: this.anims.generateFrameNumbers("bird", { start: 0, end: 2 }),
        frameRate: 9,
        repeat: -1,
      })
    }
    for (let i = 0; i < 7; i++) {
      const bx = 300 + i * 220
      const by = 120 + (i % 4) * 40
      const goLeft = i % 2 === 0
      const bird = this.add
        .sprite(bx, by, "bird")
        .setScale(2)
        .setDepth(-8)
        .setFlipX(goLeft)
      bird.play("bird-fly")
      this.tweens.add({
        targets: bird,
        y: by + 30,
        x: goLeft ? bx - 60 : bx + 60,
        duration: 2000 + i * 200,
        yoyo: true,
        repeat: -1,
      })
      this.birds.push(bird)
    }

    // Игрок
    this.player = this.physics.add.sprite(160, GROUND_TOP - 80, "player")
    this.player.setCollideWorldBounds(true)
    this.physics.add.collider(this.player, this.ground)
    if (!this.anims.exists("player-run")) {
      this.anims.create({
        key: "player-run",
        frames: this.anims.generateFrameNumbers("player", { start: 0, end: 5 }),
        frameRate: 12,
        repeat: -1,
      })
    }

    // Злодей
    this.villain = this.physics.add.sprite(VILLAIN_X, GROUND_TOP - 80, "villain")
    this.villain.setFlipX(true)
    ;(this.villain.body as Phaser.Physics.Arcade.Body).setAllowGravity(false)
    this.villain.setImmovable(true)

    this.cameras.main.startFollow(this.player, true, 0.1, 0.1)
    this.cameras.main.fadeIn(600, 0, 0, 0)

    // Звук
    this.musicHappy = this.sound.add("music_happy", { loop: true, volume: 0.5 })
    this.ambient = this.sound.add("ambient_horror", { loop: true, volume: 0 })
    this.heartbeat = this.sound.add("heartbeat", { loop: true, volume: 0 })
    this.musicHappy.play()

    // Диалоги
    this.dialog = new DialogBox(this)
    this.input.keyboard!.on("keydown-SPACE", () => {
      if (this.dialog.active) this.dialog.next()
    })
    this.input.keyboard!.on("keydown-ENTER", () => {
      if (this.dialog.active) this.dialog.next()
    })
    this.input.keyboard!.addKey("F").on("down", () =>
      this.scale.toggleFullscreen()
    )
    this.cursors = this.input.keyboard!.createCursorKeys()
    this.touch = new TouchControls(this)

    // Вступительный диалог
    this.time.delayedCall(700, () => {
      this.say(
        [
          { speaker: "Стикмен", text: "Какой прекрасный день!", portrait: "portrait_player" },
          { speaker: "Стикмен", text: "Птицы поют, солнце светит... Пойду прогуляюсь направо.", portrait: "portrait_player" },
          { speaker: "", text: "(Стрелки — идти, Пробел — прыжок, F — полный экран)", portrait: "portrait_player" },
        ],
        () => {
          this.controlsLocked = false
        }
      )
    })
  }

  private say(lines: any[], after?: () => void) {
    this.controlsLocked = true
    this.player.setVelocityX(0)
    this.player.stop()
    this.player.setFrame(0)
    this.dialog.show(lines, () => {
      this.controlsLocked = false
      if (after) after()
    })
  }

  private fade(snd: Phaser.Sound.BaseSound, to: number, dur: number) {
    this.tweens.add({ targets: snd as any, volume: to, duration: dur })
  }

  private enterTransition() {
    this.flagTransition = true
    this.fade(this.musicHappy, 0, 1800)
    this.time.delayedCall(1800, () => this.musicHappy.stop())
    this.ambient.play()
    this.fade(this.ambient, 0.55, 2500)
    // Птицы ра��летаются
    this.birds.forEach((b, i) => {
      this.tweens.killTweensOf(b)
      this.tweens.add({
        targets: b,
        y: -80,
        x: b.x + (i % 2 === 0 ? -200 : 200),
        alpha: 0,
        duration: 900,
        onComplete: () => b.destroy(),
      })
    })
    this.say([
      { speaker: "Стикмен", text: "Почему вдруг стало так темно...?", portrait: "portrait_player" },
      { speaker: "Стикмен", text: "И куда пропали птицы...?", portrait: "portrait_player" },
    ])
  }

  private enterHorror() {
    this.flagHorror = true
    this.heartbeat.play()
    this.fade(this.heartbeat, 0.6, 2000)
    this.bloods.forEach((b) =>
      this.tweens.add({ targets: b, alpha: 1, duration: 800 })
    )
    this.trees.forEach((t) => t.setTint(0x331111))
    this.forest.forEach((p) => p.setTint(0x2a1414))
    this.ground
      .getChildren()
      .forEach((g) => (g as Phaser.GameObjects.Image).setTexture("tile_dark"))
    this.say([
      { speaker: "Стикмен", text: "Это... это кровь?!", portrait: "portrait_player" },
      { speaker: "Стикмен", text: "Здесь кто-то есть. Я чувствую это...", portrait: "portrait_player" },
    ])
  }

  private startEnding() {
    this.endingStarted = true
    this.controlsLocked = true
    this.player.setVelocityX(0)
    this.player.stop()
    this.player.setFrame(0)
    this.dialog.show(
      [
        { speaker: "???", text: "...", portrait: "portrait_villain" },
        { speaker: "Незнакомец", text: "Ты наконец пришёл.", portrait: "portrait_villain" },
        { speaker: "Стикмен", text: "Кто ты? Где это я...?", portrait: "portrait_player" },
        { speaker: "Незнакомец", text: "Подойди ближе. Не бойся...", portrait: "portrait_villain" },
      ],
      () => {
        this.autoWalk = true
      }
    )
  }

  private reveal() {
    this.revealed = true
    this.autoWalk = false
    this.player.setVelocityX(0)
    this.player.stop()
    this.player.setFrame(0)
    this.time.delayedCall(500, () => {
      this.villain.setTexture("villain_evil")
      this.sound.play("jumpscare", { volume: 1 })
      // Полноэкранное страшное лицо (как в Sonic.exe)
      const scream = this.add
        .image(640, 360, "scream")
        .setScrollFactor(0)
        .setDepth(3000)
      scream.setDisplaySize(1280, 720)
      this.tweens.add({
        targets: scream,
        alpha: { from: 1, to: 0.6 },
        duration: 55,
        yoyo: true,
        repeat: 16,
      })
      this.cameras.main.flash(450, 200, 0, 0)
      this.cameras.main.shake(1300, 0.05)
      if (this.musicHappy.isPlaying) this.musicHappy.stop()
      this.fade(this.heartbeat, 1, 300)
      this.time.delayedCall(1400, () => {
        scream.setAlpha(1)
        this.dialog.show(
          [{ speaker: "???", text: "Привет.", portrait: "portrait_villain_evil" }],
          () => {
            scream.destroy()
            this.cameras.main.fadeOut(1300, 0, 0, 0)
            this.cameras.main.once("camerafadeoutcomplete", () => {
              if (this.ambient.isPlaying) this.ambient.stop()
              if (this.heartbeat.isPlaying) this.heartbeat.stop()
              this.scene.start("ChaseScene")
            })
          }
        )
      })
    })
  }

  private showEnding() {
    const ov = this.add
      .rectangle(640, 360, 1280, 720, 0x000000)
      .setScrollFactor(0)
      .setDepth(2000)
      .setAlpha(0)
    this.tweens.add({
      targets: ov,
      alpha: 1,
      duration: 1400,
      onComplete: () => {
        this.ambient.stop()
        this.heartbeat.stop()
        this.add
          .text(640, 310, "ПРОДОЛЖЕНИЕ СЛЕДУЕТ...", {
            fontFamily: "monospace",
            fontSize: "54px",
            color: "#cc0000",
          })
          .setOrigin(0.5)
          .setScrollFactor(0)
          .setDepth(2001)
        this.add
          .text(640, 390, "далее скоро", {
            fontFamily: "monospace",
            fontSize: "28px",
            color: "#888888",
          })
          .setOrigin(0.5)
          .setScrollFactor(0)
          .setDepth(2001)
        this.add
          .text(640, 680, "STICKMAN.EXE  v0.1 beta", {
            fontFamily: "monospace",
            fontSize: "18px",
            color: "#444444",
          })
          .setOrigin(0.5)
          .setScrollFactor(0)
          .setDepth(2001)
      },
    })
  }

  update() {
    const x = this.player.x

    // Плавный переход цвета неба
    const t = Phaser.Math.Clamp((x - 700) / (END_X - 700), 0, 1)
    const col = Phaser.Display.Color.Interpolate.ColorWithColor(DAY, BLOOD, 100, t * 100)
    this.sky.setFillStyle(
      Phaser.Display.Color.GetColor(col.r, col.g, col.b)
    )

    // События
    if (!this.flagTransition && x > TRANSITION_X) this.enterTransition()
    if (!this.flagHorror && x > HORROR_X) this.enterHorror()
    if (!this.endingStarted && x > END_X) this.startEnding()

    // Авто-подход к злодею
    if (this.autoWalk) {
      this.player.setVelocityX(200)
      this.player.setFlipX(false)
      this.player.play("player-run", true)
      if (Math.abs(this.villain.x - this.player.x) < 110) this.reveal()
      return
    }

    if (this.controlsLocked) {
      this.player.setVelocityX(0)
      return
    }

    // Обычное управление (клавиатура + сенсор)
    const speed = 260
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

    const onGround = this.player.body!.blocked.down
    const jumpPressed =
      Phaser.Input.Keyboard.JustDown(this.cursors.space) ||
      Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
      this.touch.consumeJump()
    if (jumpPressed && onGround) {
      this.player.setVelocityY(-580)
    }
  }
}
