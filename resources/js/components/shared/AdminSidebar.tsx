import { Link, usePage } from '@inertiajs/react';
import { ClipboardCheck, CreditCard, LayoutDashboard, Tag } from 'lucide-react';
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';

const navItems = [
    { title: 'Dashboard', url: '/admin/dashboard', icon: LayoutDashboard },
    { title: 'Verification Queue', url: '/admin/sellers/pending', icon: ClipboardCheck },
    { title: 'Categories', url: '/admin/categories', icon: Tag },
    { title: 'Subscription Plans', url: '/admin/subscription-plans', icon: CreditCard },
];

export default function AdminSidebar() {
    const { url } = usePage();

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader>
                <div className="flex items-center gap-2 px-2 py-1.5">
                    <span className="text-sm font-semibold group-data-[collapsible=icon]:hidden">
                        CakeHub Admin
                    </span>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Platform</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {navItems.map((item) => (
                                <SidebarMenuItem key={item.url}>
                                    <SidebarMenuButton
                                        render={<Link href={item.url} />}
                                        isActive={url === item.url || url.startsWith(item.url + '/')}
                                        tooltip={item.title}
                                    >
                                        <item.icon />
                                        <span>{item.title}</span>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    );
}
