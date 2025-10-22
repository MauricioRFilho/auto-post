import { IsString, IsUUID, IsObject, IsIn, IsOptional } from 'class-validator';

export class N8nStatusDto {
  @IsUUID()
  postJobId: string;

  @IsString()
  @IsIn(['instagram', 'pinterest', 'whatsapp', 'system'])
  channel: string;

  @IsString()
  @IsIn(['start', 'caption_ready', 'image_ready', 'posted', 'error'])
  stage: string;

  @IsString()
  @IsIn(['running', 'success', 'error'])
  status: string;

  @IsObject()
  @IsOptional()
  detail?: Record<string, any>;

  @IsString()
  @IsOptional()
  signature?: string;
}
