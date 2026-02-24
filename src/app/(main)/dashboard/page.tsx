import { DashboardPage } from '@/components/dashboard/DashboardPage'
import { Suspense } from 'react'

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8 text-gray-500 flex items-center justify-center min-h-full">Carregando painel...</div>}>
      <DashboardPage />
    </Suspense>
  )
}
