import { MessageType } from '@prisma/client';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class MessageAttachmentDto {
  @IsString()
  fileName!: string;

  @IsString()
  fileUrl!: string;

  @IsInt()
  @Min(1)
  @Max(10 * 1024 * 1024)
  fileSize!: number;

  @IsString()
  mimeType!: string;
}

export class SendMessageDto {
  @IsString()
  conversationId!: string;

  @IsEnum(MessageType)
  type!: MessageType;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MessageAttachmentDto)
  attachments?: MessageAttachmentDto[];
}
