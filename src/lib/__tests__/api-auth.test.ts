/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { authenticateApiRequest, requireAdminAuth, requireAuth } from '../api-auth';

// Mock dependencies
jest.mock('../prisma', () => ({
  prisma: {
    users: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(),
  })),
}));

const { prisma } = require('../prisma');
const { cookies } = require('next/headers');

describe('API Auth', () => {
  const mockCookies = {
    get: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    cookies.mockReturnValue(mockCookies);
  });

  describe('authenticateApiRequest', () => {
    it('returns error when no token is provided', async () => {
      mockCookies.get.mockReturnValue(undefined);
      
      const request = new NextRequest('http://localhost/api/test');
      const result = await authenticateApiRequest(request);
      
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error.status).toBe(401);
      }
    });

    it('returns error when token is invalid', async () => {
      mockCookies.get.mockReturnValue({ value: 'invalid-token' });
      
      const request = new NextRequest('http://localhost/api/test');
      const result = await authenticateApiRequest(request);
      
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error.status).toBe(401);
      }
    });

    it('returns error when user is not found', async () => {
      const token = jwt.sign(
        { userId: 'user123', email: 'test@example.com', role: 'USER' },
        'test-jwt-secret'
      );
      mockCookies.get.mockReturnValue({ value: token });
      prisma.users.findUnique.mockResolvedValue(null);
      
      const request = new NextRequest('http://localhost/api/test');
      const result = await authenticateApiRequest(request);
      
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error.status).toBe(404);
      }
    });

    it('returns error when user is blocked', async () => {
      const token = jwt.sign(
        { userId: 'user123', email: 'test@example.com', role: 'USER' },
        'test-jwt-secret'
      );
      mockCookies.get.mockReturnValue({ value: token });
      prisma.users.findUnique.mockResolvedValue({
        id: 'user123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER',
        isBlocked: true,
        status: 'APPROVED',
      });
      
      const request = new NextRequest('http://localhost/api/test');
      const result = await authenticateApiRequest(request);
      
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error.status).toBe(403);
      }
    });

    it('returns error when user status is PENDING', async () => {
      const token = jwt.sign(
        { userId: 'user123', email: 'test@example.com', role: 'USER' },
        'test-jwt-secret'
      );
      mockCookies.get.mockReturnValue({ value: token });
      prisma.users.findUnique.mockResolvedValue({
        id: 'user123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER',
        isBlocked: false,
        status: 'PENDING',
      });
      
      const request = new NextRequest('http://localhost/api/test');
      const result = await authenticateApiRequest(request);
      
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error.status).toBe(403);
      }
    });

    it('returns error when user role is not allowed', async () => {
      const token = jwt.sign(
        { userId: 'user123', email: 'test@example.com', role: 'USER' },
        'test-jwt-secret'
      );
      mockCookies.get.mockReturnValue({ value: token });
      prisma.users.findUnique.mockResolvedValue({
        id: 'user123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER',
        isBlocked: false,
        status: 'APPROVED',
      });
      
      const request = new NextRequest('http://localhost/api/test');
      const result = await authenticateApiRequest(request, ['ADMIN']);
      
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error.status).toBe(403);
      }
    });

    it('returns user data when authentication is successful', async () => {
      const token = jwt.sign(
        { userId: 'user123', email: 'test@example.com', role: 'USER' },
        'test-jwt-secret'
      );
      mockCookies.get.mockReturnValue({ value: token });
      prisma.users.findUnique.mockResolvedValue({
        id: 'user123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER',
        isBlocked: false,
        status: 'APPROVED',
      });
      
      const request = new NextRequest('http://localhost/api/test');
      const result = await authenticateApiRequest(request);
      
      expect('user' in result).toBe(true);
      if ('user' in result) {
        expect(result.user.userId).toBe('user123');
        expect(result.user.email).toBe('test@example.com');
        expect(result.user.role).toBe('USER');
        expect(result.user.name).toBe('Test User');
      }
    });
  });

  describe('requireAdminAuth', () => {
    it('allows admin users', async () => {
      const token = jwt.sign(
        { userId: 'admin123', email: 'admin@example.com', role: 'ADMIN' },
        'test-jwt-secret'
      );
      mockCookies.get.mockReturnValue({ value: token });
      prisma.users.findUnique.mockResolvedValue({
        id: 'admin123',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'ADMIN',
        isBlocked: false,
        status: 'APPROVED',
      });
      
      const request = new NextRequest('http://localhost/api/admin/test');
      const result = await requireAdminAuth(request);
      
      expect('user' in result).toBe(true);
      if ('user' in result) {
        expect(result.user.role).toBe('ADMIN');
      }
    });

    it('rejects non-admin users', async () => {
      const token = jwt.sign(
        { userId: 'user123', email: 'user@example.com', role: 'USER' },
        'test-jwt-secret'
      );
      mockCookies.get.mockReturnValue({ value: token });
      prisma.users.findUnique.mockResolvedValue({
        id: 'user123',
        email: 'user@example.com',
        name: 'Regular User',
        role: 'USER',
        isBlocked: false,
        status: 'APPROVED',
      });
      
      const request = new NextRequest('http://localhost/api/admin/test');
      const result = await requireAdminAuth(request);
      
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error.status).toBe(403);
      }
    });
  });

  describe('requireAuth', () => {
    it('allows any authenticated user', async () => {
      const token = jwt.sign(
        { userId: 'user123', email: 'user@example.com', role: 'USER' },
        'test-jwt-secret'
      );
      mockCookies.get.mockReturnValue({ value: token });
      prisma.users.findUnique.mockResolvedValue({
        id: 'user123',
        email: 'user@example.com',
        name: 'Regular User',
        role: 'USER',
        isBlocked: false,
        status: 'APPROVED',
      });
      
      const request = new NextRequest('http://localhost/api/user/test');
      const result = await requireAuth(request);
      
      expect('user' in result).toBe(true);
      if ('user' in result) {
        expect(result.user.userId).toBe('user123');
      }
    });
  });
});
