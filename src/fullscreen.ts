import Phaser from "phaser"

// Утилиты «погружения»: полноэкранный режим + поворот телефона в альбомную
// ориентацию. Вызывать только из обработчика жеста пользователя (тап/клик).

export function isTouchDevice(): boolean {
  try {
    return (
      (typeof navigator !== "undefined" && navigator.maxTouchPoints > 0) ||
      (typeof window !== "undefined" && "ontouchstart" in window)
    )
  } catch {
    return false
  }
}

// Зафиксировать альбомную ориентацию (Android в фуллскрине; на iOS API нет).
function lockLandscape() {
  try {
    const o: any = (screen as any).orientation
    if (o && typeof o.lock === "function") o.lock("landscape").catch(() => {})
  } catch {
    // не поддерживается — игнорируем
  }
}

// ВАЖНО: после входа в фуллскрин и поворота экрана у Phaser «съезжают»
// границы канваса для ввода (canvasBounds). Из-за этого тапы попадают мимо
// и кнопки перестают нажиматься. Принудительный refresh() пересчитывает их.
function refreshScale(scale: Phaser.Scale.ScaleManager) {
  try {
    scale.refresh()
  } catch {
    // ignore
  }
}

export function enterImmersive(scene: Phaser.Scene) {
  const scale = scene.scale
  try {
    if (scale && !scale.isFullscreen) scale.startFullscreen()
  } catch {
    // фуллскрин недоступен — продолжаем без него
  }
  // вход в фуллскрин -> лочим ориентацию -> несколько раз пересчитываем масштаб,
  // т.к. поворот/ресайз приходят с задержкой
  setTimeout(() => {
    lockLandscape()
    refreshScale(scale)
  }, 80)
  setTimeout(() => refreshScale(scale), 350)
  setTimeout(() => refreshScale(scale), 900)
}

// Один раз на игру: пересчитывать ввод при смене ориентации/выходе из фуллскрина,
// чтобы кнопки не «промахивались» после поворота телефона.
let globalHooked = false
export function installInputResizeFix(scene: Phaser.Scene) {
  if (globalHooked) return
  globalHooked = true
  const scale = scene.scale
  const refresh = () => refreshScale(scale)
  try {
    window.addEventListener("orientationchange", () => setTimeout(refresh, 250))
    scale.on(Phaser.Scale.Events.ENTER_FULLSCREEN, () => setTimeout(refresh, 150))
    scale.on(Phaser.Scale.Events.LEAVE_FULLSCREEN, () => setTimeout(refresh, 150))
  } catch {
    // ignore
  }
}
