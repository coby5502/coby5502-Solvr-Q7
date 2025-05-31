import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// 앱 타이틀을 환경변수로 설정
if (import.meta.env.VITE_APP_TITLE) {
  document.title = import.meta.env.VITE_APP_TITLE
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
