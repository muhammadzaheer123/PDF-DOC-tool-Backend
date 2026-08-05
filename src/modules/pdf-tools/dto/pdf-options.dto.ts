import { IsIn, IsOptional, IsString, Length } from "class-validator";

export class PdfRotateOptionsDto {
  @IsOptional()
  @IsIn(["90", "180", "270", "-90"])
  degrees?: string = "90";
}

export class PdfPasswordOptionsDto {
  @IsString()
  @Length(1, 128)
  password!: string;
}
