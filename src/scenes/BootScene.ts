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

    // Логируем файлы, которые не удалось загрузить (для отладки на проде)
    this.load.on("loaderror", (file: Phaser.Loader.File) => {
      console.warn(`[loader] не загрузился ресурс: ${file.key} (${file.src})`)
    })

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
    this.load.image("syrok", "assets/syrok.jpg")
    this.load.image("jimmy", "assets/jimmy.jpg")
    this.load.image("patya", "assets/patya.jpg")
    this.load.audio("boss_music", "assets/boss_music.wav")
    this.load.audio("laser", "assets/laser.wav")

    // Глава 5
    this.load.audio("finale_music", "assets/finale_music.wav")
    this.load.audio("exe_battle", "assets/exe_battle.wav")
    this.load.audio("ring_win", "assets/ring_win.wav")
    this.load.audio("exe_appear", "assets/exe_appear.wav")
    this.load.audio("ring_collect", "assets/ring_collect.wav")
    this.load.audio("ring_throw", "assets/ring_throw.wav")
    this.load.audio("big_ring_hum", "assets/big_ring_hum.wav")
    this.load.audio("teleport", "assets/teleport.wav")
    this.load.audio("impact", "assets/impact.wav")
  }

  create() {
    this.installSafeAudio()
    this.scene.start("MenuScene")
  }

  // Делает воспроизведение звука безопасным для ВСЕЙ игры:
  // если аудио-файл не загрузился (например 404), звук просто пропускается,
  // а не роняет игровой цикл необработанной ошибкой "Audio key not found in cache".
  private installSafeAudio() {
    const sm = this.sound as unknown as {
      __safe?: boolean
      play: (key: string, extra?: unknown) => unknown
      add: (key: string, config?: unknown) => unknown
    }
    if (sm.__safe) return
    sm.__safe = true

    const cache = this.cache.audio
    const origPlay = sm.play.bind(sm)
    const origAdd = sm.add.bind(sm)

    sm.play = (key: string, extra?: unknown) => {
      if (!cache.exists(key)) {
        console.warn(`[audio] звук "${key}" пропущен — файл не загружен`)
        return false
      }
      try {
        return origPlay(key, extra)
      } catch (e) {
        console.warn(`[audio] не удалось проиграть "${key}"`, e)
        return false
      }
    }

    sm.add = (key: string, config?: unknown) => {
      if (!cache.exists(key)) {
        console.warn(`[audio] звук "${key}" не загружен — беззвучная заглушка`)
        return makeSilentSound()
      }
      try {
        return origAdd(key, config)
      } catch (e) {
        console.warn(`[audio] не удалось создать "${key}"`, e)
        return makeSilentSound()
      }
    }
  }
}

// Беззвучная заглушка с теми же методами, что используют сцены,
// чтобы код вида music.play()/stop()/isPlaying и твины громкости не падали.
function makeSilentSound(): Phaser.Sound.BaseSound {
  const stub = {
    isPlaying: false,
    isPaused: false,
    volume: 0,
    play() {
      this.isPlaying = true
      return true
    },
    stop() {
      this.isPlaying = false
      return true
    },
    pause() {
      this.isPaused = true
      return true
    },
    resume() {
      this.isPaused = false
      return true
    },
    setVolume(v: number) {
      this.volume = v
      return this
    },
    setLoop() {
      return this
    },
    setRate() {
      return this
    },
    destroy() {},
    on() {
      return this
    },
    once() {
      return this
    },
    off() {
      return this
    },
  }
  return stub as unknown as Phaser.Sound.BaseSound
}
