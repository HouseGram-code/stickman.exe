/// <reference types="vite-plugin-pwa/client" />
import { registerSW } from "virtual:pwa-register"

// Небольшой баннер-индикатор сверху экрана: показывает игроку,
// что игра скачивается в офлайн-кэш и затем готова к игре без интернета.

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

let el: HTMLDivElement | null = null
let titleEl: HTMLElement | null = null
let subEl: HTMLElement | null = null
let hideTimer: number | undefined

function injectStyles() {
  if (document.getElementById("pwa-offline-style")) return
  const s = document.createElement("style")
  s.id = "pwa-offline-style"
  s.textContent = `
  #pwa-offline {
    position: fixed; top: 10px; left: 50%; transform: translateX(-50%);
    z-index: 99999; pointer-events: none;
    max-width: 92vw; box-sizing: border-box;
    background: rgba(10,0,0,0.9); border: 2px solid #aa0000; border-radius: 10px;
    color: #fff; font-family: monospace; font-size: 14px; line-height: 1.35;
    padding: 8px 14px 10px; text-align: center;
    box-shadow: 0 6px 22px rgba(0,0,0,0.55);
    opacity: 0; transition: opacity .45s ease;
  }
  #pwa-offline.show { opacity: 1; }
  #pwa-offline .pwa-title { color: #ff5555; font-weight: bold; }
  #pwa-offline .pwa-sub { color: #ddd; font-size: 12px; margin-top: 2px; }
  #pwa-offline .pwa-bar {
    margin-top: 7px; height: 6px; border-radius: 4px; overflow: hidden;
    background: #3a0000; position: relative;
  }
  #pwa-offline .pwa-bar > i {
    position: absolute; top: 0; bottom: 0; left: -40%; width: 40%;
    background: linear-gradient(90deg, transparent, #ff3b3b, transparent);
    animation: pwa-slide 1.1s linear infinite;
  }
  #pwa-offline.done .pwa-bar > i {
    animation: none; left: 0; width: 100%; background: #2faa2f;
  }
  @keyframes pwa-slide { 0% { left: -40%; } 100% { left: 100%; } }
  `
  document.head.appendChild(s)
}

function ensureBanner() {
  if (el) return
  injectStyles()
  el = document.createElement("div")
  el.id = "pwa-offline"
  el.innerHTML =
    '<div class="pwa-title"></div>' +
    '<div class="pwa-sub"></div>' +
    '<div class="pwa-bar"><i></i></div>'
  titleEl = el.querySelector(".pwa-title")
  subEl = el.querySelector(".pwa-sub")
  document.body.appendChild(el)
  requestAnimationFrame(() => el && el.classList.add("show"))
}

function setText(title: string, sub: string) {
  ensureBanner()
  if (titleEl) titleEl.textContent = title
  if (subEl) subEl.textContent = sub
}

function hide(delay = 500) {
  if (!el) return
  el.classList.remove("show")
  const target = el
  el = null
  titleEl = null
  subEl = null
  window.setTimeout(() => target.remove(), delay)
}

function markDone(title: string, sub: string) {
  if (hideTimer) clearTimeout(hideTimer)
  setText(title, sub)
  el && el.classList.add("done")
  hideTimer = window.setTimeout(() => hide(), 6500)
}

// Сколько файлов игры уже сохранено в офлайн-кэш (для прогресса)
async function precacheCount(): Promise<number> {
  try {
    if (!("caches" in window)) return 0
    const names = await caches.keys()
    const name = names.find((n) => /precache/i.test(n))
    if (!name) return 0
    const cache = await caches.open(name)
    return (await cache.keys()).length
  } catch {
    return 0
  }
}

let offlineReady = false

async function pollProgress() {
  setText(
    "Сохраняю игру для офлайна…",
    "Скачиваю файлы игры — можно будет играть без интернета."
  )
  const start = Date.now()
  while (!offlineReady && Date.now() - start < 60000) {
    const n = await precacheCount()
    if (offlineReady) break
    if (n > 0) {
      setText(
        "Сохраняю игру для офлайна…",
        `Загружено файлов: ${n}. Скоро можно будет играть без интернета.`
      )
    }
    await sleep(500)
  }
  // подстраховка: если событие готовности так и не пришло — просто убираем баннер
  if (!offlineReady) hide(0)
}

if ("serviceWorker" in navigator) {
  // на первом заходе SW ещё не управляет страницей -> показываем прогресс кэширования
  const firstVisit = !navigator.serviceWorker.controller

  // Авто-обновление: когда активировался НОВЫЙ service worker (вышла новая версия
  // игры), он берёт управление страницей -> один раз перезагружаемся, чтобы игрок
  // сразу получил свежую сборку, а не сидел на старом кэше.
  let reloading = false
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (reloading || firstVisit) return
    reloading = true
    setText("Обновление…", "Загружаю новую версию игры")
    window.location.reload()
  })

  registerSW({
    immediate: true,
    onOfflineReady() {
      offlineReady = true
      precacheCount().then((n) => {
        markDone(
          "Игра сохранена!",
          (n > 0 ? `Сохранено файлов: ${n}. ` : "") +
            "Теперь работает офлайн — можно отключить интернет и играть."
        )
      })
    },
    onRegisteredSW(_swUrl, reg) {
      if (firstVisit) pollProgress()
      if (!reg) return
      // регулярно проверяем, не вышла ли новая версия, и при возвращении на вкладку
      const check = () => {
        reg.update().catch(() => {})
      }
      setInterval(check, 5 * 60 * 1000)
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") check()
      })
      window.addEventListener("focus", check)
    },
  })
}
