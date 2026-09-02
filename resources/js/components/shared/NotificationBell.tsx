import { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import type { AppNotification } from '@/types/notification';

export default function NotificationBell() {
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    async function load() {
        const response = await fetch('/api/notifications', {
            headers: { Accept: 'application/json' },
            credentials: 'include',
        });
        const json = await response.json();
        setNotifications(json.data);
        setUnreadCount(json.meta.unread_count);
    }

    useEffect(() => {
        load();
    }, []);

    useEffect(() => {
        function onClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', onClickOutside);
        return () => document.removeEventListener('mousedown', onClickOutside);
    }, []);

    async function toggle() {
        const next = !open;
        setOpen(next);
        if (next) {
            await load();
        }
    }

    async function markAllRead() {
        await api.patch('/notifications/read-all');
        setUnreadCount(0);
        setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
    }

    return (
        <div ref={containerRef} className="relative">
            <Button type="button" variant="ghost" size="icon" onClick={toggle} aria-label="Notifications">
                <Bell className="size-5" />
                {unreadCount > 0 && (
                    <Badge variant="destructive" className="absolute -right-1 -top-1 h-4 min-w-4 rounded-full px-1 text-[10px]">
                        {unreadCount}
                    </Badge>
                )}
            </Button>

            {open && (
                <div className="absolute right-0 z-50 mt-2 w-80 rounded-md border bg-popover text-popover-foreground shadow-md">
                    <div className="flex items-center justify-between border-b px-3 py-2">
                        <span className="text-sm font-medium">Notifications</span>
                        {unreadCount > 0 && (
                            <button type="button" onClick={markAllRead} className="text-xs text-primary underline">
                                Mark all read
                            </button>
                        )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <p className="px-3 py-6 text-center text-sm text-muted-foreground">No notifications yet.</p>
                        ) : (
                            notifications.map((n) => (
                                <div
                                    key={n.id}
                                    className={`border-b px-3 py-2 text-sm last:border-b-0 ${n.read_at ? 'text-muted-foreground' : 'font-medium'}`}
                                >
                                    <p>{n.data.message}</p>
                                    <p className="text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString()}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
