// src/types/index.ts

/**
 * Standard API Response Structure.
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

/**
 * JWT Payload for Internal Staff/Admin accounts.
 */
export interface StaffJwtPayload {
  id: string;
  fullName: string;
  email: string;
  role: 'admin' | 'staff';
  accountType: 'internal';
}

/**
 * Union type for all JWT payloads.
 */
export type JwtPayloadData = StaffJwtPayload;

/**
 * Checklist item stored in JSONB column of applications table.
 */
export interface ChecklistItem {
  name: string;
  isChecked: boolean;
  checkedAt?: string | undefined;
  checkedByStaffId?: string | undefined;
}
