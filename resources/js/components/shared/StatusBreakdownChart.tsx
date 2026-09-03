import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface Props {
    breakdown: Record<string, number>;
    labels?: Record<string, string>;
    color?: string;
    height?: number;
}

export default function StatusBreakdownChart({ breakdown, labels, color, height = 220 }: Props) {
    const data = Object.entries(breakdown).map(([status, count]) => ({
        status: labels?.[status] ?? status,
        count,
    }));

    if (data.every((d) => d.count === 0)) {
        return <p className="text-sm text-muted-foreground">No orders yet.</p>;
    }

    return (
        <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                    dataKey="status"
                    tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                    height={50}
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} width={28} />
                <Tooltip
                    contentStyle={{
                        background: 'var(--popover)',
                        border: '1px solid var(--border)',
                        borderRadius: 8,
                        fontSize: 12,
                    }}
                />
                <Bar dataKey="count" fill={color ?? 'var(--chart-3)'} radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
}
