import {
    render,
    screen,
    waitFor,
    fireEvent,
    within,
} from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import AdminUsers from './AdminUsers';
import * as AuthContextModule from '../lib/AuthContext';
import apiClient from '../lib/apiClient';

vi.mock('../lib/apiClient');
vi.mock('../lib/AuthContext');

const mockUsers = [
    {
        id: 1,
        username: 'evi',
        role: 'User',
        createdAt: '2026-01-01T00:00:00Z',
    },
    {
        id: 2,
        username: 'admin',
        role: 'Admin',
        createdAt: '2026-01-01T00:00:00Z',
    },
];

const tempUser = {
    id: 3,
    username: 'temp',
    role: 'User',
    createdAt: '2026-01-02T00:00:00Z',
};

const renderPage = () =>
    render(
        <MemoryRouter>
            <AdminUsers />
        </MemoryRouter>
    );

const findUserRow = (username) => {
    const rows = screen.getAllByRole('row');

    return rows.find((row) => {
        const cells = within(row).queryAllByRole('cell');

        return cells.some(
            (cell) => cell.textContent === username
        );
    });
};

beforeEach(() => {
    vi.clearAllMocks();

    AuthContextModule.useAuth.mockReturnValue({
        user: 'admin',
        logout: vi.fn(),
        isAdmin: true,
    });

    apiClient.get.mockResolvedValue({
        data: mockUsers,
    });

    apiClient.post.mockResolvedValue({
        data: tempUser,
    });

    apiClient.delete.mockResolvedValue({});
});

describe('AdminUsers', () => {
    test('renders user list', async () => {
        renderPage();

        expect(
            await screen.findByText('evi')
        ).toBeInTheDocument();

        expect(
            screen.getByText('admin')
        ).toBeInTheDocument();

        expect(
            screen.getByText('Username')
        ).toBeInTheDocument();

        expect(
            screen.getByText('Role')
        ).toBeInTheDocument();

        expect(
            screen.getByText('Created At')
        ).toBeInTheDocument();
    });

    test('own row delete button is disabled', async () => {
        renderPage();

        await screen.findByText('evi');

        const adminRow = findUserRow('admin');

        expect(adminRow).toBeDefined();

        const deleteButton =
            within(adminRow).getByRole('button');

        expect(deleteButton).toBeDisabled();
    });

    test('creates a user successfully and refreshes the list', async () => {
        apiClient.get
            .mockResolvedValueOnce({
                data: mockUsers,
            })
            .mockResolvedValueOnce({
                data: [...mockUsers, tempUser],
            });

        renderPage();

        await screen.findByText('evi');

        fireEvent.click(
            screen.getByRole('button', {
                name: /add user/i,
            })
        );

        fireEvent.change(
            screen.getByLabelText(/^username$/i),
            {
                target: { value: 'temp' },
            }
        );

        fireEvent.change(
            screen.getByLabelText(/^password$/i),
            {
                target: { value: 'temp123' },
            }
        );

        fireEvent.click(
            screen.getByRole('button', {
                name: /^create$/i,
            })
        );

        await waitFor(() => {
            expect(apiClient.post).toHaveBeenCalledWith(
                '/api/admin/users',
                {
                    username: 'temp',
                    password: 'temp123',
                    role: 'User',
                }
            );
        });

        expect(
            await screen.findByText('temp')
        ).toBeInTheDocument();

        expect(
            screen.queryByRole('dialog')
        ).not.toBeInTheDocument();

        expect(apiClient.get).toHaveBeenCalledTimes(2);
    });

    test('create dialog shows duplicate username error on 409', async () => {
        apiClient.post.mockRejectedValueOnce({
            response: {
                status: 409,
            },
        });

        renderPage();

        await screen.findByText('evi');

        fireEvent.click(
            screen.getByRole('button', {
                name: /add user/i,
            })
        );

        fireEvent.change(
            screen.getByLabelText(/^username$/i),
            {
                target: { value: 'evi' },
            }
        );

        fireEvent.change(
            screen.getByLabelText(/^password$/i),
            {
                target: { value: 'pass123' },
            }
        );

        fireEvent.click(
            screen.getByRole('button', {
                name: /^create$/i,
            })
        );

        expect(
            await screen.findByText(/already taken/i)
        ).toBeInTheDocument();

        expect(
            screen.getByRole('dialog')
        ).toBeInTheDocument();

        expect(
            screen.getByLabelText(/^username$/i)
        ).toHaveValue('evi');
    });

    test('delete removes row on success', async () => {
        apiClient.get
            .mockResolvedValueOnce({
                data: mockUsers,
            })
            .mockResolvedValueOnce({
                data: [mockUsers[1]],
            });

        renderPage();

        await screen.findByText('evi');

        const eviRow = findUserRow('evi');

        expect(eviRow).toBeDefined();

        fireEvent.click(
            within(eviRow).getByRole('button')
        );

        expect(
            screen.getByText(/delete.*evi/i)
        ).toBeInTheDocument();

        fireEvent.click(
            screen.getByRole('button', {
                name: /^delete$/i,
            })
        );

        await waitFor(() => {
            expect(apiClient.delete).toHaveBeenCalledWith(
                '/api/admin/users/1'
            );
        });

        await waitFor(() => {
            expect(
                screen.queryByText('evi')
            ).not.toBeInTheDocument();
        });

        expect(apiClient.get).toHaveBeenCalledTimes(2);
    });

    test('blocked delete shows server error and keeps row', async () => {
        apiClient.delete.mockRejectedValueOnce({
            response: {
                status: 409,
                data: {
                    error:
                        'Cannot delete user with calculation history.',
                },
            },
        });

        renderPage();

        await screen.findByText('evi');

        const eviRow = findUserRow('evi');

        expect(eviRow).toBeDefined();

        fireEvent.click(
            within(eviRow).getByRole('button')
        );

        fireEvent.click(
            screen.getByRole('button', {
                name: /^delete$/i,
            })
        );

        expect(
            await screen.findByText(
                'Cannot delete user with calculation history.'
            )
        ).toBeInTheDocument();

        expect(
            screen.getByText('evi')
        ).toBeInTheDocument();

        expect(apiClient.get).toHaveBeenCalledTimes(1);
    });
});