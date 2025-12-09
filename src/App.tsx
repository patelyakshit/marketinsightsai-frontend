import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/shared/hooks/useApi'
import { AppLayout } from '@/app/layout/AppLayout'
import { AiChatPage } from '@/app/routes/AiChat/AiChatPage'
import { KnowledgeBasePage } from '@/app/routes/KnowledgeBase/KnowledgeBasePage'
import { LibraryPage } from '@/app/routes/Library/LibraryPage'
import { LoginPage } from '@/app/routes/Auth/LoginPage'
import { RegisterPage } from '@/app/routes/Auth/RegisterPage'
import { LibraryProvider } from '@/shared/contexts/LibraryContext'
import { AuthProvider } from '@/shared/contexts/AuthContext'
import { FoldersProvider } from '@/shared/contexts/FoldersContext'
import { ProtectedRoute } from '@/shared/components/ProtectedRoute'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <FoldersProvider>
          <LibraryProvider>
            <BrowserRouter>
              <Routes>
                {/* Auth routes (separate from main layout) */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Main app routes - AppLayout handles auth display internally */}
                <Route element={<AppLayout />}>
                  {/* Main chat is public - shows landing with sign in/up for unauthenticated */}
                  <Route path="/" element={<AiChatPage />} />

                  {/* Protected routes - require authentication */}
                  <Route
                    path="/library"
                    element={
                      <ProtectedRoute>
                        <LibraryPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/knowledge-base"
                    element={
                      <ProtectedRoute>
                        <KnowledgeBasePage />
                      </ProtectedRoute>
                    }
                  />
                </Route>
              </Routes>
            </BrowserRouter>
          </LibraryProvider>
        </FoldersProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
