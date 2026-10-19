import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class ReviewClaimDto {
  @IsIn(['APPROVE', 'REJECT'])
  decision: 'APPROVE' | 'REJECT';

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}
