import { AuthInternalService } from './auth-internal.service.js';
import {
  REFRESH_COOKIE_NAME,
  setRefreshCookie,
  clearRefreshCookie,
} from '../../utils/jwt.js';
import { asyncHandler, sendSuccess } from '../../utils/handler.js';
import { recordAudit } from '../../utils/audit.js';

export class AuthInternalController {
  private service = new AuthInternalService();

  login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const result = await this.service.login(email, password);

    // Auth middleware hasn't run yet, so pass the actor id explicitly.
    await recordAudit(req, {
      action: 'LOGIN',
      entityType: 'staff',
      staffId: result.user.id,
      newValues: { email: result.user.email, role: result.user.role },
    });

    setRefreshCookie(res, result.refreshToken);
    sendSuccess(res, 200, 'Login successful.', {
      user: result.user,
      accessToken: result.accessToken,
    });
  });

  refresh = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME] as
      | string
      | undefined;
    const result = await this.service.refreshAccessToken(refreshToken);

    setRefreshCookie(res, result.refreshToken);
    sendSuccess(res, 200, 'Token refreshed.', {
      accessToken: result.accessToken,
    });
  });

  logout = asyncHandler(async (_req, res) => {
    clearRefreshCookie(res);
    sendSuccess(res, 200, 'Logged out successfully.');
  });
}
