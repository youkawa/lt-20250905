import { ApiProperty } from '@nestjs/swagger';

export class ExportJobInfoDto {
  @ApiProperty({ example: 'abc123' })
  jobId!: string;

  @ApiProperty({ enum: ['queued', 'processing', 'completed', 'failed'] })
  status!: 'queued' | 'processing' | 'completed' | 'failed';

  @ApiProperty({ required: false })
  downloadUrl?: string;

  @ApiProperty({ required: false })
  error?: string;

  @ApiProperty({ required: false })
  errorCode?: string;

  @ApiProperty({ required: false, type: Number })
  progress?: number;

  @ApiProperty({ required: false, type: Number })
  attemptsMade?: number;

  @ApiProperty({ required: false, type: Number })
  attemptsMax?: number;

  @ApiProperty({ required: false, type: String })
  createdAt?: string;

  @ApiProperty({ required: false, type: String })
  startedAt?: string;

  @ApiProperty({ required: false, type: String })
  finishedAt?: string;

  @ApiProperty({ required: false, type: Number })
  durationMs?: number;
}

