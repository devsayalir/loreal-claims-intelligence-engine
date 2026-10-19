import { SetMetadata } from '@nestjs/common';

export const ROLES = [
  'BUSINESS',
  'CLAIM_MANAGER',
  'SCIENTIST',
  'EVALUATOR',
] as const;

export type Role = (typeof ROLES)[number];

export const ROLE_HEADER = 'x-user-role';
export const ROLES_KEY = 'roles';

export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
