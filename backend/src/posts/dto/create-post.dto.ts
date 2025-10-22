import { IsString, IsUUID, IsObject, IsOptional } from 'class-validator';

export class CreatePostDto {
  @IsUUID()
  productId: string;

  @IsObject()
  channels: {
    instagram?: boolean;
    pinterest?: boolean;
    whatsapp?: boolean;
  };

  @IsObject()
  @IsOptional()
  context?: Record<string, any>;
}
