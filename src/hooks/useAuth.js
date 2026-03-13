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
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single()
            setProfile(data)
            setLoading(false)
    }
    
    async function signIn(email, password) {
        const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })
    return { error }

    }
     async function signUp(email, password, fullName) {
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { full_name: fullName },
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
