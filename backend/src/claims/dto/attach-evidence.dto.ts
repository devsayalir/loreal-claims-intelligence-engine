import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class AttachEvidenceDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  studyDesign: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100000)
  sampleSize?: number;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  studyDuration?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  evidenceText: string;
}
