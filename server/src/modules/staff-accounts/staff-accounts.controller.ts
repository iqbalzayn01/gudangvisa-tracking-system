import { StaffAccountsService } from './staff-accounts.service.js';
import {
  asyncHandler,
  sendSuccess,
  getStaffUser,
} from '../../utils/handler.js';
import { recordAudit } from '../../utils/audit.js';

export class StaffAccountsController {
  private service = new StaffAccountsService();

  getMe = asyncHandler(async (req, res) => {
    const staff = getStaffUser(req);
    sendSuccess(res, 200, 'Staff profile retrieved successfully.', {
      id: staff.id,
      fullName: staff.fullName,
      email: staff.email,
      role: staff.role,
    });
  });

  createStaff = asyncHandler(async (req, res) => {
    const newStaff = await this.service.createNewStaff(req.body);

    await recordAudit(req, {
      action: 'CREATE',
      entityType: 'staff',
      newValues: { email: req.body.email, role: req.body.role },
    });

    sendSuccess(res, 201, 'New staff member added successfully!', newStaff);
  });

  getAllStaff = asyncHandler(async (_req, res) => {
    const staffList = await this.service.getAllStaff();
    sendSuccess(res, 200, 'Staff list retrieved successfully.', staffList);
  });

  deleteStaff = asyncHandler<{ id: string }>(async (req, res) => {
    await this.service.removeStaff(req.params.id);

    await recordAudit(req, {
      action: 'DELETE',
      entityType: 'staff',
      oldValues: { staffId: req.params.id },
    });

    sendSuccess(res, 200, 'Staff member deleted successfully.');
  });
}
