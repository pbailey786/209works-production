import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import { Session } from 'next-auth';

// Mock session for testing
export const mockSession = {
  user: {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    role: 'USER',
  },
  expires: '2024-12-31',
} as Session & { user: { id: string; role: string } };

// Mock admin session
export const mockAdminSession = {
  user: {
    id: '1',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'ADMIN',
  },
  expires: '2024-12-31',
} as Session & { user: { id: string; role: string } };

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  session?: Session | null;
  initialProps?: any;
}

const AllTheProviders = ({
  children,
  session = null,
}: {
  children: React.ReactNode;
  session?: Session | null;
}) => {
  return <SessionProvider session={session}>{children}</SessionProvider>;
};

export const renderWithProviders = (
  ui: ReactElement,
  { session = null, ...renderOptions }: CustomRenderOptions = {}
) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <AllTheProviders session={session}>{children}</AllTheProviders>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Re-export everything from React Testing Library
export * from '@testing-library/react';
export { renderWithProviders as render };
