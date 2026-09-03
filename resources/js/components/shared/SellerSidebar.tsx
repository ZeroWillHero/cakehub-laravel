import { Link, usePage } from '@inertiajs/react';
import { CreditCard, LayoutDashboard, Package, Settings, ShoppingBag, Star, Store } from 'lucide-react';
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
import UserSidebarFooter from '@/components/shared/UserSidebarFooter';

const navItems = [
    { title: 'Dashboard', url: '/seller/dashboard', icon: LayoutDashboard },
    { title: 'Listings', url: '/seller/listings', icon: Package },
    { title: 'Orders', url: '/seller/orders', icon: ShoppingBag },
    { title: 'Reviews', url: '/seller/reviews', icon: Star },
    { title: 'Store Profile', url: '/seller/profile', icon: Store },
    { title: 'Subscription', url: '/seller/subscription', icon: CreditCard },
];

const settingsItem = { title: 'Settings', url: '/seller/settings', icon: Settings };

export default function SellerSidebar() {
    const { url } = usePage();

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader>
                <div className="flex items-center gap-2 px-2 py-1.5">
                    <span className="text-sm font-semibold group-data-[collapsible=icon]:hidden">
                        CakeHub Seller
                    </span>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Store</SidebarGroupLabel>
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
                <SidebarGroup className="mt-auto">
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    render={<Link href={settingsItem.url} />}
                                    isActive={url === settingsItem.url || url.startsWith(settingsItem.url + '/')}
                                    tooltip={settingsItem.title}
                                >
                                    <settingsItem.icon />
                                    <span>{settingsItem.title}</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <UserSidebarFooter />
        </Sidebar>
    );
}
