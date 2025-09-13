import { IsArray, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export type ReportContentItem = unknown;
export type ReportMetadata = Record<string, unknown>;

export class CreateReportDto {
  @IsString()
  @IsNotEmpty()
  projectId!: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  // content は Json として受ける
  @IsArray()
  content!: ReportContentItem[];

  @IsOptional()
  metadata?: ReportMetadata;
}

export class UpdateReportDto {
  @IsOptional()
  @IsString()
  title?: string;
  @IsOptional()
  @IsArray()
  content?: ReportContentItem[];

  @IsOptional()
  metadata?: ReportMetadata;
}

export class PaginationQuery {
  @IsOptional()
  @IsInt()
  take?: number;
  @IsOptional()
  @IsString()
  cursor?: string;
}
