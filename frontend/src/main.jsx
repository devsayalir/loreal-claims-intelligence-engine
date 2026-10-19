import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router'
import Layout from './components/Layout.jsx'
import { RoleProvider } from './context/RoleContext.jsx'
import ClaimDetailPage from './pages/ClaimDetailPage.jsx'
import ClaimsListPage from './pages/ClaimsListPage.jsx'
import QuickAssessPage from './pages/QuickAssessPage.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RoleProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<ClaimsListPage />} />
            <Route path="claims/:id" element={<ClaimDetailPage />} />
            <Route path="quick-assess" element={<QuickAssessPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </RoleProvider>
  </StrictMode>,
)
