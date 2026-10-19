import { useEffect, useState } from 'react'
import { RoleContext } from './roleContext.js'

const STORAGE_KEY = 'claims.role'

export function RoleProvider({ children }) {
  const [role, setRole] = useState(
    () => localStorage.getItem(STORAGE_KEY) || 'BUSINESS',
  )

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, role)
  }, [role])

  return (
    <RoleContext.Provider value={{ role, setRole }}>
      {children}
    </RoleContext.Provider>
  )
}
