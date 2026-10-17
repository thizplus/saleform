import liff from '@line/liff'
import { LIFF_ID } from '@/constants/liff'

let liffInitialized = false

export async function initLiff(): Promise<boolean> {
  if (liffInitialized) return true

  try {
    await liff.init({ liffId: LIFF_ID })
    liffInitialized = true
    return true
  } catch (err) {
    console.error('LIFF init failed:', err)
    return false
  }
}

export function isInLiff(): boolean {
  return liff.isInClient()
}

export function isLoggedIn(): boolean {
  return liff.isLoggedIn()
}

export function liffLogin(): void {
  liff.login()
}

export async function getIDToken(): Promise<string | null> {
  return liff.getIDToken()
}

export function getLiffContext() {
  return liff.getContext()
}

export async function sendFlexToChat(flexMessage: unknown): Promise<boolean> {
  try {
    const context = liff.getContext()
    // sendMessages only works when opened from a chat
    if (!context || (context.type !== 'group' && context.type !== 'room' && context.type !== 'utou')) {
      console.warn('Not in a chat context, cannot send messages')
      return false
    }

    await liff.sendMessages([flexMessage as never])
    return true
  } catch (err) {
    console.error('sendMessages failed:', err)
    return false
  }
}

/** ส่งหลาย messages เข้ากลุ่ม — แบ่งเป็นชุด 5 อัตโนมัติ */
export async function sendChatMessages(messages: unknown[]): Promise<boolean> {
  try {
    const context = liff.getContext()
    if (!context || (context.type !== 'group' && context.type !== 'room' && context.type !== 'utou')) {
      console.warn('Not in a chat context, cannot send messages')
      return false
    }

    // LINE LIFF sendMessages รองรับสูงสุด 5 messages ต่อครั้ง — ส่งหลาย batch
    for (let i = 0; i < messages.length; i += 5) {
      const batch = messages.slice(i, i + 5)
      await liff.sendMessages(batch as never[])
    }
    return true
  } catch (err) {
    console.error('sendMessages failed:', err)
    return false
  }
}

export function closeLiff(): void {
  if (liff.isInClient()) {
    liff.closeWindow()
  }
}
