import { ToasterToast } from './types'

export const TOAST_LIMIT = 1
export const TOAST_REMOVE_DELAY = 1000 // 1 second

export const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

export const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    })
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}

let count = 0

export function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

export const listeners: Array<(state: { toasts: ToasterToast[] }) => void> = []

export let memoryState: { toasts: ToasterToast[] } = { toasts: [] }

export function dispatch(action: any) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

import { reducer } from './reducer'