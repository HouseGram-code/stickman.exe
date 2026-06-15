import Phaser from "phaser"

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene")
  }

  preload() {
    const t = this.add
      .text(640, 360, "Загрузка...", {
        fontFamily: "monospace",
        fontSize: "32px",
        color: "#ffffff",
      })
      .setOrigin(0.5)
    this.load.on("complete", () => t.destroy())

    this.load.spritesheet("player", "assets/player.png", {
      frameWidth: 48,
      frameHeight: 64,
    })
    this.load.image("villain", "assets/villain.png")
    this.load.image("villain_evil", "assets/villain_evil.png")
    this.load.image("portrait_player", "assets/portrait_player.png")
    this.load.image("portrait_villain", "assets/portrait_villain.png")
    this.load.image("portrait_villain_evil", "assets/portrait_villain_evil.png")
    this.load.spritesheet("bird", "assets/bird.png", {
      frameWidth: 32,
      frameHeight: 20,
    })
    this.load.image("cloud", "assets/cloud.png")
    this.load.image("tree", "assets/tree.png")
    this.load.image("pine", "assets/pine.png")
    this.load.image("egg", "assets/egg.png")
    this.load.image("blood", "assets/blood.png")
    this.load.image("scream", "assets/scream.png")
    this.load.image("tile", "assets/tile.png")
    this.load.image("tile_dark", "assets/tile_dark.png")
    this.load.audio("music_happy", "assets/music_happy.wav")
    this.load.audio("ambient_horror", "assets/ambient_horror.wav")
    this.load.audio("jumpscare", "assets/jumpscare.wav")
    this.load.audio("heartbeat", "assets/heartbeat.wav")
    this.load.audio("music_menu", "assets/music_menu.wav")
    this.load.audio("click", "assets/click.wav")
    this.load.spritesheet("fire", "assets/fire.png", {
      frameWidth: 40,
      frameHeight: 56,
    })
    this.load.image("rock", "assets/rock.png")
    this.load.audio("chase_music", "assets/chase_music.wav")
    this.load.audio("fire", "assets/fire.wav")
    this.load.audio("jump_cue", "assets/jump_cue.wav")
    this.load.audio("laugh", "assets/laugh.wav")
    this.load.audio("hit", "assets/hit.wav")
    this.load.audio("kill", "assets/kill.wav")
    this.load.audio("win", "assets/win.wav")
    this.load.spritesheet("exe_fly", "assets/exe_fly.png", {
      frameWidth: 64,
      frameHeight: 80,
    })
    this.load.image("spike", "assets/spike.png")
    this.load.image("tg_icon", "assets/tg_icon.png")
    this.load.audio("boss_music", "assets/boss_music.wav")
    this.load.audio("laser", "assets/laser.wav")
  }

  create() {
    this.scene.start("MenuScene")
  }
}
