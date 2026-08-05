import { IsString, Length } from "class-validator";

export class RefreshDto {
  @IsString()
  @Length(10, 2000)
  refreshToken!: string;
}
