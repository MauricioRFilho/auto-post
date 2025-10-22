import { IsString, IsUrl, IsObject, IsOptional } from 'class-validator';

export class CreateLinkDto {
  @IsUrl()
  url: string;

  @IsObject()
  @IsOptional()
  channels?: {
    instagram?: boolean;
    pinterest?: boolean;
    whatsapp?: boolean;
  };

  @IsObject()
  @IsOptional()
  context?: Record<string, any>;
}
