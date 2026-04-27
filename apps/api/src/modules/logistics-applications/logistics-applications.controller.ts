import {
  ArgumentsHost,
  BadRequestException,
  Body,
  Catch,
  Controller,
  ExceptionFilter,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Put,
  Req,
  Res,
  StreamableFile,
  UploadedFiles,
  UseFilters,
  UseGuards,
  UseInterceptors,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  LogisticsApplicationDocumentType,
  Role,
} from '@prisma/client';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { MulterError } from 'multer';
import { existsSync, mkdirSync, readFileSync } from 'fs';
import { extname, join } from 'path';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { ReviewLogisticsApplicationDto } from './dto/review-logistics-application.dto';
import { UpsertLogisticsApplicationContactFinanceDto } from './dto/upsert-logistics-application-contact-finance.dto';
import { UpsertLogisticsApplicationDocumentsDto } from './dto/upsert-logistics-application-documents.dto';
import { UpsertLogisticsApplicationDto } from './dto/upsert-logistics-application.dto';
import {
  logisticsApplicationDocumentFieldMap,
  LogisticsApplicationDocumentFieldName,
  LogisticsApplicationsService,
  UploadedLogisticsApplicationDocument,
} from './logistics-applications.service';

type AuthenticatedRequest = Request & {
  user: JwtPayload;
};

const LOGISTICS_DOCUMENT_UPLOAD_ROOT = join(
  process.cwd(),
  'uploads',
  'logistics-documents',
);
const MAX_DOCUMENT_SIZE_BYTES = 15 * 1024 * 1024;
const ALLOWED_DOCUMENT_MIME_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
]);
const DOCUMENT_UPLOAD_FIELD_NAMES = Object.keys(
  logisticsApplicationDocumentFieldMap,
) as LogisticsApplicationDocumentFieldName[];
const LOGISTICS_DOCUMENT_TYPES = Object.values(
  logisticsApplicationDocumentFieldMap,
);

@Catch(MulterError)
class LogisticsDocumentUploadExceptionFilter implements ExceptionFilter {
  catch(exception: MulterError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception.code === 'LIMIT_FILE_SIZE') {
      response.status(400).json({
        success: false,
        error: {
          code: 'FILE_TOO_LARGE',
          message: 'Yüklenen dosya 15 MB sınırını aşıyor.',
        },
      });
      return;
    }

    response.status(400).json({
      success: false,
      error: {
        code: exception.code,
        message: 'Belge yükleme sırasında bir hata oluştu.',
      },
    });
  }
}

const logisticsDocumentUploadFields = DOCUMENT_UPLOAD_FIELD_NAMES.map(
  (name) => ({
    name,
    maxCount: 1,
  }),
);

const sanitizeFilenamePart = (value: string): string =>
  value.replace(/[^a-zA-Z0-9._-]/g, '_');

const logisticsDocumentUploadOptions = {
  storage: diskStorage({
    destination: (
      req: Request,
      _file: { fieldname: string },
      cb: (error: Error | null, destination: string) => void,
    ) => {
      const userId = (req as AuthenticatedRequest).user?.sub;
      const destinationPath = userId
        ? join(LOGISTICS_DOCUMENT_UPLOAD_ROOT, userId)
        : LOGISTICS_DOCUMENT_UPLOAD_ROOT;

      mkdirSync(destinationPath, { recursive: true });
      cb(null, destinationPath);
    },
    filename: (
      _req: Request,
      file: { fieldname: string; originalname: string },
      cb: (error: Error | null, filename: string) => void,
    ) => {
      const extension = extname(file.originalname).toLowerCase();
      const originalBaseName = sanitizeFilenamePart(
        file.originalname.replace(extension, ''),
      );
      const nextFilename = `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1_000_000)}-${originalBaseName}${extension}`;
      cb(null, nextFilename);
    },
  }),
  limits: {
    fileSize: MAX_DOCUMENT_SIZE_BYTES,
  },
  fileFilter: (
    _req: Request,
    file: { mimetype: string },
    cb: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    if (!ALLOWED_DOCUMENT_MIME_TYPES.has(file.mimetype)) {
      cb(
        new BadRequestException(
          'Yalnızca PDF, PNG veya JPEG yükleyebilirsiniz.',
        ),
        false,
      );
      return;
    }

    cb(null, true);
  },
};

@Controller('logistics-applications')
@UseGuards(AuthGuard('jwt'))
export class LogisticsApplicationsController {
  constructor(
    private readonly logisticsApplicationsService: LogisticsApplicationsService,
  ) {}

  @Get('me')
  async getMyApplication(@Req() req: AuthenticatedRequest) {
    const data = await this.logisticsApplicationsService.findByUserId(
      req.user.sub,
    );

    return {
      success: true,
      data,
      message: 'Lojistik başvuru bilgileri başarıyla getirildi.',
    };
  }

  @Put('me')
  async upsertMyApplication(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpsertLogisticsApplicationDto,
  ) {
    const data = await this.logisticsApplicationsService.upsertForUser(
      req.user.sub,
      dto,
    );

    return {
      success: true,
      data,
      message: 'Lojistik başvuru bilgileri başarıyla kaydedildi.',
    };
  }

  @Put('me/contact-finance')
  async upsertMyContactFinance(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpsertLogisticsApplicationContactFinanceDto,
  ) {
    const data =
      await this.logisticsApplicationsService.upsertContactFinanceForUser(
        req.user.sub,
        dto,
      );

    return {
      success: true,
      data,
      message: 'İletişim ve finans bilgileri başarıyla kaydedildi.',
    };
  }

  @Put('me/documents')
  @UseFilters(LogisticsDocumentUploadExceptionFilter)
  @UseInterceptors(
    FileFieldsInterceptor(
      logisticsDocumentUploadFields,
      logisticsDocumentUploadOptions,
    ),
  )
  async upsertMyDocuments(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpsertLogisticsApplicationDocumentsDto,
    @UploadedFiles()
    files: Partial<
      Record<
        LogisticsApplicationDocumentFieldName,
        Array<{
          fieldname: string;
          originalname: string;
          mimetype: string;
          size: number;
          path: string;
        }>
      >
    >,
  ) {
    const uploadedDocuments = this.normalizeUploadedDocuments(files);

    const data = await this.logisticsApplicationsService.upsertDocumentsForUser(
      req.user.sub,
      dto,
      uploadedDocuments,
    );

    return {
      success: true,
      data,
      message: 'Belge yükleme ve onay bilgileri başarıyla kaydedildi.',
    };
  }

  @Get('me/documents/:documentType')
  async downloadMyDocument(
    @Req() req: AuthenticatedRequest,
    @Param('documentType') documentType: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const normalizedType = this.parseDocumentType(documentType);
    const document =
      await this.logisticsApplicationsService.getMyDocumentByType(
        req.user.sub,
        normalizedType,
      );

    return this.streamDocument(document, response);
  }

  @Get('admin')
  async getForAdmin(@Req() req: AuthenticatedRequest) {
    this.ensureAdmin(req.user.role);

    const data = await this.logisticsApplicationsService.findManyForAdmin();

    return {
      success: true,
      data,
      message: 'Lojistik başvuru listesi başarıyla getirildi.',
    };
  }

  @Get('admin/:id')
  async getByIdForAdmin(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    this.ensureAdmin(req.user.role);

    const data = await this.logisticsApplicationsService.findByIdForAdmin(id);

    return {
      success: true,
      data,
      message: 'Lojistik başvuru detayı başarıyla getirildi.',
    };
  }

  @Put('admin/:id/review')
  async reviewByAdmin(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: ReviewLogisticsApplicationDto,
  ) {
    this.ensureAdmin(req.user.role);

    const data = await this.logisticsApplicationsService.reviewByAdmin(id, dto);

    return {
      success: true,
      data,
      message: 'Lojistik başvuru değerlendirmesi başarıyla kaydedildi.',
    };
  }

  @Get('admin/:id/documents/:documentType')
  async downloadAdminDocument(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Param('documentType') documentType: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    this.ensureAdmin(req.user.role);
    const normalizedType = this.parseDocumentType(documentType);
    const document =
      await this.logisticsApplicationsService.getAdminDocumentByType(
        id,
        normalizedType,
      );

    return this.streamDocument(document, response);
  }

  private normalizeUploadedDocuments(
    files: Partial<
      Record<
        LogisticsApplicationDocumentFieldName,
        Array<{
          fieldname: string;
          originalname: string;
          mimetype: string;
          size: number;
          path: string;
        }>
      >
    >,
  ): UploadedLogisticsApplicationDocument[] {
    const uploadedDocuments: UploadedLogisticsApplicationDocument[] = [];

    for (const fieldName of DOCUMENT_UPLOAD_FIELD_NAMES) {
      const file = files[fieldName]?.[0];
      if (!file) {
        continue;
      }

      uploadedDocuments.push({
        fieldName,
        originalName: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
        filePath: file.path,
      });
    }

    return uploadedDocuments;
  }

  private parseDocumentType(
    documentType: string,
  ): LogisticsApplicationDocumentType {
    const normalizedDocumentType = documentType.toUpperCase();
    if (
      !LOGISTICS_DOCUMENT_TYPES.includes(
        normalizedDocumentType as LogisticsApplicationDocumentType,
      )
    ) {
      throw new BadRequestException('Geçersiz belge türü.');
    }

    return normalizedDocumentType as LogisticsApplicationDocumentType;
  }

  private streamDocument(
    document: {
      originalName: string;
      mimeType: string;
      filePath: string;
    },
    response: Response,
  ): StreamableFile {
    const absolutePath =
      this.logisticsApplicationsService.resolveDocumentAbsolutePath(
        document.filePath,
      );

    if (!absolutePath) {
      throw new NotFoundException('Belge dosya yolu bulunamadı.');
    }

    if (!existsSync(absolutePath)) {
      throw new NotFoundException('Belge dosyası sunucuda bulunamadı.');
    }

    let fileBuffer: Buffer;
    try {
      fileBuffer = readFileSync(absolutePath);
    } catch (error: unknown) {
      const code =
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        typeof (error as { code?: unknown }).code === 'string'
          ? (error as { code: string }).code
          : null;

      if (code === 'ENOENT') {
        throw new NotFoundException('Belge dosyası sunucuda bulunamadı.');
      }

      if (code === 'EACCES' || code === 'EPERM') {
        throw new BadRequestException('Belge dosyasına erişilemiyor.');
      }

      throw new InternalServerErrorException(
        'Belge dosyası okunurken beklenmeyen bir hata oluştu.',
      );
    }

    const safeOriginalName =
      typeof document.originalName === 'string' &&
      document.originalName.trim().length > 0
        ? document.originalName.trim()
        : 'belge';

    let encodedFileName = 'belge';
    try {
      encodedFileName = encodeURIComponent(safeOriginalName);
    } catch {
      encodedFileName = 'belge';
    }

    response.setHeader('Content-Type', document.mimeType);
    response.setHeader(
      'Content-Disposition',
      `inline; filename="${encodedFileName}"; filename*=UTF-8''${encodedFileName}`,
    );

    return new StreamableFile(fileBuffer);
  }

  private ensureAdmin(role: Role): void {
    if (role !== Role.ADMIN) {
      throw new ForbiddenException('Bu işlem için admin yetkisi gereklidir.');
    }
  }
}
