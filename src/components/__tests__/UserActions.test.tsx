/**
 * Тесты для компонента UserActions
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { useAuth } from '@/hooks/useAuth';
import UserActions from '../UserActions';

// Mock useAuth hook
jest.mock('@/hooks/useAuth');
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock NotificationIcon
jest.mock('../admin/NotificationIcon', () => {
  return function NotificationIcon() {
    return <div data-testid="notification-icon">Notifications</div>;
  };
});

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('UserActions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('должен показывать загрузку до монтирования', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      mounted: false,
      refreshUser: jest.fn(),
    });

    render(<UserActions />);
    
    expect(screen.getByRole('generic')).toHaveClass('animate-pulse');
  });

  it('должен показывать загрузку при загрузке данных', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: true,
      mounted: true,
      refreshUser: jest.fn(),
    });

    render(<UserActions />);
    
    expect(screen.getByRole('generic')).toHaveClass('animate-pulse');
  });

  it('должен показывать кнопки входа/регистрации для неавторизованных', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      mounted: true,
      refreshUser: jest.fn(),
    });

    render(<UserActions />);
    
    expect(screen.getByText('Войти')).toBeInTheDocument();
    expect(screen.getByText('Регистрация')).toBeInTheDocument();
  });

  it('должен корректно отображать аватар для пользователя с именем', () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'USER',
        status: 'APPROVED',
        isBlocked: false,
      },
      loading: false,
      mounted: true,
      refreshUser: jest.fn(),
    });

    render(<UserActions />);
    
    expect(screen.getByText('J')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('должен корректно обрабатывать пользователя с пустым именем', () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: '1',
        name: '',
        email: 'john@example.com',
        role: 'USER',
        status: 'APPROVED',
        isBlocked: false,
      },
      loading: false,
      mounted: true,
      refreshUser: jest.fn(),
    });

    render(<UserActions />);
    
    expect(screen.getByText('?')).toBeInTheDocument();
    expect(screen.getByText('Пользователь')).toBeInTheDocument();
  });

  it('должен корректно обрабатывать пользователя с именем из пробелов', () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: '1',
        name: '   ',
        email: 'john@example.com',
        role: 'USER',
        status: 'APPROVED',
        isBlocked: false,
      },
      loading: false,
      mounted: true,
      refreshUser: jest.fn(),
    });

    render(<UserActions />);
    
    expect(screen.getByText('?')).toBeInTheDocument();
    expect(screen.getByText('Пользователь')).toBeInTheDocument();
  });

  it('должен показывать админ панель для администраторов', () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: '1',
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'ADMIN',
        status: 'APPROVED',
        isBlocked: false,
      },
      loading: false,
      mounted: true,
      refreshUser: jest.fn(),
    });

    render(<UserActions />);
    
    expect(screen.getByTitle('Админ панель')).toBeInTheDocument();
  });

  it('должен корректно обрабатывать кириллические имена', () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: '1',
        name: 'Иван Иванов',
        email: 'ivan@example.com',
        role: 'USER',
        status: 'APPROVED',
        isBlocked: false,
      },
      loading: false,
      mounted: true,
      refreshUser: jest.fn(),
    });

    render(<UserActions />);
    
    expect(screen.getByText('И')).toBeInTheDocument();
    expect(screen.getByText('Иван Иванов')).toBeInTheDocument();
  });
});
