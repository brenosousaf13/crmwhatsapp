'use client'

import { Search, Tags, Calendar, LayoutGrid, List, User2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { CreateLeadModal } from './create-lead-modal'
import { useKanbanContext } from '../_logic/kanban-context'

export function KanbanHeader() {
    const { searchQuery, setSearchQuery, viewMode, setViewMode } = useKanbanContext()

    return (
        <div className="flex flex-col gap-4 mb-6 shrink-0">
            <div className="flex flex-wrap items-start justify-between gap-4">
                {/* Left side: Search and filters */}
                <div className="flex items-center gap-3 flex-wrap flex-1">
                    <div className="relative w-64 shrink-0">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                            placeholder="Buscar lead..."
                            className="pl-9 bg-white border-gray-200"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <Button variant="outline" className="bg-white border-gray-200 text-gray-700 gap-2 shrink-0">
                        <User2 className="h-4 w-4 text-gray-500" />
                        Todos os atendentes
                    </Button>

                    <Button variant="outline" className="bg-white border-gray-200 text-gray-700 gap-2 shrink-0">
                        <Tags className="h-4 w-4 text-gray-500" />
                        Todas as tags
                    </Button>

                    <Button variant="outline" className="bg-white border-gray-200 text-gray-700 gap-2 shrink-0">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        Período
                    </Button>
                </div>

                {/* Right side: Actions and View Toggle */}
                <div className="flex flex-col items-end gap-3 shrink-0">
                    <div className="flex items-center gap-2">
                        <CreateLeadModal />
                    </div>

                    <div className="flex items-center bg-gray-100 p-1 rounded-md border border-gray-200 shrink-0">
                        <Button
                            variant="ghost"
                            size="sm"
                            className={`gap-2 h-8 ${viewMode === 'kanban' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900 hover:bg-transparent'}`}
                            onClick={() => setViewMode('kanban')}
                        >
                            <LayoutGrid className="h-4 w-4" />
                            Kanban
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className={`gap-2 h-8 ${viewMode === 'list' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900 hover:bg-transparent'}`}
                            onClick={() => setViewMode('list')}
                        >
                            <List className="h-4 w-4" />
                            Lista
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
