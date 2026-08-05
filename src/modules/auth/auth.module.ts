import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { User, UserSchema } from "@/modules/auth/schemas/user.schema";
import { AuthService } from "@/modules/auth/auth.service";
import { AuthController } from "@/modules/auth/auth.controller";
import { JwtStrategy } from "@/modules/auth/strategies/jwt.strategy";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    PassportModule,
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
