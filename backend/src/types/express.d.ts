import { JwtPayload } from 'jsonwebtoken';

import { JwtPayload } from 'jsonwebtoken';

interface UserPayload extends JwtPayload {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  activeInstitutionId: number | null;
}

declare namespace Express {
  export interface Request {
    user?: UserPayload;
  }
}