'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Organization } from '@/types'

type OrganizationContextType = {
    organization: Organization | null
    role: 'owner' | 'admin' | 'member' | null
    isLoading: boolean
}

const OrganizationContext = createContext<OrganizationContextType>({
    organization: null,
    role: null,
    isLoading: true,
})

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
    const [organization, setOrganization] = useState<Organization | null>(null)
    const [role, setRole] = useState<'owner' | 'admin' | 'member' | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        async function loadOrganization() {
            try {
                const { data: { user } } = await supabase.auth.getUser()

                if (!user) {
                    setIsLoading(false)
                    return
                }

                // Fetch user's organizations
                const { data: memberData, error: memberError } = await supabase
                    .from('organization_members')
                    .select('role, organizations(*)')
                    .eq('user_id', user.id)
                    .limit(1)
                    .single()

                if (memberError) {
                    console.error('Error fetching organization:', memberError)
                } else if (memberData && memberData.organizations) {
                    // Assertions because the join returns potentially an array or single object depending on how PostgREST infers it
                    // Based on our schema, single() guarantees one row but `organizations` inside it might need to be casted
                    setOrganization(memberData.organizations as unknown as Organization)
                    setRole(memberData.role as 'owner' | 'admin' | 'member')
                }
            } catch (error) {
                console.error('Unexpected error loading organization:', error)
            } finally {
                setIsLoading(false)
            }
        }

        loadOrganization()
    }, [supabase])

    return (
        <OrganizationContext.Provider value={{ organization, role, isLoading }}>
            {children}
        </OrganizationContext.Provider>
    )
}

export function useOrganization() {
    const context = useContext(OrganizationContext)
    if (context === undefined) {
        throw new Error('useOrganization deve ser usado dentro de um OrganizationProvider')
    }
    return context
}
