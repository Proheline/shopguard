import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) fetchProfile(session.user.id)
        else {
          setProfile(null)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    // Check if account is deactivated
    //if (data && !data.is_active) {
      //await supabase.auth.signOut()
      //setUser(null)
      //setProfile(null)
      //setLoading(false)
      //return
    //}

    setProfile(data)
    setLoading(false)
  }

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (!error && data?.user) {
      // Check if account is active
      const { data: prof } = await supabase
        .from('profiles')
        .select('is_active')
        .eq('id', data.user.id)
        .single()

      if (prof && !prof.is_active) {
        await supabase.auth.signOut()
        return { error: { message: 'Your account has been deactivated. Contact your shop admin.' } }
      }
    }

    return { error }
  }

  async function signUp(email, password, fullName, inviteCode) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          invite_code: inviteCode || null,
        },
      },
    })
    return { error }
  }

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  return { user, profile, loading, signIn, signUp, signOut }
}