import { IsOptional, IsString, Length } from "class-validator";

export class AiFileOptionsDto {
  @IsOptional()
  @IsString()
  targetLanguage?: string;

  @IsOptional()
  @IsString()
  targetRole?: string;

  @IsOptional()
  @IsString()
  question?: string;
}

export class AiPromptDto {
  @IsString()
  @Length(1, 4000)
  prompt!: string;
}
