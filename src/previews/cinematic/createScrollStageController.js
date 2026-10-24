import { gsap } from 'gsap'
import { stageTimeForPhase } from './scrollStageSequence'

// Preview-only native-scroll adapter. ScrollTrigger remains the ONLY owner of
// the scene timeline. This controller animates one scroll coordinate, not any
// scene property, camera, CSS sculpture transform, or renderer resource.
export function createScrollStageController({ hero, stages, getPhase, readScroll, writeScroll, getBounds, isReady, resolveHash,
  nativeRanges = [], isSettling = () => false }) {
  // Trackpads emit small pixel deltas plus a momentum tail. Mouse wheels emit
  // discrete line/page notches, so a single normalized notch should advance.
  const QUIET_MS = 110
  const WHEEL_THRESHOLD = 1.5
  const TOUCH_THRESHOLD = 10
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
  // index.css enables browser smooth scrolling. It would otherwise start a
  // second animation for every GSAP scroll write. Own this one property only
  // for the lifetime of the preview and restore its exact inline value.
  const rootStyle = document.documentElement.style
  const previousBehavior = rootStyle.getPropertyValue('scroll-behavior')
  const previousPriority = rootStyle.getPropertyPriority('scroll-behavior')
  rootStyle.setProperty('scroll-behavior', 'auto')
  const duration = stages[stages.length - 1].time
  const announcedStages = nativeRanges.length ? stages.filter(stage => !stage.native && stage.duration > 0) : stages
  let tween = null
  let lastWheel = -Infinity
  let wheelUsed = false
  let wheelDelta = 0
  let wheelNative = null
  let wheelRange = null
  let wheelDirection = 0
  let lastWheelPixels = 0
  let wheelWasDecaying = false
  let wheelDiscrete = false
  let nativeCoast = null
  let touch = null
  let historyFrame = 0
  let disposed = false
  let pending = null
  let pendingAnnouncement = null
  const heldKeys = new Set()
  const live = document.createElement('div')
  live.setAttribute('role', 'status')
  live.setAttribute('aria-live', 'polite')
  live.setAttribute('aria-atomic', 'true')
  live.style.cssText = 'position:fixed;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap;pointer-events:none;'
  // Keep this controller-owned node outside React's managed/pinned <main>.
  // ScrollTrigger reparents that main into its pin spacer; a foreign child
  // there can confuse React reconciliation when the preview is removed.
  document.body.appendChild(live)

  const enabled = () => !disposed && !motion.matches && isReady()
  const resetWheelGesture = () => {
    wheelUsed = false
    wheelDelta = 0
    wheelNative = null
    wheelRange = null
    wheelDirection = 0
    lastWheelPixels = 0
    wheelWasDecaying = false
    wheelDiscrete = false
  }
  const recordWheelSample = (direction, pixels) => {
    const magnitude = Math.abs(pixels)
    if (wheelDirection === direction && Math.abs(lastWheelPixels) > 0 && magnitude < Math.abs(lastWheelPixels) * 0.85) {
      wheelWasDecaying = true
    }
    wheelDirection = direction
    lastWheelPixels = pixels
  }
  const cancel = () => {
    tween?.kill()
    tween = null
    nativeCoast = null
    pendingAnnouncement = null
  }
  const announce = stage => {
    hero.dataset.scrollStage = stage.id
    const index = announcedStages.indexOf(stage)
    live.textContent = index >= 0 ? `${stage.label}. Stage ${index + 1} of ${announcedStages.length}.` : stage.label
  }
  const stageAt = phase => [...stages].reverse().find(stage => stage.phase <= phase + 0.00001) ?? stages[0]
  const scrollFor = phase => {
    const bounds = getBounds()
    return bounds.start + (bounds.end - bounds.start) * stageTimeForPhase(stages, phase) / duration
  }
  const move = (phase, seconds, hash) => {
    if (!enabled()) { pending = { phase, seconds, hash }; return }
    pending = null
    nativeCoast = null
    cancel()
    if (hash && window.location.hash !== `#${hash}`) {
      const url = new URL(window.location.href)
      url.hash = hash
      window.history.pushState(window.history.state, '', url)
    }
    const position = { y: readScroll() }
    tween = gsap.to(position, {
      y: scrollFor(phase), duration: seconds, ease: 'power1.inOut',
      onUpdate: () => writeScroll(position.y),
      onComplete: () => {
        tween = null
        if (isSettling()) pendingAnnouncement = stageAt(phase)
        else announce(stageAt(phase))
      },
    })
  }
  const next = direction => {
    // Browsers round native scroll positions to CSS pixels. Compare physical
    // positions with a 1.5px tolerance so rounding cannot demand a second
    // gesture to finish the same checkpoint.
    const position = readScroll()
    return direction > 0 ? stages.find(stage => scrollFor(stage.phase) > position + 1.5)
      : [...stages].reverse().find(stage => scrollFor(stage.phase) < position - 1.5)
  }
  const nativeRange = direction => {
    const y = readScroll()
    const phase = getPhase()
    for (const range of nativeRanges) {
      // Do not let a new native gesture interrupt the incoming stage while
      // ScrollTrigger is still finishing its authored scrub interpolation.
      if (isSettling() && (phase < range.start - 0.00001 || phase > range.end + 0.00001)) continue
      const start = scrollFor(range.start), end = scrollFor(range.end)
      if (direction > 0 ? y >= start - 1.5 && y < end - 1.5 : y > start + 1.5 && y <= end + 1.5) return { start, end }
    }
    return null
  }
  const constrainNative = (range, intended, event) => {
    if (intended > range.start && intended < range.end) return false
    if (event.cancelable) event.preventDefault()
    writeScroll(Math.max(range.start, Math.min(range.end, intended)))
    return true
  }
  const nativeScroll = () => {
    // Native touch inertia has no touchmove events after touchend. Clamp only
    // that gesture's reserved interval, so it cannot coast into Contact.
    if (!nativeCoast || tween || !enabled()) return
    const y = readScroll()
    if (y < nativeCoast.start - 1 || y > nativeCoast.end + 1) {
      writeScroll(Math.max(nativeCoast.start, Math.min(nativeCoast.end, y)))
    }
  }
  const canHandle = direction => {
    const bounds = getBounds()
    const scroll = readScroll()
    if (scroll < bounds.start - 2 || scroll > bounds.end + 2) return false
    return Boolean(next(direction))
  }
  const step = direction => {
    if (!enabled() || tween || isSettling()) return
    const target = next(direction)
    if (!target) return
    // Reverse a segment with the same response duration as its forward pass.
    const seconds = direction > 0
      ? (target.playbackDuration ?? target.duration)
      : (stages[stages.indexOf(target) + 1].playbackDuration ?? stages[stages.indexOf(target) + 1].duration)
    move(target.phase, seconds)
  }
  const nestedScroll = (target, direction) => {
    for (let element = target instanceof Element ? target : null; element && element !== hero && element !== document.body; element = element.parentElement) {
      if (element.matches('[data-scroll-stage-native]')) return true
      if (element.scrollHeight <= element.clientHeight + 1) continue
      if (!/(auto|scroll)/.test(getComputedStyle(element).overflowY)) continue
      if (direction > 0 ? element.scrollTop + element.clientHeight < element.scrollHeight - 1 : element.scrollTop > 1) return true
    }
    return false
  }
  const wheel = event => {
    if (event.defaultPrevented || event.ctrlKey || event.metaKey || Math.abs(event.deltaX) > Math.abs(event.deltaY) || !event.deltaY) return
    const now = performance.now()
    const direction = Math.sign(event.deltaY)
    const pixels = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1)
    const magnitude = Math.abs(pixels)
    const discreteWheel = event.deltaMode !== 0
    // Loader-owned input must not extend or poison a preview gesture latch.
    if (!enabled()) return
    const quiet = now - lastWheel
    const reversed = wheelUsed && wheelDirection && direction !== wheelDirection && magnitude >= 4
    // A fresh same-direction trackpad flick commonly starts with a larger
    // delta than the decaying momentum tail. Treat that clear impulse as a
    // new gesture even if it arrives before the quiet boundary.
    const newImpulse = !discreteWheel && wheelUsed && wheelWasDecaying && quiet >= 32
      && magnitude >= 4 && magnitude >= Math.max(WHEEL_THRESHOLD, Math.abs(lastWheelPixels) * 1.5)
    if (quiet > QUIET_MS || reversed || newImpulse) {
      resetWheelGesture()
      nativeCoast = null
    }
    lastWheel = now
    // Decide native nested-scroll ownership once per gesture, not on every
    // momentum event while the scene is writing layout/transform properties.
    wheelNative ??= nestedScroll(event.target, direction)
    if (wheelNative) return
    if (!tween && !wheelUsed) wheelRange ??= nativeRange(direction)
    if (wheelRange && !wheelUsed) {
      nativeCoast = wheelRange
      if (constrainNative(wheelRange, readScroll() + pixels, event)) wheelUsed = true
      return
    }
    wheelDiscrete ||= discreteWheel
    // Track samples even while GSAP/ScrollTrigger owns movement. This lets a
    // new trackpad impulse be distinguished from the tail of the used gesture.
    recordWheelSample(direction, pixels)
    // Consume remaining momentum even at an endpoint, so the tail of a
    // gesture cannot continue scrolling after its stage animation completes.
    if (!tween && !wheelUsed && !canHandle(direction)) return
    if (!event.cancelable) { wheelUsed = true; return }
    event.preventDefault()
    if (tween || isSettling()) { wheelUsed = true; return }
    if (wheelUsed) return
    if (Math.sign(wheelDelta) !== direction) wheelDelta = 0
    wheelDelta += pixels
    if (Math.abs(wheelDelta) >= WHEEL_THRESHOLD) { wheelUsed = true; step(direction) }
  }
  const touchStart = event => {
    nativeCoast = null
    if (event.touches.length !== 1 || !enabled()) { touch = null; return }
    const point = event.touches[0]
    touch = { id: point.identifier, x: point.clientX, y: point.clientY, lastY: point.clientY,
      target: event.target, used: Boolean(tween), native: null, range: null }
  }
  const touchMove = event => {
    if (!touch || event.touches.length !== 1 || !enabled()) return
    const point = Array.from(event.touches).find(item => item.identifier === touch.id)
    if (!point || touch.native) return
    const dx = point.clientX - touch.x
    const dy = touch.y - point.clientY
    if (Math.abs(dx) > Math.abs(dy) || Math.abs(dy) < 2) return
    const direction = Math.sign(dy)
    touch.native ??= nestedScroll(touch.target, direction)
    if (touch.native) return
    const delta = touch.lastY - point.clientY
    touch.lastY = point.clientY
    if (!tween && !touch.used) touch.range ??= nativeRange(direction)
    if (touch.range && !touch.used) {
      nativeCoast = touch.range
      if (constrainNative(touch.range, readScroll() + delta, event)) touch.used = true
      return
    }
    if (!tween && !touch.used && !canHandle(direction)) return
    if (!event.cancelable) { cancel(); touch.native = true; return }
    event.preventDefault()
    if (tween || isSettling()) { touch.used = true; return }
    if (!touch.used && Math.abs(dy) >= TOUCH_THRESHOLD) { touch.used = true; step(direction) }
  }
  const touchEnd = () => { touch = null }
  const keyDown = event => {
    if (!enabled() || event.ctrlKey || event.metaKey || event.altKey) return
    const target = event.target instanceof Element ? event.target : null
    if (target?.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="slider"], [role="textbox"]')) return
    if (event.key === ' ' && target?.closest('button, a, [role="button"]')) return
    const direction = ['ArrowDown', 'PageDown'].includes(event.key) || (event.key === ' ' && !event.shiftKey) ? 1
      : ['ArrowUp', 'PageUp'].includes(event.key) || (event.key === ' ' && event.shiftKey) ? -1 : 0
    if (!direction && !['Home', 'End', 'Escape'].includes(event.key)) return
    if (event.key === 'Escape') { cancel(); return }
    if (direction && nestedScroll(event.target, direction)) return
    nativeCoast = null
    const range = !tween && direction ? nativeRange(direction) : null
    if (range) {
      nativeCoast = range
      heldKeys.add(event.code)
      return // Original browser keyboard scrolling inside Always Curious.
    }
    if (!tween && direction && !canHandle(direction)) return
    event.preventDefault()
    if (event.repeat || heldKeys.has(event.code)) return
    heldKeys.add(event.code)
    if (tween || isSettling()) return
    if (event.key === 'Home') move(stages[0].phase, 1.2)
    else if (event.key === 'End') move(stages[stages.length - 1].phase, 1.2)
    else step(direction)
  }
  const keyUp = event => heldKeys.delete(event.code)
  const resetInput = () => { heldKeys.clear(); touch = null; wheelUsed = true; wheelDelta = 0 }
  const pause = () => { cancel(); resetInput() }
  const historyChange = () => {
    cancelAnimationFrame(historyFrame)
    historyFrame = requestAnimationFrame(() => {
      const hash = window.location.hash.slice(1)
      const phase = hash ? resolveHash(hash) : stages[0].phase
      if (typeof phase === 'number') move(phase, 1.2)
    })
  }
  const loaderComplete = () => {
    if (pending) { const request = pending; move(request.phase, request.seconds, request.hash) }
    else if (window.location.hash) historyChange()
    else announce(stageAt(getPhase()))
  }
  const pointerDown = event => {
    // A scrollbar drag is ordinary native navigation and takes precedence.
    if (event.target === document.documentElement && event.clientX >= document.documentElement.clientWidth) {
      nativeCoast = null
      cancel()
    }
  }
  window.addEventListener('wheel', wheel, { passive: false })
  window.addEventListener('touchstart', touchStart, { passive: true })
  window.addEventListener('touchmove', touchMove, { passive: false })
  window.addEventListener('touchend', touchEnd)
  window.addEventListener('touchcancel', touchEnd)
  window.addEventListener('keydown', keyDown)
  window.addEventListener('keyup', keyUp)
  window.addEventListener('blur', pause)
  window.addEventListener('pointerdown', pointerDown)
  if (nativeRanges.length) window.addEventListener('scroll', nativeScroll, { passive: true })
  window.addEventListener('popstate', historyChange)
  window.addEventListener('hashchange', historyChange)
  motion.addEventListener('change', pause)
  hero.addEventListener('sculpture-loader-complete', loaderComplete, true)
  if (enabled() && window.location.hash) historyChange()

  return {
    cancel,
    settled: () => {
      // A discrete mouse-wheel notch is already a complete gesture. For a
      // trackpad, clear the latch as soon as the stage settles if its momentum
      // has also gone quiet; otherwise the next wheel event applies the same
      // inactivity/impulse test before it can advance another stage.
      if (wheelUsed && (wheelDiscrete || performance.now() - lastWheel > QUIET_MS)) resetWheelGesture()
      if (!tween && pendingAnnouncement) {
        announce(pendingAnnouncement)
        pendingAnnouncement = null
      }
    },
    goToPhase: (phase, hash) => move(phase, 1.2, hash),
    goToMilestone: value => {
      const stage = stages.find(item => item.milestone === value)
      if (stage) move(stage.phase, 1, stage.id)
    },
    dispose: () => {
      disposed = true
      cancel()
      cancelAnimationFrame(historyFrame)
      window.removeEventListener('wheel', wheel)
      window.removeEventListener('touchstart', touchStart)
      window.removeEventListener('touchmove', touchMove)
      window.removeEventListener('touchend', touchEnd)
      window.removeEventListener('touchcancel', touchEnd)
      window.removeEventListener('keydown', keyDown)
      window.removeEventListener('keyup', keyUp)
      window.removeEventListener('blur', pause)
      window.removeEventListener('pointerdown', pointerDown)
      if (nativeRanges.length) window.removeEventListener('scroll', nativeScroll)
      window.removeEventListener('popstate', historyChange)
      window.removeEventListener('hashchange', historyChange)
      motion.removeEventListener('change', pause)
      hero.removeEventListener('sculpture-loader-complete', loaderComplete, true)
      if (previousBehavior) rootStyle.setProperty('scroll-behavior', previousBehavior, previousPriority)
      else rootStyle.removeProperty('scroll-behavior')
      delete hero.dataset.scrollStage
      live.remove()
    },
  }
}
