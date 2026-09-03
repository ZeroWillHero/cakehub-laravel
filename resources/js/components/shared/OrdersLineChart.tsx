import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export interface DailyCount {
    date: string;
    count: number;
}

interface Series {
    data: DailyCount[];
    label: string;
    color?: string;
}

interface Props {
    series: Series[];
    height?: number;
}

function formatDate(value: string): string {
    const date = new Date(value);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function OrdersLineChart({ series, height = 220 }: Props) {
    const merged = series[0]?.data.map((point, i) => {
        const row: Record<string, string | number> = { date: point.date };
        series.forEach((s) => {
            row[s.label] = s.data[i]?.count ?? 0;
        });
        return row;
    });

    if (!merged || merged.length === 0) {
        return null;
    }

    return (
        <ResponsiveContainer width="100%" height={height}>
            <LineChart data={merged} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                    interval="preserveStartEnd"
                    minTickGap={24}
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} width={28} />
                <Tooltip
                    labelFormatter={(value) => formatDate(String(value))}
                    contentStyle={{
                        background: 'var(--popover)',
                        border: '1px solid var(--border)',
                        borderRadius: 8,
                        fontSize: 12,
                    }}
                />
                {series.map((s, i) => (
                    <Line
                        key={s.label}
                        type="monotone"
                        dataKey={s.label}
                        // chart-1 is deliberately very light (near-invisible as a thin
                        // stroke against the neutral Admin/Seller palettes) — start
                        // from chart-3 instead, which has better line contrast.
                        stroke={s.color ?? `var(--chart-${((i + 2) % 5) + 1})`}
                        strokeWidth={2}
                        dot={false}
                    />
                ))}
            </LineChart>
        </ResponsiveContainer>
    );
}
