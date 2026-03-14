import { createContext, useContext, useEffect, useState } from 'react'
import { isSupabaseConfigured, supabase, supabaseConfigError } from '@/lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
    })

    return () => subscription.unsubscribe()
  }, [])

  const value = {
    session,
    loading,
    signIn: (email, password) =>
      isSupabaseConfigured
        ? supabase.auth.signInWithPassword({ email, password })
        : Promise.resolve({ data: { user: null, session: null }, error: new Error(supabaseConfigError) }),
    signOut: () =>
      isSupabaseConfigured
        ? supabase.auth.signOut()
        : Promise.resolve({ error: new Error(supabaseConfigError) }),
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
