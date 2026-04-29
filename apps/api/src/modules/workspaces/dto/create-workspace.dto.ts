import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export enum FashionSegment {
  casual = 'casual',
  festa = 'festa',
  fitness = 'fitness',
  infantil = 'infantil',
  executivo = 'executivo',
  praia = 'praia',
  noivas = 'noivas',
  plus_size = 'plus_size',
}

export class CreateWorkspaceDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug deve conter apenas letras minúsculas, números e hífens',
  })
  @MaxLength(100)
  slug: string;

  @IsEnum(FashionSegment)
  @IsOptional()
  segment?: FashionSegment;

  @IsString()
  @IsOptional()
  logoUrl?: string;
}
