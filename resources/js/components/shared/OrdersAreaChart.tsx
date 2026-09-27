import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import Spinner from '@/components/shared/Spinner';

export type ChartRange = 7 | 30 | 90;

const rangeLabel: Record<ChartRange, string> = {
    7: 'Last 7 days',
    30: 'Last 30 days',
    90: 'Last 90 days',
};

interface Props {
    title: string;
    description?: string;
    data: { date: string; count: number }[];
    range: ChartRange;
    onRangeChange: (range: ChartRange) => void;
    dataKey?: string;
    color?: string;
    loading?: boolean;
}

function formatDate(value: string): string {
    return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function OrdersAreaChart({
    title,
    description,
    data,
    range,
    onRangeChange,
    dataKey = 'count',
    color = 'var(--chart-3)',
    loading = false,
}: Props) {
    const chartConfig = {
        [dataKey]: { label: title, color },
    } satisfies ChartConfig;

    const gradientId = `fill-${dataKey.replace(/\s+/g, '-')}`;

    return (
        <Card className="@container/card relative">
            {loading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-card/60">
                    <Spinner size={20} />
                </div>
            )}
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                {description && <CardDescription>{description}</CardDescription>}
                <CardAction>
                    <ToggleGroup
                        value={[String(range)]}
                        onValueChange={(v) => v[0] && onRangeChange(Number(v[0]) as ChartRange)}
                        variant="outline"
                        className="hidden @[400px]/card:flex"
                    >
                        {([7, 30, 90] as ChartRange[]).map((r) => (
                            <ToggleGroupItem key={r} value={String(r)} className="px-3!">
                                {r}d
                            </ToggleGroupItem>
                        ))}
                    </ToggleGroup>
                    <Select value={String(range)} onValueChange={(v) => onRangeChange(Number(v) as ChartRange)}>
                        <SelectTrigger className="flex w-36 @[400px]/card:hidden" size="sm" aria-label="Select a range">
                            <SelectValue>{() => rangeLabel[range]}</SelectValue>
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                            {([7, 30, 90] as ChartRange[]).map((r) => (
                                <SelectItem key={r} value={String(r)} className="rounded-lg">
                                    {rangeLabel[r]}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardAction>
            </CardHeader>
            <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
                <ChartContainer config={chartConfig} className="aspect-auto h-[220px] w-full">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={`var(--color-${dataKey})`} stopOpacity={0.8} />
                                <stop offset="95%" stopColor={`var(--color-${dataKey})`} stopOpacity={0.1} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="date"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            minTickGap={32}
                            tickFormatter={formatDate}
                        />
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent labelFormatter={(v) => formatDate(String(v))} indicator="dot" />}
                        />
                        <Area
                            dataKey={dataKey}
                            type="natural"
                            fill={`url(#${gradientId})`}
                            stroke={`var(--color-${dataKey})`}
                        />
                    </AreaChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
