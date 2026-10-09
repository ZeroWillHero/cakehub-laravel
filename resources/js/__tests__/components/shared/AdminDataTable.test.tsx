import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import AdminDataTable, { pageWindow, type AdminColumn } from '@/components/shared/AdminDataTable';
import type { PaginationMeta } from '@/types/pagination';

interface Row {
    id: number;
    name: string;
}

const columns: AdminColumn<Row>[] = [
    { key: 'id', header: 'ID', cell: (row) => `#${row.id}` },
    { key: 'name', header: 'Name', cell: (row) => row.name },
];

const meta = (overrides: Partial<PaginationMeta> = {}): PaginationMeta => ({
    current_page: 1,
    last_page: 1,
    per_page: 20,
    total: 2,
    from: 1,
    to: 2,
    ...overrides,
});

function renderTable(props: Partial<React.ComponentProps<typeof AdminDataTable<Row>>> = {}) {
    const handlers = {
        onRowClick: vi.fn(),
        onSearch: vi.fn(),
        onClearFilters: vi.fn(),
        onPageChange: vi.fn(),
    };
    render(
        <AdminDataTable<Row>
            rows={[
                { id: 1, name: 'Asha' },
                { id: 2, name: 'Nimal' },
            ]}
            columns={columns}
            meta={meta()}
            rowKey={(row) => row.id}
            rowLabel={(row) => `Row ${row.name}`}
            search=""
            searchPlaceholder="Search people"
            hasActiveFilters={false}
            pageHref={(page) => `/list?page=${page}`}
            emptyMessage="Nobody here yet."
            {...handlers}
            {...props}
        />,
    );
    return handlers;
}

describe('AdminDataTable', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it('renders a header and one row per item', () => {
        renderTable();

        expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument();
        expect(screen.getByRole('row', { name: 'Row Asha' })).toBeInTheDocument();
        expect(screen.getByRole('row', { name: 'Row Nimal' })).toBeInTheDocument();
        expect(screen.getByText('Showing 1–2 of 2')).toBeInTheDocument();
    });

    it('opens a row on click and on Enter', async () => {
        const { onRowClick } = renderTable();

        await userEvent.click(screen.getByText('Nimal'));
        expect(onRowClick).toHaveBeenLastCalledWith({ id: 2, name: 'Nimal' });

        screen.getByRole('row', { name: 'Row Asha' }).focus();
        await userEvent.keyboard('{Enter}');
        expect(onRowClick).toHaveBeenLastCalledWith({ id: 1, name: 'Asha' });
    });

    it('debounces the search box before calling onSearch', () => {
        vi.useFakeTimers();
        const { onSearch } = renderTable();

        fireEvent.change(screen.getByRole('searchbox', { name: 'Search people' }), { target: { value: ' ash ' } });
        expect(onSearch).not.toHaveBeenCalled();

        act(() => vi.advanceTimersByTime(300));
        expect(onSearch).toHaveBeenCalledWith('ash');
    });

    it('keeps what was typed when the server echoes an earlier search back', () => {
        vi.useFakeTimers();
        const props = {
            rows: [],
            columns,
            meta: meta({ total: 0, from: null, to: null }),
            rowKey: (row: Row) => row.id,
            rowLabel: (row: Row) => row.name,
            searchPlaceholder: 'Search people',
            hasActiveFilters: true,
            pageHref: () => '',
            emptyMessage: '',
            onRowClick: vi.fn(),
            onSearch: vi.fn(),
            onClearFilters: vi.fn(),
            onPageChange: vi.fn(),
        };
        const { rerender } = render(<AdminDataTable<Row> {...props} search="" />);
        const box = screen.getByRole('searchbox', { name: 'Search people' });

        fireEvent.change(box, { target: { value: 'cho' } });
        act(() => vi.advanceTimersByTime(300));
        fireEvent.change(box, { target: { value: 'chocolate' } });

        // The reload for "cho" lands while "chocolate" is in the box.
        rerender(<AdminDataTable<Row> {...props} search="cho" />);
        expect(box).toHaveValue('chocolate');

        // An outside change (e.g. Clear filters) still resets it.
        rerender(<AdminDataTable<Row> {...props} search="" />);
        expect(box).toHaveValue('');
    });

    it('offers a way back from a page past the end', async () => {
        const { onPageChange } = renderTable({
            rows: [],
            meta: meta({ current_page: 99, last_page: 2, total: 25, from: null, to: null }),
        });

        expect(screen.getByText(/nothing on this page/)).toBeInTheDocument();
        expect(screen.getByText('25 in total')).toBeInTheDocument();
        await userEvent.click(screen.getByRole('button', { name: 'Go to the first page' }));
        expect(onPageChange).toHaveBeenCalledWith(1);
    });

    it('shows the empty message when there is no data at all', () => {
        renderTable({ rows: [], meta: meta({ total: 0, from: null, to: null }) });

        expect(screen.getByText('Nobody here yet.')).toBeInTheDocument();
        expect(screen.queryByText(/Showing/)).not.toBeInTheDocument();
    });

    it('offers to clear filters when filters match nothing', async () => {
        const { onClearFilters } = renderTable({
            rows: [],
            meta: meta({ total: 0, from: null, to: null }),
            hasActiveFilters: true,
        });

        expect(screen.getByText('No results match your filters.')).toBeInTheDocument();
        await userEvent.click(screen.getAllByRole('button', { name: 'Clear filters' })[1]);
        expect(onClearFilters).toHaveBeenCalled();
    });

    it('shows skeleton rows instead of data while loading', () => {
        renderTable({ loading: true });

        expect(screen.queryByText('Asha')).not.toBeInTheDocument();
    });

    it('pages with real links and an in-page handler', async () => {
        const { onPageChange } = renderTable({ meta: meta({ current_page: 2, last_page: 5, total: 90, from: 21, to: 40 }) });

        expect(screen.getByText('Showing 21–40 of 90')).toBeInTheDocument();
        // shadcn's PaginationLink is an <a href> that Base UI's Button gives role="button".
        const page3 = screen.getByRole('button', { name: '3' });
        expect(page3).toHaveAttribute('href', '/list?page=3');
        expect(screen.getByRole('button', { name: '2' })).toHaveAttribute('aria-current', 'page');

        await userEvent.click(page3);
        expect(onPageChange).toHaveBeenCalledWith(3);

        await userEvent.click(screen.getByRole('button', { name: /previous/i }));
        expect(onPageChange).toHaveBeenCalledWith(1);
    });
});

describe('pageWindow', () => {
    it('collapses long ranges around the current page', () => {
        expect(pageWindow(1, 1)).toEqual([1]);
        expect(pageWindow(1, 3)).toEqual([1, 2, 3]);
        expect(pageWindow(5, 12)).toEqual([1, 'gap', 4, 5, 6, 'gap', 12]);
        expect(pageWindow(12, 12)).toEqual([1, 'gap', 11, 12]);
    });
});
