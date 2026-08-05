import { Body, Controller, Get, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { AuthService } from "@/modules/auth/auth.service";
import { RegisterDto } from "@/modules/auth/dto/register.dto";
import { LoginDto } from "@/modules/auth/dto/login.dto";
import { RefreshDto } from "@/modules/auth/dto/refresh.dto";
import { Public } from "@/modules/auth/decorators/public.decorator";
import { CurrentUser } from "@/modules/auth/decorators/current-user.decorator";
import { AuthenticatedUser } from "@/modules/auth/types/jwt-payload.type";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post("register")
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post("login")
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post("refresh")
  refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @HttpCode(HttpStatus.OK)
  @Post("logout")
  async logout(@CurrentUser() user: AuthenticatedUser) {
    await this.authService.logout(user.userId);
    return { loggedOut: true };
  }

  @Get("me")
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getProfile(user.userId);
  }
}
