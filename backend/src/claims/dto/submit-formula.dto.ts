import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SubmitFormulaDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  formulaReference: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  formulaDetails: string;
}
