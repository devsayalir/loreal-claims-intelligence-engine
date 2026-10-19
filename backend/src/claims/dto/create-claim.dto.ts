import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ClaimType } from '../../generated/prisma/client.js';

export class CreateClaimDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  productName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  claimText: string;

  @IsEnum(ClaimType)
  claimType: ClaimType;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  proposedBy?: string;
}
