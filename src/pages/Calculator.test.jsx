import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../lib/AuthContext';
import Calculator from './Calculator';

vi.mock('../lib/apiClient', () => ({
  default: { post: vi.fn() },
}));
vi.mock('../components/ThemeToggleButton.jsx', () => ({
  default: () => null,
}));

import apiClient from '../lib/apiClient';

const renderCalculator = () => {
  localStorage.setItem('token', 'jwt-abc');
  localStorage.setItem('user', 'evi');

  return render(
    <MemoryRouter initialEntries={['/']}>
      <AuthProvider>
        <Calculator />
      </AuthProvider>
    </MemoryRouter>,
  );
};

describe('Calculator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders the display and digit/operator keys', () => {
    renderCalculator();

    expect(screen.getByRole('heading', { level: 4, name: '0' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '0' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '7' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '×' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '=' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '%' })).not.toBeInTheDocument();
  });

  it('disables equals while the expression is invalid', async () => {
    const user = userEvent.setup();
    renderCalculator();
    const equals = screen.getByRole('button', { name: '=' });

    expect(equals).toBeDisabled();

    await user.click(screen.getByRole('button', { name: '1' }));
    await user.click(screen.getByRole('button', { name: '+' }));
    expect(equals).toBeDisabled();

    await user.click(screen.getByRole('button', { name: '2' }));
    expect(equals).toBeEnabled();
  });

  it('calls the API on equals and shows the result', async () => {
    const user = userEvent.setup();
    apiClient.post.mockImplementation((url) => Promise.resolve({
      data: url === '/api/calculations'
        ? { id: 1, expression: '1+2', result: 3, createdAt: '2026-05-06T00:00:00Z', username: 'evi' }
        : { result: 3 },
    }));
    renderCalculator();

    await user.click(screen.getByRole('button', { name: '1' }));
    await user.click(screen.getByRole('button', { name: '+' }));
    await user.click(screen.getByRole('button', { name: '2' }));
    await user.click(screen.getByRole('button', { name: '=' }));

    await waitFor(() => expect(apiClient.post).toHaveBeenCalledWith(
      '/api/calculations',
      { expression: '1+2' },
    ));
    expect(await screen.findByRole('heading', { level: 4, name: '3' })).toBeInTheDocument();
  });
});
