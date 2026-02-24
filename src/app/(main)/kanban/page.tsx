import { KanbanHeader } from './_components/kanban-header'
import { KanbanBoard } from './_components/kanban-board'
import { KanbanProvider } from './_logic/kanban-context'

export default function KanbanPage() {
  return (
    <KanbanProvider>
      <div className="flex flex-col h-full overflow-hidden">
        <KanbanHeader />

        <div className="flex-1 min-h-0 overflow-hidden">
          <KanbanBoard />
        </div>
      </div>
    </KanbanProvider>
  )
}
