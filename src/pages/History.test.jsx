import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../lib/AuthContext';
import History from './History';

vi.mock('../lib/apiClient', () => ({
  default: { get: vi.fn(), delete: vi.fn() },
}));
vi.mock('../components/ThemeToggleButton.jsx', () => ({
  default: () => null,
}));

import apiClient from '../lib/apiClient';

const renderHistory = () => {
  localStorage.setItem('token', 'jwt-abc');
  localStorage.setItem('user', 'evi');

  return render(
    <MemoryRouter initialEntries={['/history']}>
      <AuthProvider>
        <History />
      </AuthProvider>
    </MemoryRouter>,
  );
};

describe('History', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders rows returned by the API', async () => {
    apiClient.get.mockResolvedValueOnce({
      data: {
        items: [
          { id: 1, expression: '1+1', result: 2, createdAt: '2026-05-06T10:00:00Z', username: 'evi' },
          { id: 2, expression: '2*3', result: 6, createdAt: '2026-05-06T09:00:00Z', username: 'nik' },
        ],
        total: 2,
      },
    });
    renderHistory();

    expect(await screen.findByText('1+1')).toBeInTheDocument();
    expect(screen.getByText('2*3')).toBeInTheDocument();
    expect(screen.getByText('evi')).toBeInTheDocument();
    expect(screen.getByText('nik')).toBeInTheDocument();
  });

  it('renders the empty state when the API returns no items', async () => {
    apiClient.get.mockResolvedValueOnce({ data: { items: [], total: 0 } });
    renderHistory();

    expect(await screen.findByText(/no calculations to show/i)).toBeInTheDocument();
  });

  it('debounces search changes and refetches with a username parameter', async () => {
    const user = userEvent.setup();
    apiClient.get.mockResolvedValue({ data: { items: [], total: 0 } });
    renderHistory();

    await waitFor(() => expect(apiClient.get).toHaveBeenCalledWith(
      '/api/calculations',
      { params: { page: 1, pageSize: 20 } },
    ));

    await user.type(screen.getByLabelText(/search by username/i), 'ev');

    await waitFor(() => expect(apiClient.get).toHaveBeenCalledWith(
      '/api/calculations',
      { params: { page: 1, pageSize: 20, username: 'ev' } },
    ), { timeout: 1500 });
  });
});
