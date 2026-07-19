// src/types/express/index.d.ts

import type { StaffJwtPayload } from '../index.ts';

declare global {
  namespace Express {
    export interface Request {
      /** Populated by requireStaffAuth middleware */
      staffUser?: StaffJwtPayload;
    }
  }
}

export {};
