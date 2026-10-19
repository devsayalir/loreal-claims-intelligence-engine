import { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router'
import { api } from '../api/client.js'
import { ROLES } from '../constants.js'
import { useRole } from '../context/roleContext.js'

export default function Layout() {
  const { role, setRole } = useRole()
  const [health, setHealth] = useState(null)

  useEffect(() => {
    api
      .health()
      .then(setHealth)
      .catch(() => setHealth({ status: 'down' }))
  }, [])

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <span className="brand-name">L'ORÉAL</span>
            <span className="brand-product">Claims Intelligence Engine</span>
          </div>

          <nav className="nav">
            <NavLink to="/" end>
              Claims
            </NavLink>
            <NavLink to="/quick-assess">Quick assess</NavLink>
          </nav>

          <label className="role-picker">
            Acting as
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      {health?.llmProvider === 'mock' && (
        <div className="notice">
          No OpenAI key configured. Assessments use the offline rule-based
          reviewer.
        </div>
      )}
      {health?.status === 'down' && (
        <div className="notice notice-error">
          The API is not reachable. Start the backend on port 3000.
        </div>
      )}

      <main className="container">
        <Outlet />
      </main>
    </>
  )
}
