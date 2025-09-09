import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  name!: string;
}

export class ProjectIdParam {
  @IsString()
  id!: string;
}
