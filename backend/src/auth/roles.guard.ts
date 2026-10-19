import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { ROLE_HEADER, ROLES_KEY, type Role } from './roles.js';

/**
 * Trusts the role sent in the X-User-Role header. This stands in for real
 * authentication (SSO + JWT claims) and must not be used as-is in production.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required?.length) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const role = request.header(ROLE_HEADER)?.toUpperCase();

    if (!role || !required.includes(role as Role)) {
      throw new ForbiddenException(
        `This action requires one of these roles: ${required.join(', ')}`,
      );
    }
    return true;
  }
}
