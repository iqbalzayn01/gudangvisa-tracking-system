import { AuthInternalRepository } from './auth-internal.repository.js';
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
import type { StaffJwtPayload } from '../../types/index.js';

export class AuthInternalService {
  private repository = new AuthInternalRepository();

  async login(email: string, password: string) {
    const staff = await this.repository.findByEmail(email);
    if (!staff) {
      // Burn the same bcrypt cost as a real compare so unknown emails are
      // indistinguishable from wrong passwords (no user enumeration by timing).
      await compareAgainstDummyHash(password);
      throw new AppError(401, 'Invalid credentials.');
    }

    const isValid = await verifyPassword(password, staff.passwordHash);
    if (!isValid) throw new AppError(401, 'Invalid credentials.');

    // Only disclosed after the password verified — not to anonymous probes.
    if (!staff.isActive) {
      throw new AppError(403, 'Account is deactivated. Contact administrator.');
    }

    const payload: StaffJwtPayload = {
      id: staff.id,
      fullName: staff.fullName,
      email: staff.email,
      role: staff.role,
      accountType: 'internal',
    };

    const [accessToken, refreshToken] = await Promise.all([
      generateAccessToken(payload),
      generateRefreshToken(payload),
    ]);

    return {
      user: {
        id: staff.id,
        fullName: staff.fullName,
        email: staff.email,
        role: staff.role,
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

      if (decoded.accountType !== 'internal') {
        throw new AppError(403, 'Invalid token type for this endpoint.');
      }

      const staff = await this.repository.findById(decoded.id);
      if (!staff || !staff.isActive) {
        throw new AppError(401, 'Account not found or deactivated.');
      }

      const payload: StaffJwtPayload = {
        id: staff.id,
        fullName: staff.fullName,
        email: staff.email,
        role: staff.role,
        accountType: 'internal',
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
