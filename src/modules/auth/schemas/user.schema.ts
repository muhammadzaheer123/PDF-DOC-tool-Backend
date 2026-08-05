import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type UserRole = "user" | "admin";

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({
    type: String,
    required: true,
    trim: true,
  })
  fullName!: string;

  @Prop({
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  })
  email!: string;

  @Prop({
    type: String,
    required: true,
    select: false,
  })
  passwordHash!: string;

  @Prop({
    type: String,
    enum: ["user", "admin"],
    default: "user",
    required: true,
  })
  role!: UserRole;

  @Prop({
    type: String,
    required: false,
    select: false,
  })
  refreshTokenHash?: string;

  @Prop({
    type: Date,
    required: false,
  })
  lastLoginAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
