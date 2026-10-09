import { Link } from '@inertiajs/react';
import { useState } from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminLayout from '@/Layouts/AdminLayout';
import AdminDataTable, { type AdminColumn } from '@/components/shared/AdminDataTable';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/errors';
import { statusTone } from '@/lib/statusTone';
import { toast } from '@/lib/toast';
import { useListFilters } from '@/lib/useListFilters';
import { cn } from '@/lib/utils';
import type { AdminUser, UserStatus } from '@/types/adminUser';
import type { Paginated } from '@/types/pagination';
import type { VerificationStatus } from '@/types/seller';

type Tab = 'customers' | 'sellers';

interface Filters {
    tab: Tab;
    search: string;
    status: UserStatus | null;
    verification: VerificationStatus | null;
    [key: string]: string | null;
}

interface Props {
    users: Paginated<AdminUser>;
    counts: Record<Tab, number>;
    filters: Filters;
}

const statusLabel: Record<UserStatus, string> = {
    active: 'Active',
    suspended: 'Suspended',
    deactivated: 'Deactivated',
};

const verificationLabel: Record<VerificationStatus, string> = {
    pending: 'Pending',
    verified: 'Verified',
    rejected: 'Rejected',
    suspended: 'Suspended',
};

const money = (amount: number) => `$${amount.toFixed(2)}`;
const date = (iso: string) => new Date(iso).toLocaleDateString();

function StatusBadge({ status }: { status: UserStatus }) {
    return (
        <Badge variant="secondary" className={statusTone(status)}>
            {statusLabel[status]}
        </Badge>
    );
}

function UserCell({ user }: { user: AdminUser }) {
    return (
        <div className="flex items-center gap-2">
            <Avatar className="size-7">
                <AvatarImage src={user.avatar_url ?? undefined} alt="" />
                <AvatarFallback>{user.name.slice(0, 1).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="font-medium">{user.name}</span>
        </div>
    );
}

const customerColumns: AdminColumn<AdminUser>[] = [
    { key: 'name', header: 'Name', cell: (user) => <UserCell user={user} /> },
    { key: 'email', header: 'Email', cell: (user) => user.email, className: 'hidden md:table-cell' },
    { key: 'orders', header: 'Orders', cell: (user) => user.orders_count ?? 0, className: 'text-right' },
    {
        key: 'spent',
        header: 'Total spent',
        cell: (user) => money(user.orders_total ?? 0),
        className: 'hidden sm:table-cell text-right',
    },
    { key: 'joined', header: 'Joined', cell: (user) => date(user.created_at), className: 'hidden lg:table-cell' },
    { key: 'status', header: 'Account', cell: (user) => <StatusBadge status={user.status} /> },
];

const sellerColumns: AdminColumn<AdminUser>[] = [
    {
        key: 'business',
        header: 'Business',
        cell: (user) => (
            <div>
                <p className="font-medium">{user.seller?.business_name ?? 'Onboarding not finished'}</p>
                <p className="text-xs text-muted-foreground">{user.name}</p>
            </div>
        ),
    },
    { key: 'email', header: 'Owner email', cell: (user) => user.email, className: 'hidden md:table-cell' },
    {
        key: 'verification',
        header: 'Verification',
        cell: (user) =>
            user.seller ? (
                <Badge variant="secondary" className={statusTone(user.seller.verification_status)}>
                    {verificationLabel[user.seller.verification_status]}
                </Badge>
            ) : (
                '—'
            ),
        className: 'hidden sm:table-cell',
    },
    {
        key: 'listings',
        header: 'Listings',
        cell: (user) => user.seller?.products_count ?? 0,
        className: 'hidden lg:table-cell text-right',
    },
    { key: 'orders', header: 'Orders', cell: (user) => user.seller?.orders_count ?? 0, className: 'text-right' },
    { key: 'status', header: 'Account', cell: (user) => <StatusBadge status={user.status} /> },
];

export default function AdminUsers({ users, counts, filters }: Props) {
    const list = useListFilters(filters, ['users', 'counts', 'filters']);
    const [rows, setRows] = useState(users.data);
    const [rowsSource, setRowsSource] = useState(users.data);
    const [selected, setSelected] = useState<AdminUser | null>(null);

    // A filter/page reload brings a new list; a suspend/reactivate patches one
    // row in place without reloading (so the sheet and scroll stay put).
    if (rowsSource !== users.data) {
        setRowsSource(users.data);
        setRows(users.data);
    }

    const isSellers = filters.tab === 'sellers';
    const hasActiveFilters = Boolean(filters.search || filters.status || filters.verification);

    function handleUpdated(updated: AdminUser) {
        setRows((current) => current.map((row) => (row.id === updated.id ? updated : row)));
        setSelected(updated);
    }

    return (
        <AdminLayout breadcrumb={['Users']}>
            <h1 className="text-2xl font-semibold">Users</h1>

            <Tabs
                value={filters.tab}
                onValueChange={(tab) => list.setFilters({ tab: tab as Tab, status: null, verification: null })}
            >
                <TabsList>
                    <TabsTrigger value="customers">Customers ({counts.customers})</TabsTrigger>
                    <TabsTrigger value="sellers">Sellers ({counts.sellers})</TabsTrigger>
                </TabsList>
            </Tabs>

            <AdminDataTable
                rows={rows}
                columns={isSellers ? sellerColumns : customerColumns}
                meta={users.meta}
                rowKey={(user) => user.id}
                rowLabel={(user) =>
                    `${isSellers ? (user.seller?.business_name ?? user.name) : user.name}, ${statusLabel[user.status]}`
                }
                onRowClick={setSelected}
                search={filters.search}
                searchPlaceholder={isSellers ? 'Search business, name or email' : 'Search name or email'}
                onSearch={(search) => list.setFilters({ search })}
                hasActiveFilters={hasActiveFilters}
                onClearFilters={() => list.clear({ tab: filters.tab })}
                onPageChange={list.setPage}
                pageHref={list.pageHref}
                loading={list.loading}
                emptyMessage={isSellers ? 'No sellers have signed up yet.' : 'No customers have signed up yet.'}
                filters={
                    <>
                        <div className="space-y-1">
                            <Label htmlFor="status_filter" className="text-xs">
                                Account
                            </Label>
                            <Select
                                value={filters.status ?? 'all'}
                                onValueChange={(v) => list.setFilters({ status: v === 'all' ? null : (v as UserStatus) })}
                            >
                                <SelectTrigger id="status_filter" className="w-40">
                                    <SelectValue>
                                        {(value: UserStatus | 'all') => (value === 'all' ? 'All accounts' : statusLabel[value])}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All accounts</SelectItem>
                                    {Object.entries(statusLabel).map(([value, label]) => (
                                        <SelectItem key={value} value={value}>
                                            {label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {isSellers && (
                            <div className="space-y-1">
                                <Label htmlFor="verification_filter" className="text-xs">
                                    Verification
                                </Label>
                                <Select
                                    value={filters.verification ?? 'all'}
                                    onValueChange={(v) =>
                                        list.setFilters({ verification: v === 'all' ? null : (v as VerificationStatus) })
                                    }
                                >
                                    <SelectTrigger id="verification_filter" className="w-40">
                                        <SelectValue>
                                            {(value: VerificationStatus | 'all') =>
                                                value === 'all' ? 'Any verification' : verificationLabel[value]
                                            }
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Any verification</SelectItem>
                                        {Object.entries(verificationLabel).map(([value, label]) => (
                                            <SelectItem key={value} value={value}>
                                                {label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </>
                }
            />

            <Sheet open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
                <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
                    {selected && <UserDetails user={selected} onUpdated={handleUpdated} />}
                </SheetContent>
            </Sheet>
        </AdminLayout>
    );
}

export function UserDetails({ user, onUpdated }: { user: AdminUser; onUpdated: (user: AdminUser) => void }) {
    const [confirming, setConfirming] = useState(false);
    const [saving, setSaving] = useState(false);
    const isSeller = user.role === 'seller';
    const suspending = user.status === 'active';

    async function changeStatus() {
        setSaving(true);
        try {
            const updated = await api.patch<AdminUser>(`/admin/users/${user.id}/${suspending ? 'suspend' : 'reactivate'}`);
            onUpdated(updated);
            toast.success(suspending ? 'Account suspended.' : 'Account reactivated.');
        } catch (err) {
            toast.error(errorMessage(err, undefined, suspending ? "Couldn't suspend the account." : "Couldn't reactivate the account."));
        } finally {
            setSaving(false);
            setConfirming(false);
        }
    }

    return (
        <>
            <SheetHeader>
                <div className="flex items-center gap-3">
                    <Avatar className="size-10">
                        <AvatarImage src={user.avatar_url ?? undefined} alt="" />
                        <AvatarFallback>{user.name.slice(0, 1).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                        <SheetTitle className="truncate">{isSeller ? (user.seller?.business_name ?? user.name) : user.name}</SheetTitle>
                        <SheetDescription className="truncate">{user.email}</SheetDescription>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                    <StatusBadge status={user.status} />
                    {user.seller && (
                        <Badge variant="secondary" className={statusTone(user.seller.verification_status)}>
                            {verificationLabel[user.seller.verification_status]}
                        </Badge>
                    )}
                </div>
            </SheetHeader>

            <div className="flex flex-col gap-5 px-4 pb-6 text-sm">
                <dl className="grid grid-cols-2 gap-3">
                    {isSeller && (
                        <div>
                            <dt className="text-xs text-muted-foreground">Owner</dt>
                            <dd className="font-medium">{user.name}</dd>
                        </div>
                    )}
                    <div>
                        <dt className="text-xs text-muted-foreground">Joined</dt>
                        <dd className="font-medium">{date(user.created_at)}</dd>
                    </div>
                    {isSeller ? (
                        <>
                            <div>
                                <dt className="text-xs text-muted-foreground">Listings</dt>
                                <dd className="font-medium">{user.seller?.products_count ?? 0}</dd>
                            </div>
                            <div>
                                <dt className="text-xs text-muted-foreground">Orders received</dt>
                                <dd className="font-medium">{user.seller?.orders_count ?? 0}</dd>
                            </div>
                        </>
                    ) : (
                        <>
                            <div>
                                <dt className="text-xs text-muted-foreground">Orders</dt>
                                <dd className="font-medium">{user.orders_count ?? 0}</dd>
                            </div>
                            <div>
                                <dt className="text-xs text-muted-foreground">Total spent</dt>
                                <dd className="font-medium">{money(user.orders_total ?? 0)}</dd>
                            </div>
                            <div>
                                <dt className="text-xs text-muted-foreground">Last order</dt>
                                <dd className="font-medium">{user.last_order_at ? date(user.last_order_at) : 'Never'}</dd>
                            </div>
                        </>
                    )}
                </dl>

                <div className="flex flex-wrap gap-2">
                    {isSeller && user.seller && (
                        <>
                            <Link
                                href={`/admin/sellers/${user.seller.id}`}
                                className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                            >
                                Open seller profile
                            </Link>
                            <Link
                                href={`/admin/orders?seller=${user.seller.id}`}
                                className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                            >
                                View orders
                            </Link>
                        </>
                    )}
                    {!isSeller && (
                        <Link
                            href={`/admin/orders?customer=${user.id}`}
                            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                        >
                            View orders
                        </Link>
                    )}
                </div>

                <Separator />

                <section className="flex flex-col gap-2">
                    <h3 className="font-medium">Account access</h3>
                    {user.status === 'deactivated' ? (
                        <p className="text-muted-foreground">
                            This user deactivated their own account, so it can&apos;t be suspended or reactivated here.
                        </p>
                    ) : (
                        <>
                            <p className="text-muted-foreground">
                                {suspending
                                    ? isSeller
                                        ? 'Suspending signs this seller out, blocks them from using their account, and hides their store from customers.'
                                        : 'Suspending signs this customer out and blocks them from using their account.'
                                    : isSeller
                                      ? 'Reactivating lets this seller use their account again and makes their store visible again (if it is verified).'
                                      : 'Reactivating lets this customer use their account again.'}
                            </p>
                            <Button
                                type="button"
                                variant={suspending ? 'destructive' : 'default'}
                                className="w-fit"
                                onClick={() => setConfirming(true)}
                            >
                                {suspending ? 'Suspend account' : 'Reactivate account'}
                            </Button>
                        </>
                    )}
                </section>
            </div>

            <AlertDialog open={confirming} onOpenChange={setConfirming}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {suspending ? `Suspend ${user.name}'s account?` : `Reactivate ${user.name}'s account?`}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {suspending
                                ? isSeller
                                    ? 'Their store is hidden from search, their storefront and the cart straight away, and they’re signed out the next time they use CakeHub. You can reactivate them later.'
                                    : 'They’re signed out the next time they use CakeHub and can’t use their account until it’s reactivated.'
                                : 'They can use their account again straight away.'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={changeStatus}
                            disabled={saving}
                            className={cn(suspending && buttonVariants({ variant: 'destructive' }))}
                        >
                            {saving ? 'Saving…' : suspending ? 'Suspend' : 'Reactivate'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
