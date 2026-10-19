import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { Roles } from '../auth/roles.js';
import { AssessmentService } from './assessment.service.js';
import { AssessClaimDto } from './dto/assess-claim.dto.js';

@Controller('claims')
export class AssessmentController {
  constructor(private readonly assessments: AssessmentService) {}

  @Post('assess')
  @HttpCode(201)
  @Roles('EVALUATOR')
  assess(@Body() dto: AssessClaimDto) {
    return this.assessments.assess(dto);
  }

  @Get(':id/assessments')
  findForClaim(@Param('id', ParseUUIDPipe) id: string) {
    return this.assessments.findForClaim(id);
  }
}
