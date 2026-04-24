import { IsOptional, IsString } from 'class-validator';

export class MarkAsReadDto {
  @IsString()
  conversationId!: string;

  @IsOptional()
  @IsString()
  lastMessageId?: string;
}
