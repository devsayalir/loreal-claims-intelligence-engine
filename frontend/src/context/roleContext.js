import { createContext, useContext } from 'react'

export const RoleContext = createContext(null)

export function useRole() {
  return useContext(RoleContext)
}
