import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcrypt";
import type { SignOptions } from "jsonwebtoken";
import { User, UserDocument } from "@/modules/auth/schemas/user.schema";
import { RegisterDto } from "@/modules/auth/dto/register.dto";
import { LoginDto } from "@/modules/auth/dto/login.dto";
import { JwtPayload } from "@/modules/auth/types/jwt-payload.type";
import { AppConfig } from "@/config/configuration";

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    role: string;
  };
}

const GENERIC_LOGIN_ERROR = "Invalid email or password.";

@Injectable()
export class AuthService {
  private readonly authConfig: AppConfig["auth"];

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {
    this.authConfig = this.configService.get<AppConfig["auth"]>("auth")!;
  }

  async register(dto: RegisterDto): Promise<AuthResult> {
    const existing = await this.userModel.findOne({ email: dto.email.toLowerCase() }).lean();
    if (existing) {
      throw new ConflictException("An account with this email already exists.");
    }

    const passwordHash = await bcrypt.hash(dto.password, this.authConfig.bcryptSaltRounds);

    const user = await this.userModel.create({
      fullName: dto.fullName,
      email: dto.email.toLowerCase(),
      passwordHash,
      role: "user",
    });

    return this.issueTokens(user.id, user.email, user.role, user.fullName);
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await this.userModel
      .findOne({ email: dto.email.toLowerCase() })
      .select("+passwordHash")
      .exec();

    if (!user) {
      throw new UnauthorizedException(GENERIC_LOGIN_ERROR);
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException(GENERIC_LOGIN_ERROR);
    }

    user.lastLoginAt = new Date();
    await user.save();

    return this.issueTokens(user.id, user.email, user.role, user.fullName);
  }

  async refresh(refreshToken: string): Promise<AuthResult> {
    let payload: JwtPayload;

    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.authConfig.jwtRefreshSecret,
      });
    } catch {
      throw new UnauthorizedException("Refresh token is invalid or expired.");
    }

    const user = await this.userModel.findById(payload.sub).select("+refreshTokenHash").exec();

    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException("Refresh token is invalid or expired.");
    }

    const matches = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!matches) {
      user.refreshTokenHash = undefined;
      await user.save();
      throw new UnauthorizedException("Refresh token is invalid or expired.");
    }

    return this.issueTokens(user.id, user.email, user.role, user.fullName);
  }

  async logout(userId: string): Promise<void> {
    await this.userModel.updateOne({ _id: userId }, { $unset: { refreshTokenHash: "" } });
  }

  async getProfile(userId: string) {
    const user = await this.userModel.findById(userId).lean();
    if (!user) {
      throw new UnauthorizedException("User not found.");
    }
    return {
      id: user._id.toString(),
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      lastLoginAt: user.lastLoginAt ?? null,
    };
  }

  private async issueTokens(
    userId: string,
    email: string,
    role: string,
    fullName: string
  ): Promise<AuthResult> {
    const payload: JwtPayload = { sub: userId, email, role: role as "user" | "admin" };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.authConfig.jwtAccessSecret,
      expiresIn: this.authConfig.accessTokenExpiresIn as SignOptions["expiresIn"],
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.authConfig.jwtRefreshSecret,
      expiresIn: this.authConfig.refreshTokenExpiresIn as SignOptions["expiresIn"],
    });

    const refreshTokenHash = await bcrypt.hash(refreshToken, this.authConfig.bcryptSaltRounds);
    await this.userModel.updateOne({ _id: userId }, { refreshTokenHash });

    return {
      accessToken,
      refreshToken,
      user: { id: userId, fullName, email, role },
    };
  }
}
