import { Github } from 'lucide-react'

export function Footer() {
  const title = import.meta.env.VITE_APP_TITLE || '릴리즈 트래커'
  return (
    <footer className="w-full border-t bg-white mt-8">
      <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-center text-gray-500 text-sm">
        <span className="mr-2">©</span>
        <span>{title}</span>
      </div>
    </footer>
  )
} 