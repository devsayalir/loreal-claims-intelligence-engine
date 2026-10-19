import { Type } from 'class-transformer';
import { IsOptional, IsUUID, ValidateNested } from 'class-validator';
import { AttachEvidenceDto } from '../../claims/dto/attach-evidence.dto.js';
import { CreateClaimDto } from '../../claims/dto/create-claim.dto.js';

/**
 * Either `claimId` for a claim that went through the workflow, or an inline
 * `claim` + `evidence` pair for a one-off assessment.
 */
export class AssessClaimDto {
  @IsOptional()
  @IsUUID()
  claimId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateClaimDto)
  claim?: CreateClaimDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => AttachEvidenceDto)
  evidence?: AttachEvidenceDto;
}
