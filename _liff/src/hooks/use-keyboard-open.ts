import { useEffect, useState } from 'react'

/**
 * true เมื่อแป้นพิมพ์บนมือถือเปิดอยู่ (มี input/textarea ถูกโฟกัส)
 * ใช้ซ่อนปุ่มที่ fixed ล่างจอ ไม่ให้กินพื้นที่ตอนพิมพ์
 */
export function useKeyboardOpen(): boolean {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const isTypingTarget = (el: EventTarget | null) => {
      if (!(el instanceof HTMLElement)) return false
      if (el instanceof HTMLTextAreaElement) return true
      if (el instanceof HTMLInputElement) {
        return !['checkbox', 'radio', 'button', 'submit', 'file', 'range', 'color'].includes(el.type)
      }
      return el.isContentEditable
    }
    const onIn = (e: FocusEvent) => { if (isTypingTarget(e.target)) setOpen(true) }
    // หน่วงเล็กน้อย กันกระพริบตอนย้ายโฟกัสจากช่องหนึ่งไปอีกช่อง
    let t: ReturnType<typeof setTimeout> | undefined
    const onOut = () => {
      clearTimeout(t)
      t = setTimeout(() => setOpen(isTypingTarget(document.activeElement)), 120)
    }
    document.addEventListener('focusin', onIn)
    document.addEventListener('focusout', onOut)
    return () => {
      clearTimeout(t)
      document.removeEventListener('focusin', onIn)
      document.removeEventListener('focusout', onOut)
    }
  }, [])

  return open
}
