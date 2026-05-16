import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { AuthRepository } from './auth.repository.js';
import { ENV } from '../../config/env.js';
import { JwtPayloadData } from '../../types/index.js';
import { AppError } from '../../utils/AppError.js';

export class AuthService {
  private repository = new AuthRepository();
  private secretKey = new TextEncoder().encode(ENV.JWT_SECRET);

  async login(email: string, pass: string) {
    const user = await this.repository.findByEmail(email);
    if (!user) throw new AppError(401, 'Invalid credentials');

    const isValid = await bcrypt.compare(pass, user.passwordHash);
    if (!isValid) throw new AppError(401, 'Invalid credentials');

    const payload: JwtPayloadData = {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    };

    const token = await new SignJWT({ ...payload })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('8h')
      .sign(this.secretKey);

    return {
      user: { fullName: user.fullName, role: user.role },
      token,
    };
  }
}
