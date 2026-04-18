import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getSupabase } from '@/lib/supabase';
import { WaitlistForm } from '../WaitlistForm';

vi.mock('@/lib/supabase', () => {
  const insert = vi.fn(() => Promise.resolve({ error: null }));
  const from = vi.fn(() => ({ insert }));
  return {
    getSupabase: vi.fn(() => ({ from })),
  };
});

function mockInsertResolving(result: { error: unknown }) {
  const insert = vi.fn(() => Promise.resolve(result));
  const from = vi.fn(() => ({ insert }));
  vi.mocked(getSupabase).mockReturnValueOnce({ from } as never);
  return insert;
}

function mockInsertRejecting(err: unknown) {
  const insert = vi.fn(() => Promise.reject(err));
  const from = vi.fn(() => ({ insert }));
  vi.mocked(getSupabase).mockReturnValueOnce({ from } as never);
  return insert;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('WaitlistForm — validation', () => {
  it('shows an error when submitting an invalid email', async () => {
    const user = userEvent.setup();
    render(<WaitlistForm />);

    await user.type(screen.getByLabelText(/email/i), 'not-an-email');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: /lock me in/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/valid email/i);
  });

  it('shows an error when consent is not checked', async () => {
    const user = userEvent.setup();
    render(<WaitlistForm />);

    await user.type(screen.getByLabelText(/email/i), 'sigma@mogster.app');
    await user.click(screen.getByRole('button', { name: /lock me in/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/consent/i);
  });

  it('does not call Supabase when validation fails', async () => {
    const user = userEvent.setup();
    const insert = mockInsertResolving({ error: null });
    render(<WaitlistForm />);

    await user.type(screen.getByLabelText(/email/i), 'nope');
    await user.click(screen.getByRole('button', { name: /lock me in/i }));

    expect(insert).not.toHaveBeenCalled();
  });
});
