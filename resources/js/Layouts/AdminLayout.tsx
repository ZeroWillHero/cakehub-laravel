import type { ReactNode } from 'react';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import AdminSidebar from '@/components/shared/AdminSidebar';
import NotificationBell from '@/components/shared/NotificationBell';

interface Props {
    children: ReactNode;
    /** Breadcrumb segments after "Admin", e.g. ["Categories"] or ["Verification Queue", seller.business_name]. */
    breadcrumb: string[];
}

export default function AdminLayout({ children, breadcrumb }: Props) {
    return (
        <SidebarProvider>
            <AdminSidebar />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4">
                    <div className="flex items-center gap-2">
                        <SidebarTrigger className="-ml-1" />
                        <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem className="hidden md:block">Admin</BreadcrumbItem>
                                {breadcrumb.map((segment, i) => (
                                    <span key={segment} className="contents">
                                        <BreadcrumbSeparator className="hidden md:block" />
                                        <BreadcrumbItem>
                                            {i === breadcrumb.length - 1 ? (
                                                <BreadcrumbPage>{segment}</BreadcrumbPage>
                                            ) : (
                                                segment
                                            )}
                                        </BreadcrumbItem>
                                    </span>
                                ))}
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                    <NotificationBell />
                </header>
                <div className="flex flex-1 flex-col gap-4 p-4">{children}</div>
            </SidebarInset>
        </SidebarProvider>
    );
}
