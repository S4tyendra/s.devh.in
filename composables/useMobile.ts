import { ref, onMounted, onUnmounted } from 'vue'

export function useMobile(breakpoint = 768) {
  const isMobile = ref(false)

  const checkIfMobile = () => {
    if (typeof window !== 'undefined') {
      isMobile.value = window.innerWidth < breakpoint
    }
  }

  onMounted(() => {
    checkIfMobile()
    window.addEventListener('resize', checkIfMobile)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', checkIfMobile)
  })

  return isMobile
}
