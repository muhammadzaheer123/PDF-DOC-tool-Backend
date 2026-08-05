import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY } from "@/modules/auth/decorators/roles.decorator";
import { UserRole } from "@/modules/auth/schemas/user.schema";
import { AuthenticatedUser } from "@/modules/auth/types/jwt-payload.type";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser | undefined;

    if (!user || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException("You do not have permission to access this resource.");
    }

    return true;
  }
}
