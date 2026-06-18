// Генератор звуков и музыки для Главы 5 (без внешних зависимостей).
// Пишет 16-bit PCM WAV прямо в public/assets.
import fs from "fs"
import path from "path"

const OUT = path.resolve("public/assets")
const SR = 44100

function writeWav(file, samples, sr = SR) {
  const buf = Buffer.alloc(44 + samples.length * 2)
  buf.write("RIFF", 0)
  buf.writeUInt32LE(36 + samples.length * 2, 4)
  buf.write("WAVE", 8)
  buf.write("fmt ", 12)
  buf.writeUInt32LE(16, 16)
  buf.writeUInt16LE(1, 20) // PCM
  buf.writeUInt16LE(1, 22) // mono
  buf.writeUInt32LE(sr, 24)
  buf.writeUInt32LE(sr * 2, 28)
  buf.writeUInt16LE(2, 32)
  buf.writeUInt16LE(16, 34)
  buf.write("data", 36)
  buf.writeUInt32LE(samples.length * 2, 40)
  for (let i = 0; i < samples.length; i++) {
    let s = Math.max(-1, Math.min(1, samples[i]))
    buf.writeInt16LE((s * 32767) | 0, 44 + i * 2)
  }
  fs.writeFileSync(path.join(OUT, file), buf)
  console.log("written", file, (buf.length / 1024).toFixed(0) + "KB")
}

const TAU = Math.PI * 2

// Звонкое кольцо (как сбор кольца у Sonic): два высоких тона
function ringCollect() {
  const dur = 0.4
  const n = (SR * dur) | 0
  const out = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const t = i / SR
    const f = t < 0.09 ? 1318.5 : 1760.0 // E6 -> A6
    const env = Math.exp(-((t < 0.09 ? t : t - 0.09)) * 11)
    out[i] = 0.5 * env * Math.sin(TAU * f * t) + 0.18 * env * Math.sin(TAU * f * 2 * t)
  }
  return out
}

// Бросок зелёного кольца — свист с шумом по нисходящей
function ringThrow() {
  const dur = 0.45
  const n = (SR * dur) | 0
  const out = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const t = i / SR
    const env = Math.exp(-t * 5.5)
    const f = 1000 * Math.exp(-t * 4) + 160
    const noise = (Math.random() * 2 - 1) * 0.35 * Math.exp(-t * 9)
    out[i] = env * (0.4 * Math.sin(TAU * f * t) + noise)
  }
  return out
}

// Гул большого кольца — мерцающий аккорд (короткий, проигрывается разово)
function bigRingHum() {
  const dur = 2.2
  const n = (SR * dur) | 0
  const out = new Float32Array(n)
  const freqs = [220, 277.18, 329.63, 440]
  for (let i = 0; i < n; i++) {
    const t = i / SR
    let s = 0
    for (const f of freqs) s += Math.sin(TAU * f * t)
    s /= freqs.length
    const trem = 0.7 + 0.3 * Math.sin(TAU * 5.5 * t)
    let env = 1
    const fade = 0.25
    if (t < fade) env = t / fade
    if (t > dur - fade) env = (dur - t) / fade
    out[i] = 0.42 * s * trem * env
  }
  return out
}

// Телепорт — восходящий свип со «сверканием»
function teleport() {
  const dur = 1.1
  const n = (SR * dur) | 0
  const out = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const t = i / SR
    const f = 200 * Math.exp(t * 2.4) // 200 -> ~2700 Гц
    const env = t < 0.85 ? 1 : Math.max(0, 1 - (t - 0.85) / 0.25)
    const sparkle =
      0.18 * Math.sin(TAU * f * 3 * t) * Math.max(0, Math.sin(TAU * 20 * t))
    out[i] = env * (0.42 * Math.sin(TAU * f * t) + sparkle)
  }
  return out
}

// Удар (засада exe) — низкий «бум» с шумом
function impact() {
  const dur = 0.6
  const n = (SR * dur) | 0
  const out = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const t = i / SR
    const env = Math.exp(-t * 7)
    const f = 90 * Math.exp(-t * 6) + 45
    const noise = (Math.random() * 2 - 1) * 0.5 * Math.exp(-t * 16)
    out[i] = env * (0.6 * Math.sin(TAU * f * t) + noise)
  }
  return out
}

// Тёмный эмбиент-дрон для уровня (зацикленный)
function finaleMusic() {
  const sr = 22050
  const dur = 12
  const n = (sr * dur) | 0
  const out = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const t = i / sr
    const lfo = 0.5 + 0.5 * Math.sin(TAU * 0.07 * t)
    let s = 0
    s += 0.5 * Math.sin(TAU * 55 * t)
    s += 0.34 * Math.sin(TAU * 82.41 * t)
    s += 0.2 * Math.sin(TAU * 110 * t) * lfo
    s += 0.12 * Math.sin(TAU * 164.81 * t) * (0.5 + 0.5 * Math.sin(TAU * 0.11 * t + 1))
    s += 0.045 * Math.sin(TAU * 440 * t) * Math.max(0, Math.sin(TAU * 0.05 * t))
    let env = 1
    const fade = 0.4
    if (t < fade) env = t / fade
    if (t > dur - fade) env = (dur - t) / fade
    out[i] = 0.5 * s * env * (0.82 + 0.18 * lfo)
  }
  return { samples: out, sr }
}

// Агрессивный боевой трек — появление STICKMAN.EXE (зацикленный)
function exeBattle() {
  const sr = 22050
  const bpm = 148
  const beat = 60 / bpm
  const eighth = beat / 2
  const bars = 4
  const dur = bars * 4 * beat
  const n = (sr * dur) | 0
  const out = new Float32Array(n)

  const note = (semi) => 440 * Math.pow(2, semi / 12)
  // ля-минор, низкие октавы
  const A2 = -24, C3 = -21, E3 = -17, G3 = -14
  const bassSeq = [A2, A2, E3, A2, C3, A2, E3, G3]
  const leadSeq = [0, 3, 2, 7, 10, 7, 3, 2] // от A4

  const square = (ph) => (Math.sin(ph) >= 0 ? 1 : -1)
  const saw = (ph) => 2 * (((ph / TAU) % 1) - 0.5)

  for (let i = 0; i < n; i++) {
    const t = i / sr
    let s = 0
    // бас (восьмые), квадрат
    const ei = Math.floor(t / eighth)
    const bf = note(bassSeq[ei % bassSeq.length])
    s += 0.32 * square(TAU * bf * t)
    // бочка на каждую долю
    const inBeat = t % beat
    const kenv = Math.exp(-inBeat * 28)
    const kf = 120 * Math.exp(-inBeat * 28) + 46
    s += 0.5 * Math.sin(TAU * kf * t) * kenv
    // хэт на офф-бит
    if (inBeat > beat * 0.5) {
      s += 0.1 * (Math.random() * 2 - 1) * Math.exp(-(inBeat - beat * 0.5) * 55)
    }
    // зловещий лид (четвертями), пила октавой выше
    const qi = Math.floor(t / beat)
    const lf = note(leadSeq[qi % leadSeq.length] + 12)
    s += 0.15 * saw(TAU * lf * t)
    // дисторшн
    s = Math.tanh(s * 1.7)
    let env = 1
    const fade = 0.04
    if (t < fade) env = t / fade
    if (t > dur - fade) env = (dur - t) / fade
    out[i] = 0.6 * s * env
  }
  return { samples: out, sr }
}

// Приятный победный звук — вход в Кольцо (восходящее арпеджио + шиммер)
function ringWin() {
  const dur = 1.6
  const n = (SR * dur) | 0
  const out = new Float32Array(n)
  const notes = [523.25, 659.25, 783.99, 1046.5] // C5 E5 G5 C6
  const step = 0.16
  for (let i = 0; i < n; i++) {
    const t = i / SR
    let s = 0
    for (let k = 0; k < notes.length; k++) {
      const start = k * step
      if (t >= start) {
        const lt = t - start
        const env = Math.exp(-lt * 4)
        s += 0.3 * env * Math.sin(TAU * notes[k] * t) + 0.1 * env * Math.sin(TAU * notes[k] * 2 * t)
      }
    }
    const cs = notes.length * step
    if (t >= cs) {
      const lt = t - cs
      const env = Math.exp(-lt * 2.2)
      for (const f of notes) s += 0.12 * env * Math.sin(TAU * f * t)
      s += 0.05 * env * Math.sin(TAU * 1568 * t) * (0.5 + 0.5 * Math.sin(TAU * 6 * t))
    }
    out[i] = Math.tanh(s * 1.1) * 0.7
  }
  return out
}

// Страшный стингер — появление STICKMAN.EXE (нисходящий вой + удар + бум)
function exeAppear() {
  const dur = 1.3
  const n = (SR * dur) | 0
  const out = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const t = i / SR
    const f = 800 * Math.exp(-t * 1.6) + 60
    const env = Math.exp(-t * 1.2)
    let s = 0.35 * env * Math.sin(TAU * f * t)
    s += 0.12 * env * Math.sin(TAU * f * 1.06 * t) // расстройка -> диссонанс
    s += 0.1 * env * Math.sin(TAU * f * 0.5 * t)
    const hit = Math.exp(-t * 22)
    s += 0.5 * hit * (Math.random() * 2 - 1) // удар-шум в начале
    s += 0.4 * Math.exp(-t * 5) * Math.sin(TAU * (70 * Math.exp(-t * 4) + 38) * t) // бум
    out[i] = Math.tanh(s * 1.5) * 0.7
  }
  return out
}

writeWav("ring_collect.wav", ringCollect())
writeWav("ring_throw.wav", ringThrow())
writeWav("big_ring_hum.wav", bigRingHum())
writeWav("teleport.wav", teleport())
writeWav("impact.wav", impact())
const fm = finaleMusic()
writeWav("finale_music.wav", fm.samples, fm.sr)
const eb = exeBattle()
writeWav("exe_battle.wav", eb.samples, eb.sr)
writeWav("ring_win.wav", ringWin())
writeWav("exe_appear.wav", exeAppear())
console.log("done")
