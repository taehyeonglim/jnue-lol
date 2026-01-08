import { Routes, Route } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Layout from './components/layout/Layout'
import ProtectedRoute from './components/common/ProtectedRoute'
import LoadingSpinner from './components/common/LoadingSpinner'

// Pages
import Home from './pages/Home'
import Introduction from './pages/Introduction'
import FreeBoard from './pages/FreeBoard'
import GamesBoard from './pages/GamesBoard'
import PostDetail from './pages/PostDetail'
import WritePost from './pages/WritePost'
import EditPost from './pages/EditPost'
import Ranking from './pages/Ranking'
import MyPage from './pages/MyPage'
import Messages from './pages/Messages'
import Admin from './pages/Admin'

export default function App() {
  const { loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-hero-pattern">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="introduction" element={<Introduction />} />
        <Route path="free" element={<FreeBoard />} />
        <Route path="games" element={<GamesBoard />} />
        <Route path="post/:id" element={<PostDetail />} />
        <Route path="ranking" element={<Ranking />} />

        {/* Protected Routes */}
        <Route
          path="write"
          element={
            <ProtectedRoute>
              <WritePost />
            </ProtectedRoute>
          }
        />
        <Route
          path="edit/:id"
          element={
            <ProtectedRoute>
              <EditPost />
            </ProtectedRoute>
          }
        />
        <Route
          path="mypage"
          element={
            <ProtectedRoute>
              <MyPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="messages"
          element={
            <ProtectedRoute>
              <Messages />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin"
          element={
            <ProtectedRoute requireAdmin>
              <Admin />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  )
}
