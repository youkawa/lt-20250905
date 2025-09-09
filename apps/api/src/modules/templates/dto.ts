import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateTemplateDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsInt()
  version!: number;

  // Json content (template metadata or structure reference)
  content!: any;
}

export class UpdateTemplateDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsInt()
  version?: number;

  @IsOptional()
  content?: any;
}

export class UploadTemplateDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsInt()
  version!: number;
}

export class SetDefaultDto {
  // 空ならグローバル既定
  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsString()
  titlePattern?: string; // 正規表現 or 部分一致パターン
}
