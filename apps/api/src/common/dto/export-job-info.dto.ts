import { ApiProperty } from '@nestjs/swagger';

export class ExportJobInfoDto {
  @ApiProperty({ example: 'abc123' })
  jobId!: string;

  @ApiProperty({ enum: ['queued', 'processing', 'completed', 'failed'] })
  status!: 'queued' | 'processing' | 'completed' | 'failed';

  @ApiProperty({ required: false, example: '/exports/abc123.pptx' })
  downloadUrl?: string;

  @ApiProperty({ required: false, example: 'WORKER_FAILED' })
  error?: string;

  @ApiProperty({ required: false, example: 'HTTP_500' })
  errorCode?: string;

  @ApiProperty({ required: false, type: Number, example: 75 })
  progress?: number;

  @ApiProperty({ required: false, type: Number, example: 1 })
  attemptsMade?: number;

  @ApiProperty({ required: false, type: Number, example: 3 })
  attemptsMax?: number;

  @ApiProperty({ required: false, type: String, example: '2025-09-13T12:00:00.000Z' })
  createdAt?: string;

  @ApiProperty({ required: false, type: String, example: '2025-09-13T12:00:01.000Z' })
  startedAt?: string;

  @ApiProperty({ required: false, type: String, example: '2025-09-13T12:00:05.000Z' })
  finishedAt?: string;

  @ApiProperty({ required: false, type: Number, example: 4200 })
  durationMs?: number;
}
