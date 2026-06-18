import Phaser from "phaser"
import { DialogBox } from "../ui/Dialog"
import { TouchControls } from "../ui/TouchControls"

const W = 1280
const H = 720
const GROUND_TOP = H - 64
const LANE_X = 300

type Phase = "intro" | "warn" | "howto" | "fight" | "over"

export class RunnerScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite
  private exe!: Phaser.GameObjects.Sprite
  private exeBob?: Phaser.Tweens.Tween
  private ground!: Phaser.Physics.Arcade.StaticGroup
  private groundTile!: Phaser.GameObjects.TileSprite
  private hazards!: Phaser.Physics.Arcade.Group
  private pickups!: Phaser.Physics.Arcade.Group
  private dialog!: DialogBox
  private music?: Phaser.Sound.BaseSound

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private spaceKey!: Phaser.Input.Keyboard.Key
  private upKey!: Phaser.Input.Keyboard.Key
  private touch!: TouchControls

  private maxPlayerHp = 100
  private maxExeHp = 90
  private playerHp = 100
  private exeHp = 100
  private playerFill!: Phaser.GameObjects.Rectangle
  private exeFill!: Phaser.GameObjects.Rectangle
  private playerHpText!: Phaser.GameObjects.Text
  private exeHpText!: Phaser.GameObjects.Text

  private phase: Phase = "intro"
  private invuln = false
  private attackTimer?: Phaser.Time.TimerEvent
  private rockTimer?: Phaser.Time.TimerEvent
  private rockDelay?: Phaser.Time.TimerEvent
  private bgFar: Phaser.GameObjects.Rectangle[] = []
  private skipIntro = false

  constructor() {
    super("RunnerScene")
  }

  init(data?: { skipIntro?: boolean }) {
    // при «Попробовать заново» пропускаем интро и сразу в бой
    this.skipIntro = data?.skipIntro === true
  }

  create() {
    this.playerHp = this.maxPlayerHp
    this.exeHp = this.maxExeHp
    this.phase = "intro"
    this.invuln = false
    this.bgFar = []

    // Новая локация — мрачный разрушенный мир
    this.add.rectangle(640, 240, 1280, 480, 0x140020).setScrollFactor(0).setDepth(-20)
    this.add.rectangle(640, 600, 1280, 240, 0x3a0010).setScrollFactor(0).setDepth(-19)
    this.add.rectangle(640, 470, 1280, 8, 0xff2a2a, 0.5).setScrollFactor(0).setDepth(-18)

    // Далёкие разрушенные силуэты (двигаются для эффекта бега)
    for (let i = 0; i < 10; i++) {
      const bx = 70 + i * 150
      const bh = Phaser.Math.Between(80, 220)
      const b = this.add
        .rectangle(bx, GROUND_TOP - bh / 2 + 10, 70, bh, 0x05000a)
        .setDepth(-10)
      this.bgFar.push(b)
    }

    // Летающие глитч-частицы
    for (let i = 0; i < 30; i++) {
      const ex = Phaser.Math.Between(0, W)
      const ey = Phaser.Math.Between(80, GROUND_TOP)
      const e = this.add.rectangle(ex, ey, 3, 3, 0xff3344, 0.7).setDepth(-4)
      this.tweens.add({
        targets: e,
        x: ex - 200,
        alpha: 0,
        duration: Phaser.Math.Between(2200, 4200),
        repeat: -1,
        delay: Phaser.Math.Between(0, 2500),
      })
    }

    // Текстура лазера
    if (!this.textures.exists("laserbeam")) {
      const g = this.make.graphics({ x: 0, y: 0 }, false)
      g.fillStyle(0xff2222, 1)
      g.fillRect(0, 0, 110, 18)
      g.fillStyle(0xffaaaa, 1)
      g.fillRect(0, 6, 110, 6)
      g.generateTexture("laserbeam", 110, 18)
      g.destroy()
    }

    // Земля (видимая текстура прокручивается для эффекта бега)
    this.groundTile = this.add.tileSprite(640, H - 32, 1280, 64, "tile_dark").setDepth(1)
    this.ground = this.physics.add.staticGroup()
    for (let x = 0; x <= W; x += 64) {
      const g = this.ground.create(x, H - 32, "tile_dark") as Phaser.Physics.Arcade.Sprite
      g.setVisible(false)
      g.refreshBody()
    }

    // Анимации
    if (!this.anims.exists("player-run")) {
      this.anims.create({
        key: "player-run",
        frames: this.anims.generateFrameNumbers("player", { start: 0, end: 5 }),
        frameRate: 12,
        repeat: -1,
      })
    }
    if (!this.anims.exists("exe-fly-idle")) {
      this.anims.create({
        key: "exe-fly-idle",
        frames: this.anims.generateFrameNumbers("exe_fly", { start: 0, end: 1 }),
        frameRate: 4,
        repeat: -1,
      })
    }

    // Игрок
    this.player = this.physics.add.sprite(-60, GROUND_TOP - 30, "player")
    this.player.setCollideWorldBounds(false)
    this.player.setDepth(8)
    this.physics.add.collider(this.player, this.ground)

    // exe (летающий)
    this.exe = this.add.sprite(1380, 200, "exe_fly").setDepth(9)
    this.exe.play("exe-fly-idle")
    this.exe.setVisible(false)

    // Группы
    this.hazards = this.physics.add.group({ allowGravity: false })
    this.pickups = this.physics.add.group({ allowGravity: false })
    this.physics.add.overlap(
      this.player,
      this.hazards,
      (_p, h) => this.hitPlayer(h as Phaser.Physics.Arcade.Sprite),
      undefined,
      this
    )

    this.dialog = new DialogBox(this)

    // Клавиши
    this.cursors = this.input.keyboard!.createCursorKeys()
    this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
    this.upKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.UP)
    this.touch = new TouchControls(this)
    this.input.keyboard!.on("keydown-SPACE", () => {
      if (this.dialog.active) this.dialog.next()
    })
    this.input.keyboard!.on("keydown-ENTER", () => {
      if (this.dialog.active) this.dialog.next()
    })
    this.input.keyboard!.addKey("F").on("down", () => this.scale.toggleFullscreen())

    // Музыка фоновая (тревожная)
    this.music = this.sound.add("ambient_horror", { loop: true, volume: 0.3 })
    this.music.play()

    this.cameras.main.fadeIn(700, 0, 0, 0)
    if (this.skipIntro) {
      this.startFightDirect()
    } else {
      this.startIntro()
    }
  }

  // Рестарт сразу в бой (без повтора вбегания, диалогов и обучения)
  private startFightDirect() {
    this.player.setPosition(LANE_X, GROUND_TOP - 30)
    this.player.setVelocity(0, 0)
    this.exe.setVisible(true)
    this.exe.setPosition(940, 230)
    this.startBob()
    this.startFight()
  }

  // ---------- КАТ-СЦЕНА: ПОБЕГ ----------
  private startIntro() {
    this.player.play("player-run", true)
    this.tweens.add({
      targets: this.player,
      x: LANE_X,
      duration: 1700,
      ease: "Sine.easeOut",
      onComplete: () => {
        this.player.stop()
        this.player.setFrame(0)
        this.dialog.show(
          [
            {
              speaker: "Стикмен",
              text: "Фух... кажется, оторвался. Я убежал в другую часть этого мира.",
              portrait: "portrait_player",
            },
            {
              speaker: "Стикмен",
              text: "Здесь он меня точно не найдёт...",
              portrait: "portrait_player",
            },
          ],
          () => this.exeArrives()
        )
      },
    })
  }

  private exeArrives() {
    this.phase = "warn"
    this.exe.setVisible(true)
    this.exe.setPosition(1380, 160)
    this.cameras.main.shake(400, 0.006)
    this.tweens.add({
      targets: this.exe,
      x: 940,
      y: 230,
      duration: 1400,
      ease: "Sine.easeInOut",
      onComplete: () => {
        this.startBob()
        this.dialog.show(
          [
            {
              speaker: "СТИКМЕН.EXE",
              text: "От меня. Не. Убежать.",
              portrait: "portrait_villain_evil",
            },
            {
              speaker: "СТИКМЕН.EXE",
              text: "ГОТОВЬСЯ К БОЮ!",
              portrait: "portrait_villain_evil",
            },
          ],
          () => this.showHowTo()
        )
      },
    })
  }

  private startBob() {
    this.exeBob = this.tweens.add({
      targets: this.exe,
      y: "+=28",
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    })
  }

  // ---------- ОКНО ОБУЧЕНИЯ ----------
  private showHowTo() {
    this.phase = "howto"
    this.touch.setVisible(false) // прячем кнопки за окном обучения
    const overlay = this.add
      .rectangle(640, 360, 1280, 720, 0x000000, 0.82)
      .setScrollFactor(0)
      .setDepth(2000)
    const box = this.add
      .rectangle(640, 330, 820, 340, 0x100018, 0.96)
      .setStrokeStyle(3, 0xff2a2a)
      .setScrollFactor(0)
      .setDepth(2001)
    const title = this.add
      .text(640, 200, "КАК ИГРАТЬ", {
        fontFamily: "monospace",
        fontSize: "30px",
        color: "#ff4444",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(2002)
    const body = this.add
      .text(
        640,
        320,
        "Персонаж бежит сам.\n\nПРОБЕЛ / ↑ — прыжок, чтобы уклоняться\nот ЛАЗЕРОВ и ШИПОВ внизу.\n← → — двигаться влево/вправо.\n\nСобирай КАМНИ и ЗЕМЛЮ на земле —\nперсонаж сам бросит их во врага!\nСнизь его HP до нуля.",
        {
          fontFamily: "monospace",
          fontSize: "19px",
          color: "#ffffff",
          align: "center",
          lineSpacing: 4,
        }
      )
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(2002)
    const okBtn = this.makeButton(640, 460, "ОК — НАЧАТЬ (или Пробел)", 0x227722, () =>
      begin()
    )
    okBtn.setDepth(2003)

    // Запуск боя — гарантированно один раз (кнопка / Пробел / Enter)
    const begin = () => {
      if (this.phase !== "howto") return
      overlay.destroy()
      box.destroy()
      title.destroy()
      body.destroy()
      okBtn.destroy()
      this.startFight()
    }
    this.input.keyboard!.once("keydown-SPACE", begin)
    this.input.keyboard!.once("keydown-ENTER", begin)
  }

  // ---------- БОЙ ----------
  private startFight() {
    this.phase = "fight"
    this.touch.setVisible(true) // кнопки управления нужны в бою
    if (this.music && this.music.isPlaying) this.music.stop()
    this.music = this.sound.add("boss_music", { loop: true, volume: 0.5 })
    this.music.play()

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
    this.updateBars()
    this.banner("БОЙ!", "#ff3333", 1200)
    this.add
      .text(640, H - 26, "ПРОБЕЛ/↑ — прыжок    ← → — движение", {
        fontFamily: "monospace",
        fontSize: "15px",
        color: "#999999",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(30)

    this.player.play("player-run", true)

    // Первая атака быстро, чтобы сразу было понятно что начался бой
    this.time.delayedCall(900, () => this.exeAttack())
    // Атаки exe — чередуются лазеры и шипы
    this.attackTimer = this.time.addEvent({
      delay: 1400,
      loop: true,
      callback: () => this.exeAttack(),
    })
    // Через 15 секунд начинают появляться камни/земля
    this.rockDelay = this.time.delayedCall(15000, () => {
      this.floatText(LANE_X, GROUND_TOP - 130, "КАМНИ! Беги на них!", "#ffdd55")
      this.spawnRock()
      this.rockTimer = this.time.addEvent({
        delay: 2800,
        loop: true,
        callback: () => this.spawnRock(),
      })
    })
  }

  private exeAttack() {
    if (this.phase !== "fight") return
    const useLaser = Math.random() < 0.5

    // ТЕЛЕГРАФ: босс заметно заряжает атаку — краснеет и пульсирует
    this.exe.setTint(0xff5555)
    this.tweens.add({
      targets: this.exe,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 200,
      yoyo: true,
      onComplete: () => this.exe.clearTint(),
    })

    // Сам выстрел через короткую задержку (после замаха)
    this.time.delayedCall(220, () => {
      if (this.phase !== "fight") return
      if (useLaser) {
        this.exe.stop()
        this.exe.setFrame(2)
        this.sound.play("laser", { volume: 0.55 })
        this.cameras.main.flash(120, 80, 0, 0)
        const laser = this.hazards.create(
          1280,
          GROUND_TOP - 40,
          "laserbeam"
        ) as Phaser.Physics.Arcade.Sprite
        laser.setScale(1.7, 1.5)
        laser.setDepth(7)
        const body = laser.body as Phaser.Physics.Arcade.Body
        body.setAllowGravity(false) // явно: лазер НЕ падает
        laser.setVelocityX(-470)
        laser.setData("dmg", Phaser.Math.Between(10, 15))
        // пульсация, чтобы лазер был хорошо заметен
        this.tweens.add({
          targets: laser,
          alpha: { from: 1, to: 0.5 },
          duration: 90,
          yoyo: true,
          repeat: -1,
        })
      } else {
        this.exe.stop()
        this.exe.setFrame(3)
        this.sound.play("hit", { volume: 0.4 })
        const spike = this.hazards.create(
          1280,
          GROUND_TOP + 8,
          "spike"
        ) as Phaser.Physics.Arcade.Sprite
        spike.setOrigin(0.5, 1)
        spike.setScale(1.1)
        spike.setDepth(7)
        const body = spike.body as Phaser.Physics.Arcade.Body
        body.setAllowGravity(false) // явно: шип НЕ падает
        spike.setVelocityX(-400)
        spike.setData("dmg", Phaser.Math.Between(9, 13))
      }
      // вернуть босса к парящей анимации
      this.time.delayedCall(380, () => {
        if (this.phase === "fight") this.exe.play("exe-fly-idle")
      })
    })
  }

  private spawnRock() {
    if (this.phase !== "fight") return
    const isRock = Math.random() < 0.5
    const r = this.pickups.create(1280, GROUND_TOP - 24, "rock") as Phaser.Physics.Arcade.Sprite
    r.setScale(isRock ? 0.2 : 0.17)
    r.setTint(isRock ? 0xbbbbbb : 0x7a4a1f)
    r.setDepth(7)
    r.setVelocityX(-210)
    ;(r.body as Phaser.Physics.Arcade.Body).setAllowGravity(false)
    r.setData("collected", false)
    // Светящийся маркер, чтобы было видно что подбирать
    const glow = this.add.circle(r.x, r.y, 22, 0xffee44, 0.3).setDepth(6)
    r.setData("glow", glow)
    this.tweens.add({ targets: r, angle: 360, duration: 700, repeat: -1 })
    this.tweens.add({
      targets: glow,
      scale: { from: 0.8, to: 1.4 },
      alpha: { from: 0.45, to: 0.12 },
      duration: 500,
      yoyo: true,
      repeat: -1,
    })
  }

  private hitPlayer(h: Phaser.Physics.Arcade.Sprite) {
    if (this.phase !== "fight" || this.invuln) return
    const dmg = (h.getData("dmg") as number) || 10
    h.destroy()
    this.playerHp = Math.max(0, this.playerHp - dmg)
    this.updateBars()
    this.sound.play("hit", { volume: 0.6 })
    this.cameras.main.shake(180, 0.014)
    this.cameras.main.flash(120, 120, 0, 0)
    this.floatText(this.player.x, this.player.y - 70, "-" + dmg, "#ff5555")
    if (this.playerHp <= 0) {
      this.lose()
      return
    }
    // Неуязвимость + мигание
    this.invuln = true
    this.tweens.add({
      targets: this.player,
      alpha: 0.3,
      duration: 110,
      yoyo: true,
      repeat: 4,
      onComplete: () => {
        this.player.setAlpha(1)
        this.invuln = false
      },
    })
  }

  private collectRock(r: Phaser.Physics.Arcade.Sprite) {
    if (this.phase !== "fight") return
    if (r.getData("collected")) return
    r.setData("collected", true)
    const oldGlow = r.getData("glow") as Phaser.GameObjects.Arc | undefined
    oldGlow?.destroy()
    const fromX = this.player.x
    const fromY = this.player.y - 20
    r.destroy()
    this.floatText(this.player.x, this.player.y - 80, "БРОСОК!", "#ffffff")
    // Авто-бросок во врага
    const proj = this.add.image(fromX, fromY, "rock").setScale(0.13).setTint(0xaaaaaa).setDepth(12)
    this.tweens.add({
      targets: proj,
      x: this.exe.x,
      y: this.exe.y,
      rotation: 6,
      duration: 360,
      ease: "Quad.easeIn",
      onComplete: () => {
        proj.destroy()
        if (this.phase !== "fight") return
        const dmg = Phaser.Math.Between(14, 20)
        this.exeHp = Math.max(0, this.exeHp - dmg)
        this.updateBars()
        this.exe.setTintFill(0xffffff)
        this.time.delayedCall(110, () => this.exe.clearTint())
        this.sound.play("hit", { volume: 0.7 })
        this.floatText(this.exe.x, this.exe.y - 50, "-" + dmg, "#ffdd55")
        if (this.exeHp <= 0) this.win()
      },
    })
  }

  // ---------- ПОБЕДА ----------
  private win() {
    if (this.phase === "over") return
    this.phase = "over"
    this.stopTimers()
    this.touch.setVisible(false)
    this.hazards.clear(true, true)
    this.pickups.clear(true, true)
    this.exeBob?.stop()
    this.player.stop()
    this.player.setFrame(0)
    this.sound.play("win", { volume: 0.6 })
    this.banner("ПОБЕДА!", "#ffee44", 1600)
    // exe падает и вырубается
    this.exe.stop()
    this.exe.setFrame(0)
    this.exe.setTint(0x444444)
    this.tweens.add({
      targets: this.exe,
      y: GROUND_TOP - 14,
      angle: 96,
      alpha: 0.55,
      duration: 900,
      ease: "Bounce.easeOut",
    })
    this.time.delayedCall(1500, () => {
      this.dialog.show(
        [
          { speaker: "СТИКМЕН.EXE", text: "Не...возможно... Я ещё... вернусь...", portrait: "portrait_villain_evil" },
          { speaker: "Стикмен", text: "Он упал... вырубился. Я смог.", portrait: "portrait_player" },
        ],
        () => this.finishGame()
      )
    })
  }

  private finishGame() {
    if (this.music && this.music.isPlaying) this.music.stop()
    const ov = this.add
      .rectangle(640, 360, 1280, 720, 0x000000)
      .setScrollFactor(0)
      .setDepth(4000)
      .setAlpha(0)
    this.tweens.add({
      targets: ov,
      alpha: 1,
      duration: 1400,
      onComplete: () => {
        this.bigText(110, "ТЫ ВЫРУБИЛ СТИКМЕН.EXE!", "32px", "#33dd33")
        this.bigText(156, "Но он ещё дышит... Нужно бежать дальше!", "19px", "#aaaaaa")
        this.bigText(212, "ГЛАВА 4 ЗАВЕРШЕНА", "22px", "#888888")
        const next = this.makeButton(640, 300, "ГЛАВА 5 ▶", 0x227722, () => {
          if (this.music && this.music.isPlaying) this.music.stop()
          this.scene.start("FinaleScene")
        })
        next.setDepth(4500)
        this.menuButton(372, "В меню")
        this.bigText(470, "Нашли баг? Поддержка:", "17px", "#999999")
        this.supportLink(520)
      },
    })
  }

  // ---------- ПОРАЖЕНИЕ ----------
  private lose() {
    if (this.phase === "over") return
    this.phase = "over"
    this.stopTimers()
    this.touch.setVisible(false)
    this.hazards.clear(true, true)
    this.pickups.clear(true, true)
    this.exeBob?.stop()
    if (this.music && this.music.isPlaying) this.music.stop()
    this.sound.play("kill", { volume: 0.9 })
    this.cameras.main.shake(600, 0.03)
    this.player.setTint(0xaa0000)
    this.tweens.add({ targets: this.player, angle: 90, y: GROUND_TOP - 12, duration: 500 })
    const ov = this.add
      .rectangle(640, 360, 1280, 720, 0x000000)
      .setScrollFactor(0)
      .setDepth(4000)
      .setAlpha(0)
    this.tweens.add({
      targets: ov,
      alpha: 0.92,
      duration: 900,
      onComplete: () => {
        this.bigText(210, "ИГРА ОКОНЧЕНА", "46px", "#cc0000")
        this.bigText(290, "СТИКМЕН.EXE оказался сильнее...", "22px", "#aaaaaa")
        const retry = this.makeButton(640, 380, "↻ Попробовать заново", 0x227722, () =>
          this.scene.restart({ skipIntro: true })
        )
        retry.setDepth(4500)
        this.menuButton(448, "В меню")
        this.bigText(540, "Нашли баг? Поддержка:", "17px", "#999999")
        this.supportLink(590)
      },
    })
  }

  private stopTimers() {
    this.attackTimer?.remove()
    this.rockTimer?.remove()
    this.rockDelay?.remove()
  }

  update() {
    if (this.phase !== "fight") return
    const body = this.player.body as Phaser.Physics.Arcade.Body
    // ЖЁСТКИЙ ПОЛ: не даём игроку провалиться сквозь землю ни при каких условиях
    if (this.player.y > GROUND_TOP - 30) {
      this.player.y = GROUND_TOP - 30
      if (body.velocity.y > 0) body.setVelocityY(0)
    }
    const onGround =
      body.blocked.down || body.touching.down || this.player.y >= GROUND_TOP - 30
    if (onGround && this.player.anims.currentAnim?.key !== "player-run") {
      this.player.play("player-run", true)
    }
    // Управление влево/вправо (клавиатура + сенсор)
    const left = this.cursors.left.isDown || this.touch.left
    const right = this.cursors.right.isDown || this.touch.right
    if (left) this.player.x = Math.max(150, this.player.x - 4.5)
    else if (right) this.player.x = Math.min(620, this.player.x + 4.5)
    else this.player.x += (LANE_X - this.player.x) * 0.05
    // Прыжок (клавиатура + сенсор)
    const jumpPressed =
      Phaser.Input.Keyboard.JustDown(this.spaceKey) ||
      Phaser.Input.Keyboard.JustDown(this.upKey) ||
      this.touch.consumeJump()
    if (onGround && jumpPressed) {
      body.setVelocityY(-720)
    }
    // Прокрутка земли и фона — эффект бега
    this.groundTile.tilePositionX += 6
    for (const b of this.bgFar) {
      b.x -= 1.2
      if (b.x < -50) b.x += 1560
    }
    // Хазарды: чистка за экраном
    this.hazards.getChildren().forEach((c) => {
      const s = c as Phaser.Physics.Arcade.Sprite
      if (s.x < -80) s.destroy()
    })
    // Камни: движение маркера, лёгкий подбор и чистка
    this.pickups.getChildren().forEach((c) => {
      const s = c as Phaser.Physics.Arcade.Sprite
      const glow = s.getData("glow") as Phaser.GameObjects.Arc | undefined
      if (glow) glow.setPosition(s.x, s.y)
      if (s.x < -80) {
        glow?.destroy()
        s.destroy()
        return
      }
      if (!s.getData("collected") && Math.abs(s.x - this.player.x) < 52) {
        this.collectRock(s)
      }
    })
  }

  // ---------- ВСПОМОГАТЕЛЬНЫЕ ----------
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

  private menuButton(y: number, label: string) {
    const b = this.makeButton(640, y, label, 0x661111, () => {
      if (this.music && this.music.isPlaying) this.music.stop()
      this.scene.start("MenuScene")
    })
    b.setDepth(4500)
  }

  // Анимированная иконка Telegram + кликабельный хендл тех. поддержки
  private supportLink(y: number) {
    const icon = this.add
      .image(486, y, "tg_icon")
      .setDisplaySize(58, 58)
      .setScrollFactor(0)
      .setDepth(4500)
    const baseScale = icon.scaleX
    // плавное покачивание вверх-вниз
    this.tweens.add({
      targets: icon,
      y: y - 8,
      duration: 850,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    })
    // лёгкая пульсация
    this.tweens.add({
      targets: icon,
      scaleX: baseScale * 1.1,
      scaleY: baseScale * 1.1,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    })
    // лёгкое покачивание по углу
    this.tweens.add({
      targets: icon,
      angle: { from: -6, to: 6 },
      duration: 1300,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    })
    const handle = this.add
      .text(525, y, "@StickmanGameSupportBot", {
        fontFamily: "monospace",
        fontSize: "24px",
        color: "#33bbff",
      })
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(4500)
      .setInteractive({ useHandCursor: true })
    handle.on("pointerover", () => handle.setColor("#66d0ff"))
    handle.on("pointerout", () => handle.setColor("#33bbff"))
    handle.on("pointerdown", () => {
      window.open("https://t.me/StickmanGameSupportBot", "_blank")
    })
  }

  private bigText(y: number, txt: string, size: string, color: string) {
    this.add
      .text(640, y, txt, { fontFamily: "monospace", fontSize: size, color, align: "center" })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(4001)
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

  private floatText(x: number, y: number, msg: string, color: string) {
    const t = this.add
      .text(x, y, msg, {
        fontFamily: "monospace",
        fontSize: "26px",
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
      duration: 850,
      onComplete: () => t.destroy(),
    })
  }
}
