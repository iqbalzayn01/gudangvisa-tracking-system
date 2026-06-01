// src/types/express/index.d.ts

import type { StaffJwtPayload, ClientJwtPayload } from '../index.js';

declare global {
  namespace Express {
    export interface Request {
      /** Populated by requireStaffAuth middleware */
      staffUser?: StaffJwtPayload;
      /** Populated by requireClientAuth middleware */
      clientUser?: ClientJwtPayload;
    }
  }
}

export {};
