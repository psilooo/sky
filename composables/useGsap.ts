import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function refreshAfterMount() {
  nextTick(() => ScrollTrigger.refresh())
}

export function useScrollReveal(el: Ref<HTMLElement | null>, options?: gsap.TweenVars) {
  let tween: gsap.core.Tween | undefined
  onMounted(() => {
    if (!el.value) return
    if (prefersReducedMotion()) {
      gsap.set(el.value, { clearProps: 'all' })
      return
    }
    gsap.set(el.value, { clearProps: 'all' })
    tween = gsap.from(el.value, {
      y: 60,
      opacity: 0,
      duration: 1,
      ease: 'power3.out',
      scrollTrigger: { trigger: el.value, start: 'top 85%', toggleActions: 'play none none none' },
      ...options,
    })
    refreshAfterMount()
  })
  onUnmounted(() => {
    tween?.scrollTrigger?.kill()
    tween?.kill()
  })
}

export function useStaggerReveal(container: Ref<HTMLElement | null>, childSelector: string, options?: gsap.TweenVars) {
  let tween: gsap.core.Tween | undefined
  onMounted(() => {
    if (!container.value) return
    const children = container.value.querySelectorAll(childSelector)
    if (prefersReducedMotion()) {
      gsap.set(children, { clearProps: 'all' })
      return
    }
    gsap.set(children, { clearProps: 'all' })
    tween = gsap.from(children, {
      y: 60,
      opacity: 0,
      duration: 0.8,
      stagger: 0.15,
      ease: 'power3.out',
      scrollTrigger: { trigger: container.value, start: 'top 85%', toggleActions: 'play none none none' },
      ...options,
    })
    refreshAfterMount()
  })
  onUnmounted(() => {
    tween?.scrollTrigger?.kill()
    tween?.kill()
  })
}

export function useTextReveal(el: Ref<HTMLElement | null>) {
  let tween: gsap.core.Tween | undefined
  onMounted(() => {
    if (!el.value) return
    if (prefersReducedMotion()) {
      gsap.set(el.value, { clearProps: 'all' })
      return
    }
    gsap.set(el.value, { clearProps: 'all' })
    tween = gsap.from(el.value, {
      clipPath: 'inset(0 100% 0 0)',
      duration: 1.2,
      ease: 'power4.inOut',
      scrollTrigger: { trigger: el.value, start: 'top 85%', toggleActions: 'play none none none' },
    })
    refreshAfterMount()
  })
  onUnmounted(() => {
    tween?.scrollTrigger?.kill()
    tween?.kill()
  })
}
