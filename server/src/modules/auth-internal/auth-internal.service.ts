import bcrypt from 'bcryptjs';
import { AuthInternalRepository } from './auth-internal.repository.js';
import { AppError } from '../../utils/AppError.js';
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
    if (!staff) throw new AppError(401, 'Invalid credentials.');

    if (!staff.isActive) {
      throw new AppError(403, 'Account is deactivated. Contact administrator.');
    }

    const isValid = await bcrypt.compare(password, staff.passwordHash);
    if (!isValid) throw new AppError(401, 'Invalid credentials.');

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
