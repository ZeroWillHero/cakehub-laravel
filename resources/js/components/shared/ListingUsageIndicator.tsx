interface Props {
    usage: number;
    limit: number | null;
}

export default function ListingUsageIndicator({ usage, limit }: Props) {
    const atLimit = limit !== null && usage >= limit;
    const pct = limit !== null ? Math.min(100, (usage / limit) * 100) : 0;

    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Listings used</span>
                <span className={atLimit ? 'font-medium text-destructive' : 'font-medium'}>
                    {usage}
                    {limit !== null ? ` / ${limit}` : ' (unlimited)'}
                </span>
            </div>
            {limit !== null && (
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                        className={`h-full rounded-full transition-all ${atLimit ? 'bg-destructive' : 'bg-primary'}`}
                        style={{ width: `${pct}%` }}
                    />
                </div>
            )}
        </div>
    );
}
