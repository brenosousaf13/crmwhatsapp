interface SettingsPageHeaderProps {
    title: string;
    description?: string;
    action?: React.ReactNode;
}

export function SettingsPageHeader({ title, description, action }: SettingsPageHeaderProps) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">{title}</h1>
                {description && (
                    <p className="text-sm text-gray-500 mt-1">{description}</p>
                )}
            </div>
            {action && (
                <div className="flex-shrink-0">
                    {action}
                </div>
            )}
        </div>
    )
}
