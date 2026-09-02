export interface AppNotification {
    id: string;
    data: {
        order_id: number;
        status: string;
        message: string;
    };
    read_at: string | null;
    created_at: string;
}
