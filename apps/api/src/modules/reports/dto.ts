import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateReportDto {
  @IsString()
  @IsNotEmpty()
  projectId!: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  // content は Json として受ける（DTOでは any）
  content!: any;

  @IsOptional()
  metadata?: any;
}

export class UpdateReportDto {
  @IsOptional()
  @IsString()
  title?: string;
  @IsOptional()
  content?: any;

  @IsOptional()
  metadata?: any;
}

export class PaginationQuery {
  @IsOptional()
  @IsInt()
  take?: number;
  @IsOptional()
  @IsString()
  cursor?: string;
}
