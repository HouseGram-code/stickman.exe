import Phaser from "phaser"

// Утилиты «погружения»: автоматический полноэкранный режим и поворот
// телефона в альбомную ориентацию. Всё это можно вызывать только из
// обработчика пользовательского жеста (тап/клик) — иначе браузер запретит.

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

// Зафиксировать альбомную ориентацию (работает в фуллскрине на Android;
// на iOS API нет — там подсказка «поверни телефон» из index.html).
function lockLandscape() {
  try {
    const orientation: any = (screen as any).orientation
    if (orientation && typeof orientation.lock === "function") {
      orientation.lock("landscape").catch(() => {})
    }
  } catch {
    // не поддерживается — игнорируем
  }
}

// Войти в полноэкранный режим и повернуть в альбомную ориентацию.
export function enterImmersive(scene: Phaser.Scene) {
  try {
    if (scene.scale && !scene.scale.isFullscreen) {
      scene.scale.startFullscreen()
    }
  } catch {
    // фуллскрин недоступен — продолжаем без него
  }
  // даём браузеру войти в фуллскрин, затем фиксируем ориентацию
  setTimeout(lockLandscape, 60)
}

// Однократно повесить авто-погружение на первый тап (только на телефонах,
// чтобы на ПК не уводить в фуллскрин неожиданно).
let hooked = false
export function autoImmersiveOnFirstGesture(scene: Phaser.Scene) {
  if (hooked || !isTouchDevice()) return
  hooked = true
  scene.input.once(Phaser.Input.Events.POINTER_DOWN, () => enterImmersive(scene))
}
