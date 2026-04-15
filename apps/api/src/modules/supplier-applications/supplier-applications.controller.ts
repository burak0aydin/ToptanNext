import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Put,
  Req,
  Res,
  StreamableFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { createReadStream, mkdirSync } from 'fs';
import { extname, join } from 'path';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { ReviewSupplierApplicationDto } from './dto/review-supplier-application.dto';
import { UpsertSupplierApplicationContactFinanceDto } from './dto/upsert-supplier-application-contact-finance.dto';
import { UpsertSupplierApplicationDocumentsDto } from './dto/upsert-supplier-application-documents.dto';
import { UpsertSupplierApplicationDto } from './dto/upsert-supplier-application.dto';
import {
  supplierApplicationDocumentFieldMap,
  SupplierApplicationDocumentFieldName,
  SupplierApplicationsService,
  UploadedSupplierApplicationDocument,
} from './supplier-applications.service';

type AuthenticatedRequest = Request & {
  user: JwtPayload;
};

type SupplierApplicationDocumentType =
  | 'TAX_CERTIFICATE'
  | 'SIGNATURE_CIRCULAR'
  | 'TRADE_REGISTRY_GAZETTE'
  | 'ACTIVITY_CERTIFICATE';

const SUPPLIER_DOCUMENT_UPLOAD_ROOT = join(
  process.cwd(),
  'uploads',
  'supplier-documents',
);
const MAX_DOCUMENT_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_DOCUMENT_MIME_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
]);
const DOCUMENT_UPLOAD_FIELD_NAMES = Object.keys(
  supplierApplicationDocumentFieldMap,
) as SupplierApplicationDocumentFieldName[];
const SUPPLIER_DOCUMENT_TYPES = Object.values(
  supplierApplicationDocumentFieldMap,
);

const supplierDocumentUploadFields = DOCUMENT_UPLOAD_FIELD_NAMES.map(
  (name) => ({
    name,
    maxCount: 1,
  }),
);

const sanitizeFilenamePart = (value: string): string =>
  value.replace(/[^a-zA-Z0-9._-]/g, '_');

const supplierDocumentUploadOptions = {
  storage: diskStorage({
    destination: (
      req: Request,
      _file: { fieldname: string },
      cb: (error: Error | null, destination: string) => void,
    ) => {
      const userId = (req as AuthenticatedRequest).user?.sub;
      const destinationPath = userId
        ? join(SUPPLIER_DOCUMENT_UPLOAD_ROOT, userId)
        : SUPPLIER_DOCUMENT_UPLOAD_ROOT;

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

@Controller('supplier-applications')
@UseGuards(AuthGuard('jwt'))
export class SupplierApplicationsController {
  constructor(
    private readonly supplierApplicationsService: SupplierApplicationsService,
  ) {}

  @Get('me')
  async getMyApplication(@Req() req: AuthenticatedRequest) {
    const data = await this.supplierApplicationsService.findByUserId(
      req.user.sub,
    );

    return {
      success: true,
      data,
      message: 'Tedarikçi başvuru bilgileri başarıyla getirildi.',
    };
  }

  @Put('me')
  async upsertMyApplication(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpsertSupplierApplicationDto,
  ) {
    const data = await this.supplierApplicationsService.upsertForUser(
      req.user.sub,
      dto,
    );

    return {
      success: true,
      data,
      message: 'Tedarikçi başvuru bilgileri başarıyla kaydedildi.',
    };
  }

  @Put('me/contact-finance')
  async upsertMyContactFinance(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpsertSupplierApplicationContactFinanceDto,
  ) {
    const data =
      await this.supplierApplicationsService.upsertContactFinanceForUser(
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
  @UseInterceptors(
    FileFieldsInterceptor(
      supplierDocumentUploadFields,
      supplierDocumentUploadOptions,
    ),
  )
  async upsertMyDocuments(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpsertSupplierApplicationDocumentsDto,
    @UploadedFiles()
    files: Partial<
      Record<
        SupplierApplicationDocumentFieldName,
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

    const data = await this.supplierApplicationsService.upsertDocumentsForUser(
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
    const document = await this.supplierApplicationsService.getMyDocumentByType(
      req.user.sub,
      normalizedType,
    );

    return this.streamDocument(document, response);
  }

  @Get('admin')
  async getForAdmin(@Req() req: AuthenticatedRequest) {
    this.ensureAdmin(req.user.role);

    const data = await this.supplierApplicationsService.findManyForAdmin();

    return {
      success: true,
      data,
      message: 'Tedarikçi başvuru listesi başarıyla getirildi.',
    };
  }

  @Get('admin/:id')
  async getByIdForAdmin(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    this.ensureAdmin(req.user.role);

    const data = await this.supplierApplicationsService.findByIdForAdmin(id);

    return {
      success: true,
      data,
      message: 'Tedarikçi başvuru detayı başarıyla getirildi.',
    };
  }

  @Put('admin/:id/review')
  async reviewByAdmin(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: ReviewSupplierApplicationDto,
  ) {
    this.ensureAdmin(req.user.role);

    const data = await this.supplierApplicationsService.reviewByAdmin(id, dto);

    return {
      success: true,
      data,
      message: 'Tedarikçi başvuru değerlendirmesi başarıyla kaydedildi.',
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
      await this.supplierApplicationsService.getAdminDocumentByType(
        id,
        normalizedType,
      );

    return this.streamDocument(document, response);
  }

  private normalizeUploadedDocuments(
    files: Partial<
      Record<
        SupplierApplicationDocumentFieldName,
        Array<{
          fieldname: string;
          originalname: string;
          mimetype: string;
          size: number;
          path: string;
        }>
      >
    >,
  ): UploadedSupplierApplicationDocument[] {
    const uploadedDocuments: UploadedSupplierApplicationDocument[] = [];

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
  ): SupplierApplicationDocumentType {
    const normalizedDocumentType = documentType.toUpperCase();
    if (
      !SUPPLIER_DOCUMENT_TYPES.includes(
        normalizedDocumentType as SupplierApplicationDocumentType,
      )
    ) {
      throw new BadRequestException('Geçersiz belge türü.');
    }

    return normalizedDocumentType as SupplierApplicationDocumentType;
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
      this.supplierApplicationsService.resolveDocumentAbsolutePath(
        document.filePath,
      );
    const fileStream = createReadStream(absolutePath);

    response.setHeader('Content-Type', document.mimeType);
    response.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(document.originalName)}"`,
    );

    return new StreamableFile(fileStream);
  }

  private ensureAdmin(role: Role): void {
    if (role !== Role.ADMIN) {
      throw new ForbiddenException('Bu işlem için admin yetkisi gereklidir.');
    }
  }
}
