import { AuthClientService } from './auth-client.service.js';
import {
  REFRESH_COOKIE_NAME,
  setRefreshCookie,
  clearRefreshCookie,
} from '../../utils/jwt.js';
import { asyncHandler, sendSuccess } from '../../utils/handler.js';
import { recordAudit } from '../../utils/audit.js';

export class AuthClientController {
  private service = new AuthClientService();

  login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const result = await this.service.login(email, password);

    // Client logins land in the audit trail too (staffId stays null).
    await recordAudit(req, {
      action: 'LOGIN',
      entityType: 'client',
      newValues: { clientId: result.user.id, email: result.user.email },
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
