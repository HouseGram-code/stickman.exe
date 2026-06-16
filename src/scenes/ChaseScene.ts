import Phaser from "phaser"
import { DialogBox } from "../ui/Dialog"
import { TouchControls } from "../ui/TouchControls"

const WORLD_W = 6000
const H = 720
const GROUND_TOP = H - 64
const SCARE_X = 1250
const OBSTACLE_X = 3200
const HIDE_X = 5200
const ROCK_X = 5420

type Phase = "lying" | "awake" | "chase" | "hide" | "done"

export class ChaseScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite
  private exe!: Phaser.Physics.Arcade.Sprite
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private touch!: TouchControls
  private ground!: Phaser.Physics.Arcade.StaticGroup
  private dialog!: DialogBox
  private rock!: Phaser.GameObjects.Image
  private chaseMusic!: Phaser.Sound.BaseSound
  private fireSnd!: Phaser.Sound.BaseSound

  private phase: Phase = "lying"
  private scared = false
  private cueShown = false
  private autoJumped = false

  constructor() {
    super("ChaseScene")
  }

  create() {
    this.phase = "lying"
    this.scared = false
    this.cueShown = false
    this.autoJumped = false

    this.physics.world.setBounds(0, 0, WORLD_W, H)
    this.cameras.main.setBounds(0, 0, WORLD_W, H)

    // Красное горящее небо
    this.add
      .rectangle(640, 360, 1280, 720, 0x2a0500)
      .setScrollFactor(0)
      .setDepth(-20)
    this.add
      .rectangle(640, 720, 1280, 360, 0x661500, 0.5)
      .setScrollFactor(0)
      .setDepth(-19)

    // Анимация огня
    if (!this.anims.exists("fire-burn")) {
      this.anims.create({
        key: "fire-burn",
        frames: this.anims.generateFrameNumbers("fire", { start: 0, end: 3 }),
        frameRate: 12,
        repeat: -1,
      })
    }

    // Горящие деревья на заднем фоне
    for (let x = 160; x < WORLD_W; x += 300) {
      this.add
        .image(x, GROUND_TOP - 40, "tree")
        .setDepth(-6)
        .setTint(0x180808)
      const f = this.add
        .sprite(x + 12, GROUND_TOP - 24, "fire")
        .setOrigin(0.5, 1)
        .setDepth(-5)
        .setScale(1.5 + (x % 3) * 0.25)
      f.play("fire-burn")
    }

    // Огонь на земле (передний план)
    for (let x = 120; x < WORLD_W; x += 230) {
      const f = this.add
        .sprite(x, GROUND_TOP + 8, "fire")
        .setOrigin(0.5, 1)
        .setDepth(3)
        .setScale(1.0 + (x % 4) * 0.12)
      f.play("fire-burn")
    }

    // Искры/угли
    for (let i = 0; i < 50; i++) {
      const ex = Phaser.Math.Between(0, WORLD_W)
      const ey = Phaser.Math.Between(200, H)
      const e = this.add
        .rectangle(ex, ey, 3, 3, 0xff7a1a, 0.85)
        .setDepth(-4)
      this.tweens.add({
        targets: e,
        y: ey - 240,
        alpha: 0,
        duration: Phaser.Math.Between(2200, 4200),
        repeat: -1,
        delay: Phaser.Math.Between(0, 2500),
      })
    }

    // Обгоревшая земля
    this.ground = this.physics.add.staticGroup()
    for (let x = 0; x <= WORLD_W; x += 64) {
      this.ground.create(x, H - 32, "tile_dark").refreshBody()
    }

    // Препятствие (обгоревший валун) — через него прыгаем
    this.add
      .image(OBSTACLE_X, GROUND_TOP + 8, "rock")
      .setOrigin(0.5, 1)
      .setDepth(2)
      .setScale(0.8)
      .setTint(0x3a2a2a)

    // Камень-укрытие
    this.rock = this.add
      .image(ROCK_X, GROUND_TOP + 8, "rock")
      .setOrigin(0.5, 1)
      .setDepth(20)
      .setScale(1.3)

    // Анимация бега
    if (!this.anims.exists("player-run")) {
      this.anims.create({
        key: "player-run",
        frames: this.anims.generateFrameNumbers("player", { start: 0, end: 5 }),
        frameRate: 12,
        repeat: -1,
      })
    }

    // Игрок — лежит на земле
    this.player = this.physics.add.sprite(340, GROUND_TOP - 30, "player")
    this.player.setCollideWorldBounds(true)
    this.player.setAngle(90)
    this.player.setDepth(8)
    this.physics.add.collider(this.player, this.ground)

    // Стикмен.exe — пока скрыт слева
    this.exe = this.physics.add.sprite(-400, GROUND_TOP - 80, "villain_evil")
    ;(this.exe.body as Phaser.Physics.Arcade.Body).setAllowGravity(false)
    this.exe.setImmovable(true)
    this.exe.setDepth(9)
    this.exe.setVisible(false)

    this.cameras.main.startFollow(this.player, true, 0.1, 0.1)
    this.cameras.main.fadeIn(1300, 25, 0, 0)

    // Звук
    this.chaseMusic = this.sound.add("chase_music", { loop: true, volume: 0.55 })
    this.fireSnd = this.sound.add("fire", { loop: true, volume: 0 })
    this.fireSnd.play()
    this.fade(this.fireSnd, 0.4, 1500)

    // Диалог + управление
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

    // Пробуждение
    this.time.delayedCall(1500, () => {
      this.dialog.show(
        [
          { speaker: "Стикмен", text: "Кх... кха... что... что случилось?", portrait: "portrait_player" },
          { speaker: "Стикмен", text: "Всё горит! Весь лес в огне...", portrait: "portrait_player" },
          { speaker: "Стикмен", text: "Где этот... тот тип?! Надо убегать. Направо!", portrait: "portrait_player" },
          { speaker: "", text: "(Стрелки — идти, Пробел — прыжок)", portrait: "portrait_player" },
        ],
        () => {
          this.tweens.add({
            targets: this.player,
            angle: 0,
            duration: 350,
            onComplete: () => {
              this.phase = "awake"
            },
          })
        }
      )
    })
  }

  private fade(snd: Phaser.Sound.BaseSound, to: number, dur: number) {
    this.tweens.add({ targets: snd as any, volume: to, duration: dur })
  }

  private banner(text: string, color: string, dur: number) {
    const t = this.add
      .text(640, 130, text, {
        fontFamily: "monospace",
        fontSize: "68px",
        color,
        stroke: "#000000",
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(2500)
    this.tweens.add({
      targets: t,
      scale: { from: 1, to: 1.25 },
      alpha: { from: 1, to: 0 },
      duration: dur,
      onComplete: () => t.destroy(),
    })
  }

  private smallScare() {
    this.scared = true
    this.sound.play("jumpscare", { volume: 0.7 })
    const s = this.add
      .image(640, 360, "scream")
      .setScrollFactor(0)
      .setDepth(3000)
    s.setDisplaySize(1280, 720)
    this.cameras.main.flash(300, 180, 0, 0)
    this.cameras.main.shake(500, 0.03)
    this.tweens.add({
      targets: s,
      alpha: { from: 1, to: 0 },
      duration: 480,
      onComplete: () => s.destroy(),
    })
    this.time.delayedCall(520, () => this.startChase())
  }

  private startChase() {
    this.phase = "chase"
    this.exe.setVisible(true)
    this.exe.x = this.player.x - 560
    this.exe.setFlipX(false)
    this.chaseMusic.play()
    this.fade(this.fireSnd, 0.5, 500)
    this.banner("БЕГИ!", "#ff2222", 1600)
  }

  private showJumpCue() {
    this.cueShown = true
    this.sound.play("jump_cue", { volume: 0.85 })
    this.banner("ПРЫГАЙ!", "#ffee33", 1200)
  }

  private startHide() {
    this.phase = "hide"
    this.player.setVelocityX(0)
    this.player.stop()
    this.player.setFrame(0)
    this.player.setDepth(15) // за камень (камень depth 20)
    this.tweens.add({
      targets: this.player,
      x: ROCK_X - 4,
      duration: 420,
      onComplete: () => this.exeApproach(),
    })
  }

  private exeApproach() {
    this.tweens.add({
      targets: this.exe,
      x: ROCK_X - 240,
      duration: 1700,
      onComplete: () => {
        this.dialog.show(
          [
            { speaker: "СТИКМЕН.EXE", text: "...", portrait: "portrait_villain_evil" },
            { speaker: "СТИКМЕН.EXE", text: "Чёрт... Куда он подевался?", portrait: "portrait_villain_evil" },
            { speaker: "СТИКМЕН.EXE", text: "Хе-хе-хе... ХА-ХА-ХА-ХА!", portrait: "portrait_villain_evil" },
          ],
          () => {
            this.sound.play("laugh", { volume: 0.85 })
            this.cameras.main.shake(700, 0.02)
            this.time.delayedCall(900, () => {
              this.tweens.add({
                targets: this.exe,
                alpha: 0,
                duration: 1000,
                onComplete: () => {
                  this.chaseMusic.stop()
                  this.exe.destroy()
                  this.endChapter()
                },
              })
            })
          }
        )
      },
    })
  }

  private endChapter() {
    this.phase = "done"
    const ov = this.add
      .rectangle(640, 360, 1280, 720, 0x000000)
      .setScrollFactor(0)
      .setDepth(4000)
      .setAlpha(0)
    this.tweens.add({
      targets: ov,
      alpha: 1,
      duration: 1500,
      onComplete: () => {
        this.fade(this.fireSnd, 0, 800)
        this.time.delayedCall(800, () => this.fireSnd.stop())
        this.add
          .text(640, 300, "ПРОДОЛЖЕНИЕ СЛЕДУЕТ...", {
            fontFamily: "monospace",
            fontSize: "54px",
            color: "#cc0000",
          })
          .setOrigin(0.5)
          .setScrollFactor(0)
          .setDepth(4001)
        this.add
          .text(640, 380, "Глава 2 — «Огонь» завершена", {
            fontFamily: "monospace",
            fontSize: "26px",
            color: "#888888",
          })
          .setOrigin(0.5)
          .setScrollFactor(0)
          .setDepth(4001)
        this.add
          .text(640, 680, "STICKMAN.EXE  v0.1 beta", {
            fontFamily: "monospace",
            fontSize: "18px",
            color: "#444444",
          })
          .setOrigin(0.5)
          .setScrollFactor(0)
          .setDepth(4001)
        const cont = this.add
          .text(640, 470, "Нажми ПРОБЕЛ — Глава 3", {
            fontFamily: "monospace",
            fontSize: "24px",
            color: "#ffffff",
          })
          .setOrigin(0.5)
          .setScrollFactor(0)
          .setDepth(4001)
        this.tweens.add({
          targets: cont,
          alpha: { from: 1, to: 0.25 },
          duration: 700,
          yoyo: true,
          repeat: -1,
        })
        const goNext = () => {
          if (this.fireSnd.isPlaying) this.fireSnd.stop()
          this.scene.start("BattleScene")
        }
        this.input.keyboard!.once("keydown-SPACE", goNext)
        this.input.keyboard!.once("keydown-ENTER", goNext)
        this.input.once("pointerdown", goNext)
      },
    })
  }

  private controls() {
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
    const onGround = this.player.body!.blocked.down
    const jumpPressed =
      Phaser.Input.Keyboard.JustDown(this.cursors.space) ||
      Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
      this.touch.consumeJump()
    if (jumpPressed && onGround) {
      this.player.setVelocityY(-580)
    }
  }

  update(_time: number, delta: number) {
    if (this.phase === "lying" || this.phase === "done" || this.phase === "hide") {
      return
    }

    const x = this.player.x

    if (this.phase === "awake") {
      if (this.dialog.active) {
        this.player.setVelocityX(0)
        return
      }
      this.controls()
      if (!this.scared && x > SCARE_X) this.smallScare()
      return
    }

    if (this.phase === "chase") {
      // Авто-бег вправо
      this.player.setVelocityX(370)
      this.player.setFlipX(false)
      this.player.play("player-run", true)

      // exe гонится сзади
      const gap = this.player.x - this.exe.x
      const exeSpeed = gap > 400 ? 400 : 320
      this.exe.x += exeSpeed * (delta / 1000)
      this.exe.y = GROUND_TOP - 80 + Math.sin(_time / 90) * 6

      // С��гнал "прыгай" у препятствия
      if (!this.cueShown && x > OBSTACLE_X - 400) this.showJumpCue()

      const onGround = this.player.body!.blocked.down
      // Ручной прыжок (клавиатура + сенсор)
      const jumpPressed =
        Phaser.Input.Keyboard.JustDown(this.cursors.space) ||
        Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
        this.touch.consumeJump()
      if (jumpPressed && onGround) {
        this.player.setVelocityY(-640)
      }
      // Подстраховка: авто-прыжок через препятствие
      if (
        !this.autoJumped &&
        x > OBSTACLE_X - 150 &&
        x < OBSTACLE_X + 40 &&
        onGround
      ) {
        this.player.setVelocityY(-640)
        this.autoJumped = true
      }

      if (x > HIDE_X) this.startHide()
      return
    }
  }
}
