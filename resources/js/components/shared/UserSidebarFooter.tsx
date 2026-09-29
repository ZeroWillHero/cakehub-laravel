import { usePage } from '@inertiajs/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SidebarFooter, SidebarMenu, SidebarMenuItem } from '@/components/ui/sidebar';
import LogoutButton from '@/components/shared/LogoutButton';
import type { SharedPageProps } from '@/types/shared';

function initials(name: string): string {
    return name
        .split(' ')
        .map((part) => part[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

export default function UserSidebarFooter() {
    const { auth } = usePage<SharedPageProps>().props;
    const user = auth.user;
    if (!user) return null;

    return (
        <SidebarFooter>
            <SidebarMenu>
                <SidebarMenuItem>
                    <div className="flex items-center gap-2 px-2 py-1.5">
                        <Avatar className="size-8">
                            <AvatarImage src={user.avatar_url ?? undefined} alt={user.name} />
                            <AvatarFallback>{initials(user.name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex min-w-0 flex-1 flex-col group-data-[collapsible=icon]:hidden">
                            <span className="truncate text-sm font-medium">{user.name}</span>
                            <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                        </div>
                        <LogoutButton iconOnly className="shrink-0 group-data-[collapsible=icon]:hidden" />
                    </div>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarFooter>
    );
}
