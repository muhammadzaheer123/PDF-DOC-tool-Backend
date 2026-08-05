import { IsEmail, IsString, Length } from "class-validator";

export class RegisterDto {
  @IsString()
  @Length(2, 100)
  fullName!: string;

  @IsEmail()
  @Length(3, 254)
  email!: string;

  @IsString()
  @Length(8, 128)
  password!: string;
}
