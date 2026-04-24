import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import { GetPresignedUrlDto } from './dto/get-presigned-url.dto';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

@Injectable()
export class UploadsService {
  constructor(private readonly configService: ConfigService) {}

  async getPresignedUrl(dto: GetPresignedUrlDto): Promise<{
    uploadUrl: string;
    fileUrl: string;
    objectKey: string;
    expiresIn: number;
  }> {
    this.validateInput(dto);

    const provider = this.configService.get<string>('UPLOAD_PROVIDER', 'minio').toLowerCase();
    const bucket = this.configService.get<string>(
      'UPLOAD_BUCKET',
      provider === 'minio' ? 'toptannext-uploads' : 'toptannext-uploads-prod',
    );
    const expiresIn = Number(this.configService.get<string>('UPLOAD_PRESIGNED_TTL_SECONDS', '900'));

    const objectKey = this.buildObjectKey(dto.fileName);
    const s3Client = this.createS3Client(provider);

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: objectKey,
      ContentType: dto.mimeType,
      ContentLength: dto.fileSize,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn });
    const fileUrl = this.resolvePublicFileUrl(provider, bucket, objectKey);

    return {
      uploadUrl,
      fileUrl,
      objectKey,
      expiresIn,
    };
  }

  private validateInput(dto: GetPresignedUrlDto): void {
    if (!ALLOWED_MIME_TYPES.has(dto.mimeType)) {
      throw new BadRequestException('Desteklenmeyen dosya türü.');
    }

    if (dto.fileSize > 10 * 1024 * 1024) {
      throw new BadRequestException('Dosya boyutu en fazla 10MB olabilir.');
    }
  }

  private buildObjectKey(fileName: string): string {
    const sanitized = fileName
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-zA-Z0-9._-]/g, '_');

    const datePrefix = new Date().toISOString().slice(0, 10);
    return `chat-attachments/${datePrefix}/${randomUUID()}-${sanitized}`;
  }

  private createS3Client(provider: string): S3Client {
    const region = this.configService.get<string>('AWS_REGION', 'eu-central-1');

    if (provider === 'minio') {
      const endpoint = this.configService.get<string>('MINIO_ENDPOINT', 'http://localhost:9000');
      const accessKeyId = this.configService.get<string>('MINIO_ACCESS_KEY', 'minioadmin');
      const secretAccessKey = this.configService.get<string>('MINIO_SECRET_KEY', 'minioadmin');

      return new S3Client({
        region,
        endpoint,
        forcePathStyle: true,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
    }

    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');

    if (!accessKeyId || !secretAccessKey) {
      throw new BadRequestException('AWS kimlik bilgileri eksik.');
    }

    return new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  private resolvePublicFileUrl(
    provider: string,
    bucket: string,
    objectKey: string,
  ): string {
    if (provider === 'minio') {
      const baseUrl = this.configService.get<string>(
        'MINIO_PUBLIC_BASE_URL',
        'http://localhost:9000',
      );

      return `${baseUrl.replace(/\/$/, '')}/${bucket}/${objectKey}`;
    }

    const publicBaseUrl = this.configService.get<string>('S3_PUBLIC_BASE_URL');
    if (publicBaseUrl) {
      return `${publicBaseUrl.replace(/\/$/, '')}/${objectKey}`;
    }

    const region = this.configService.get<string>('AWS_REGION', 'eu-central-1');
    return `https://${bucket}.s3.${region}.amazonaws.com/${objectKey}`;
  }
}
