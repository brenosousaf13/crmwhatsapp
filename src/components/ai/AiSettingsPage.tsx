'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AiConfigTab } from './tabs/AiConfigTab'
import { AiPromptTab } from './tabs/AiPromptTab'
import { AiKnowledgeTab } from './tabs/AiKnowledgeTab'
import { AiLogsTab } from './tabs/AiLogsTab'
import { AiFollowupsTab } from './tabs/AiFollowupsTab'
import { AiStatusBanner } from './AiStatusBanner'

export function AiSettingsPage() {
    return (
        <div className="space-y-6">
            <AiStatusBanner />

            <Tabs defaultValue="config" className="w-full">
                <TabsList className="grid w-full lg:w-[600px] grid-cols-4">
                    <TabsTrigger value="config">Configuração</TabsTrigger>
                    <TabsTrigger value="prompt">Prompt do Agente</TabsTrigger>
                    <TabsTrigger value="knowledge">Knowledge Base</TabsTrigger>
                    <TabsTrigger value="followups">Follow-ups (IA)</TabsTrigger>
                    <TabsTrigger value="logs">Logs</TabsTrigger>
                </TabsList>
                <div className="mt-6 mb-12">
                    <TabsContent value="config">
                        <AiConfigTab />
                    </TabsContent>
                    <TabsContent value="prompt">
                        <AiPromptTab />
                    </TabsContent>
                    <TabsContent value="knowledge">
                        <AiKnowledgeTab />
                    </TabsContent>
                    <TabsContent value="followups">
                        <AiFollowupsTab />
                    </TabsContent>
                    <TabsContent value="logs">
                        <AiLogsTab />
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    )
}
