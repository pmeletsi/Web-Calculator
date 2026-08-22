import {
    render,
    screen,
    waitFor,
    fireEvent,
    act,
} from '@testing-library/react';
import {
    beforeEach,
    describe,
    expect,
    test,
    vi,
} from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import AdminHistory from './AdminHistory';
import * as AuthContextModule from '../lib/AuthContext';
import apiClient from '../lib/apiClient';

vi.mock('../lib/apiClient');
vi.mock('../lib/AuthContext');

const mockPage = (items = [], total = 0) => ({
    data: {
        items,
        total,
    },
});

beforeEach(() => {
    vi.clearAllMocks();

    AuthContextModule.useAuth.mockReturnValue({
        user: 'admin',
        logout: vi.fn(),
        isAdmin: true,
    });

    apiClient.get.mockResolvedValue(
        mockPage(
            [
                {
                    id: 1,
                    username: 'evi',
                    expression: '1+1',
                    result: 2,
                    createdAt: '2026-01-01T00:00:00Z',
                },
            ],
            1
        )
    );
});

describe('AdminHistory', () => {
    test('renders history rows', async () => {
        render(
            <MemoryRouter>
                <AdminHistory />
            </MemoryRouter>
        );

        expect(
            await screen.findByText('evi')
        ).toBeInTheDocument();

        expect(
            screen.getByText('1+1')
        ).toBeInTheDocument();

        expect(
            screen.getByText('2')
        ).toBeInTheDocument();

        expect(
            screen.getByText('Username')
        ).toBeInTheDocument();

        expect(
            screen.getByText('Expression')
        ).toBeInTheDocument();
    });

    test('shows empty state', async () => {
        apiClient.get.mockResolvedValueOnce(
            mockPage([], 0)
        );

        render(
            <MemoryRouter>
                <AdminHistory />
            </MemoryRouter>
        );

        expect(
            await screen.findByText(
                'No calculations found.'
            )
        ).toBeInTheDocument();
    });

    test('shows error state on failed fetch', async () => {
        apiClient.get.mockRejectedValueOnce(
            new Error('boom')
        );

        render(
            <MemoryRouter>
                <AdminHistory />
            </MemoryRouter>
        );

        expect(
            await screen.findByText(
                /could not load history/i
            )
        ).toBeInTheDocument();
    });

    test('username filter refetches with username after debounce', async () => {
        vi.useFakeTimers();

        render(
            <MemoryRouter>
                <AdminHistory />
            </MemoryRouter>
        );

        await waitFor(() =>
            expect(screen.getByText('evi'))
                .toBeInTheDocument()
        );

        fireEvent.change(
            screen.getByLabelText(
                /filter by username/i
            ),
            {
                target: {
                    value: 'nik',
                },
            }
        );

        act(() => {
            vi.advanceTimersByTime(300);
        });

        await waitFor(() =>
            expect(apiClient.get).toHaveBeenCalledWith(
                '/api/calculations',
                expect.objectContaining({
                    params: expect.objectContaining({
                        username: 'nik',
                    }),
                })
            )
        );

        vi.useRealTimers();
    });

    test('clearing username filter refetches all users view', async () => {
        vi.useFakeTimers();

        render(
            <MemoryRouter>
                <AdminHistory />
            </MemoryRouter>
        );

        await waitFor(() =>
            expect(screen.getByText('evi'))
                .toBeInTheDocument()
        );

        const input =
            screen.getByLabelText(
                /filter by username/i
            );

        fireEvent.change(input, {
            target: {
                value: 'nik',
            },
        });

        act(() => {
            vi.advanceTimersByTime(300);
        });

        fireEvent.change(input, {
            target: {
                value: '',
            },
        });

        act(() => {
            vi.advanceTimersByTime(300);
        });

        await waitFor(() =>
            expect(apiClient.get).toHaveBeenLastCalledWith(
                '/api/calculations',
                expect.objectContaining({
                    params: expect.not.objectContaining({
                        username: expect.anything(),
                    }),
                })
            )
        );

        vi.useRealTimers();
    });

    test('pagination changes page', async () => {
        render(
            <MemoryRouter>
                <AdminHistory />
            </MemoryRouter>
        );

        await waitFor(() =>
            expect(screen.getByText('evi'))
                .toBeInTheDocument()
        );

        const nextPageButton =
            screen.getByLabelText(
                /go to next page/i
            );

        fireEvent.click(nextPageButton);

        await waitFor(() =>
            expect(apiClient.get).toHaveBeenCalledWith(
                '/api/calculations',
                expect.objectContaining({
                    params: expect.objectContaining({
                        page: 2,
                    }),
                })
            )
        );
    });
});