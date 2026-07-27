import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../lib/AuthContext';
import Login from './Login';

vi.mock('../lib/apiClient', () => ({
  default: { post: vi.fn() },
}));
vi.mock('../components/ThemeToggleButton.jsx', () => ({
  default: () => null,
}));

import apiClient from '../lib/apiClient';

const renderLogin = () => render(
  <MemoryRouter initialEntries={['/login']}>
    <AuthProvider>
      <Login />
    </AuthProvider>
  </MemoryRouter>,
);

describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders the form', () => {
    renderLogin();

    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('calls apiClient.post on submit', async () => {
    const user = userEvent.setup();
    apiClient.post.mockResolvedValueOnce({
      data: { token: 'jwt-abc', username: 'evi' },
    });
    renderLogin();

    await user.type(screen.getByLabelText(/username/i), 'evi');
    await user.type(screen.getByLabelText(/password/i), '1234');
    await user.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => expect(apiClient.post).toHaveBeenCalledWith(
      '/api/auth/login',
      { username: 'evi', password: '1234' },
    ));
  });

  it('renders an error alert on 401', async () => {
    const user = userEvent.setup();
    apiClient.post.mockRejectedValueOnce({ response: { status: 401 } });
    renderLogin();

    await user.type(screen.getByLabelText(/username/i), 'evi');
    await user.type(screen.getByLabelText(/password/i), 'wrong');
    await user.click(screen.getByRole('button', { name: /login/i }));

    expect(await screen.findByText(/invalid credentials/i)).toBeInTheDocument();
  });
});
