import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { HomePage } from './routes/HomePage'
import { RepositoryPage } from './routes/RepositoryPage'
import { Header } from './components/layout/Header'
import { Footer } from './components/layout/Footer'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/:repoId" element={<RepositoryPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  )
}

export default App
