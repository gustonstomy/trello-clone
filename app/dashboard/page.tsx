/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '../../lib/supabase/client'
import { useAuth } from '../../hooks/use-auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Loader2, Users, FolderKanban } from 'lucide-react'
import { OrganizationWithRole } from '../../types'

export default function DashboardPage() {
  const { user } = useAuth()
  const [organizations, setOrganizations] = useState<OrganizationWithRole[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchOrganizations = async () => {
      if (!user) return

      try {
        const { data, error } = await supabase
          .from('organization_members')
          .select(`
            role,
            organizations (
              id,
              name,
              slug,
              description,
              created_at,
              updated_at,
              created_by
            )
          `)
          .eq('user_id', user.id)

        if (error) throw error

        const orgsWithRole = data.map((item: any) => ({
          ...item.organizations,
          role: item.role,
        }))

        // Get member counts
        const orgsWithCounts = await Promise.all(
          orgsWithRole.map(async (org: any) => {
            const { count } = await supabase
              .from('organization_members')
              .select('*', { count: 'exact', head: true })
              .eq('organization_id', org.id)

            return { ...org, member_count: count || 0 }
          })
        )

        setOrganizations(orgsWithCounts)
      } catch (error) {
        console.error('Error fetching organizations:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrganizations()
  }, [user, supabase])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Your Organizations</h1>
        <p className="text-gray-600 mt-2">
          Manage your organizations and access their boards
        </p>
      </div>

      {organizations.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderKanban className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No organizations yet</h3>
            <p className="text-gray-600 text-center mb-6 max-w-md">
              Create your first organization to start collaborating with your team
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {organizations.map((org) => (
            <Link key={org.id} href={`/dashboard/org/${org.slug}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">{org.name}</CardTitle>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      {org.role}
                    </span>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {org.description || 'No description'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="h-4 w-4 mr-2" />
                    {org.member_count} {org.member_count === 1 ? 'member' : 'members'}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}