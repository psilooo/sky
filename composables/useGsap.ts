import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export function useScrollReveal(el: Ref<HTMLElement | null>, options?: gsap.TweenVars) {
  onMounted(() => {
    if (!el.value) return
    gsap.from(el.value, {
      y: 60,
      opacity: 0,
      duration: 1,
      ease: 'power3.out',
      scrollTrigger: { trigger: el.value, start: 'top 85%', toggleActions: 'play none none none' },
      ...options,
    })
  })
}

export function useStaggerReveal(container: Ref<HTMLElement | null>, childSelector: string, options?: gsap.TweenVars) {
  onMounted(() => {
    if (!container.value) return
    const children = container.value.querySelectorAll(childSelector)
    gsap.from(children, {
      y: 60,
      opacity: 0,
      duration: 0.8,
      stagger: 0.15,
      ease: 'power3.out',
      scrollTrigger: { trigger: container.value, start: 'top 85%', toggleActions: 'play none none none' },
      ...options,
    })
  })
}

export function useTextReveal(el: Ref<HTMLElement | null>) {
  onMounted(() => {
    if (!el.value) return
    gsap.from(el.value, {
      clipPath: 'inset(0 100% 0 0)',
      duration: 1.2,
      ease: 'power4.inOut',
      scrollTrigger: { trigger: el.value, start: 'top 85%', toggleActions: 'play none none none' },
    })
  })
}
