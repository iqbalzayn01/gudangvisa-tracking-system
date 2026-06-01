import bcrypt from 'bcryptjs';
import { AuthClientRepository } from './auth-client.repository.js';
import { AppError } from '../../utils/AppError.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../../utils/jwt.js';
import type { ClientJwtPayload } from '../../types/index.js';

export class AuthClientService {
  private repository = new AuthClientRepository();

  async login(email: string, password: string) {
    const client = await this.repository.findByEmail(email);
    if (!client) throw new AppError(401, 'Invalid credentials.');

    if (!client.isActive) {
      throw new AppError(403, 'Account is deactivated. Contact support.');
    }

    const isValid = await bcrypt.compare(password, client.passwordHash);
    if (!isValid) throw new AppError(401, 'Invalid credentials.');

    const payload: ClientJwtPayload = {
      id: client.id,
      fullName: client.fullName,
      email: client.email,
      accountType: 'client',
    };

    const [accessToken, refreshToken] = await Promise.all([
      generateAccessToken(payload),
      generateRefreshToken(payload),
    ]);

    return {
      user: {
        id: client.id,
        fullName: client.fullName,
        email: client.email,
      },
      accessToken,
      refreshToken,
    };
  }

  async refreshAccessToken(refreshToken: string | undefined) {
    if (!refreshToken) {
      throw new AppError(401, 'Refresh token not found. Please log in again.');
    }

    try {
      const decoded = await verifyRefreshToken(refreshToken);

      if (decoded.accountType !== 'client') {
        throw new AppError(403, 'Invalid token type for this endpoint.');
      }

      const client = await this.repository.findById(decoded.id);
      if (!client || !client.isActive) {
        throw new AppError(401, 'Account not found or deactivated.');
      }

      const payload: ClientJwtPayload = {
        id: client.id,
        fullName: client.fullName,
        email: client.email,
        accountType: 'client',
      };

      const accessToken = await generateAccessToken(payload);
      return { accessToken };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        401,
        'Invalid or expired refresh token. Please log in again.',
      );
    }
  }
}
