import { useRef } from "react"
import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()
  const shownRef = useRef<Map<string, number>>(new Map())
  const DEDUPE_MS = 5000

  return (
    <ToastProvider>
      {toasts
        .filter(({ title, description }) => {
          const text = `${title ?? ''} ${description ?? ''}`.toLowerCase();
          // Фильтруем уведомления о синхронизации NFT, чтобы не показывать игроку
          return !/nft|синхрон|синхронизац/.test(text);
        })
        .filter(({ title, description }) => {
          // Убираем повторяющиеся ошибки в течение короткого времени
          const key = `${title ?? ''}|${description ?? ''}`
          const now = Date.now()
          const last = shownRef.current.get(key) ?? 0
          if (now - last < DEDUPE_MS) return false
          shownRef.current.set(key, now)
          return true
        })
        .map(function ({ id, title, description, action, ...props }) {
          return (
            <Toast key={id} {...props}>
              <div className="grid gap-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
              {action}
              <ToastClose />
            </Toast>
          )
        })}
      <ToastViewport />
    </ToastProvider>
  )
}
