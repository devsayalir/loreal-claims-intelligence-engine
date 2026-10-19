import {
  Body,
  Controller,
  Get,
  Param,
  ParseEnumPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Roles } from '../auth/roles.js';
import { ClaimStatus } from '../generated/prisma/client.js';
import { ClaimsService } from './claims.service.js';
import { AttachEvidenceDto } from './dto/attach-evidence.dto.js';
import { CreateClaimDto } from './dto/create-claim.dto.js';
import { ReviewClaimDto } from './dto/review-claim.dto.js';
import { SubmitFormulaDto } from './dto/submit-formula.dto.js';

@Controller('claims')
export class ClaimsController {
  constructor(private readonly claims: ClaimsService) {}

  @Post()
  @Roles('BUSINESS')
  create(@Body() dto: CreateClaimDto) {
    return this.claims.create(dto);
  }

  @Get()
  findAll(
    @Query('status', new ParseEnumPipe(ClaimStatus, { optional: true }))
    status?: ClaimStatus,
  ) {
    return this.claims.findAll(status);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.claims.findOne(id);
  }

  @Patch(':id/review')
  @Roles('CLAIM_MANAGER')
  review(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ReviewClaimDto) {
    return this.claims.review(id, dto);
  }

  @Patch(':id/formula')
  @Roles('SCIENTIST')
  submitFormula(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SubmitFormulaDto,
  ) {
    return this.claims.submitFormula(id, dto);
  }

  @Patch(':id/evidence')
  @Roles('EVALUATOR')
  attachEvidence(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AttachEvidenceDto,
  ) {
    return this.claims.attachEvidence(id, dto);
  }
}
