import { AuthClientRepository } from './auth-client.repository.js';
import { AppError } from '../../utils/AppError.js';
import {
  verifyPassword,
  compareAgainstDummyHash,
} from '../../utils/password.js';
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
    if (!client) {
      // Burn the same bcrypt cost as a real compare so unknown emails are
      // indistinguishable from wrong passwords (no user enumeration by timing).
      await compareAgainstDummyHash(password);
      throw new AppError(401, 'Invalid credentials.');
    }

    const isValid = await verifyPassword(password, client.passwordHash);
    if (!isValid) throw new AppError(401, 'Invalid credentials.');

    // Only disclosed after the password verified — not to anonymous probes.
    if (!client.isActive) {
      throw new AppError(403, 'Account is deactivated. Contact support.');
    }

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

      // Rotate the refresh token on every use to shrink the replay window of
      // a stolen cookie.
      const [accessToken, newRefreshToken] = await Promise.all([
        generateAccessToken(payload),
        generateRefreshToken(payload),
      ]);

      return { accessToken, refreshToken: newRefreshToken };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        401,
        'Invalid or expired refresh token. Please log in again.',
      );
    }
  }
}
