import { Link } from 'react-router-dom'

export function Header() {
  const title = import.meta.env.VITE_APP_TITLE || '릴리즈 트래커'
  return (
    <header className="w-full border-b bg-white">
      <div className="mx-auto max-w-5xl px-4 py-4 flex items-center">
        <h1 className="text-2xl font-bold text-gray-800">
          <Link to="/" className="hover:text-orange-500 transition-colors">{title}</Link>
        </h1>
      </div>
    </header>
  )
} 