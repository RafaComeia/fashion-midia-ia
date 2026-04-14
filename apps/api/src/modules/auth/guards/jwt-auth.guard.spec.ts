import { UnauthorizedException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from './jwt-auth.guard';

const mockJwtService = {
  verifyAsync: jest.fn(),
};

const createContext = (authHeader?: string): ExecutionContext =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({
        headers: { authorization: authHeader },
      }),
    }),
  }) as unknown as ExecutionContext;

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  beforeEach(() => {
    guard = new JwtAuthGuard(mockJwtService as unknown as JwtService);
    jest.clearAllMocks();
  });

  it('should allow access with valid token', async () => {
    mockJwtService.verifyAsync.mockResolvedValue({
      sub: 'user-1',
      email: 'test@test.com',
    });
    const result = await guard.canActivate(createContext('Bearer valid-token'));
    expect(result).toBe(true);
  });

  it('should throw UnauthorizedException when no token provided', async () => {
    await expect(guard.canActivate(createContext())).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should throw UnauthorizedException for non-Bearer token', async () => {
    await expect(
      guard.canActivate(createContext('Basic abc123')),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException when token verification fails', async () => {
    mockJwtService.verifyAsync.mockRejectedValue(new Error('invalid token'));
    await expect(
      guard.canActivate(createContext('Bearer bad-token')),
    ).rejects.toThrow(UnauthorizedException);
  });
});
