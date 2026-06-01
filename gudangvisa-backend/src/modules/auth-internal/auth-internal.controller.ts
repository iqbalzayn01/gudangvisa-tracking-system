import { Request, Response, NextFunction } from 'express';
import { AuthInternalService } from './auth-internal.service.js';
import {
  REFRESH_COOKIE_NAME,
  REFRESH_COOKIE_OPTIONS,
} from '../../utils/jwt.js';

export class AuthInternalController {
  private service = new AuthInternalService();

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;
      const result = await this.service.login(email, password);

      // Set refresh token as HttpOnly cookie
      res.cookie(
        REFRESH_COOKIE_NAME,
        result.refreshToken,
        REFRESH_COOKIE_OPTIONS,
      );

      res.status(200).json({
        success: true,
        message: 'Login successful.',
        data: {
          user: result.user,
          accessToken: result.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  refresh = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME] as
        | string
        | undefined;
      const result = await this.service.refreshAccessToken(refreshToken);

      res.status(200).json({
        success: true,
        data: { accessToken: result.accessToken },
      });
    } catch (error) {
      next(error);
    }
  };

  logout = async (_req: Request, res: Response, _next: NextFunction) => {
    res.clearCookie(REFRESH_COOKIE_NAME, {
      httpOnly: true,
      secure: REFRESH_COOKIE_OPTIONS.secure,
      sameSite: REFRESH_COOKIE_OPTIONS.sameSite,
      path: REFRESH_COOKIE_OPTIONS.path,
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  };
}
