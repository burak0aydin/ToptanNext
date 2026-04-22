import {
  ArgumentsHost,
  BadRequestException,
  Body,
  Catch,
  Controller,
  Delete,
  ExceptionFilter,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  Res,
  StreamableFile,
  UploadedFiles,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '@prisma/client';
import { Request, Response } from 'express';
import { MulterError } from 'multer';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { createReadStream, existsSync, mkdirSync } from 'fs';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { CreateProductListingStepOneDto } from './dto/create-product-listing-step-one.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { ReviewProductListingDto } from './dto/review-product-listing.dto';
import { SubmitProductListingDto } from './dto/submit-product-listing.dto';
import { UpdateProductListingActiveStatusDto } from './dto/update-product-listing-active-status.dto';
import { UpdateProductListingStepThreeDto } from './dto/update-product-listing-step-three.dto';
import { UpdateProductListingStepTwoDto } from './dto/update-product-listing-step-two.dto';
import { ProductsService } from './products.service';
import { UploadedProductListingMedia } from './products.service';

type AuthenticatedRequest = Request & {
  user: JwtPayload;
};

const PRODUCT_MEDIA_UPLOAD_ROOT = join(
  process.cwd(),
  'uploads',
  'product-listings',
);
const PRODUCT_MEDIA_UPLOAD_FIELD = 'mediaFiles';
const MAX_MEDIA_FILE_SIZE_BYTES = 15 * 1024 * 1024;
const ALLOWED_MEDIA_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'video/mp4',
  'video/webm',
]);

@Catch(MulterError)
class ProductListingMediaUploadExceptionFilter implements ExceptionFilter {
  catch(exception: MulterError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse();

    if (exception.code === 'LIMIT_FILE_SIZE') {
      response.status(400).json({
        success: false,
        error: {
          code: 'FILE_TOO_LARGE',
          message: 'Yüklenen medya dosyası 15 MB sınırını aşıyor.',
        },
      });
      return;
    }

    response.status(400).json({
      success: false,
      error: {
        code: exception.code,
        message: 'Medya dosyası yüklenirken bir hata oluştu.',
      },
    });
  }
}

const sanitizeFilenamePart = (value: string): string =>
  value.replace(/[^a-zA-Z0-9._-]/g, '_');

const productMediaUploadOptions = {
  storage: diskStorage({
    destination: (
      req: Request,
      _file: { fieldname: string },
      cb: (error: Error | null, destination: string) => void,
    ) => {
      const userId = (req as AuthenticatedRequest).user?.sub;
      const destinationPath = userId
        ? join(PRODUCT_MEDIA_UPLOAD_ROOT, userId)
        : PRODUCT_MEDIA_UPLOAD_ROOT;

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
    fileSize: MAX_MEDIA_FILE_SIZE_BYTES,
  },
  fileFilter: (
    _req: Request,
    file: { mimetype: string },
    cb: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    if (!ALLOWED_MEDIA_MIME_TYPES.has(file.mimetype)) {
      cb(
        new BadRequestException(
          'Yalnızca JPG, PNG, WEBP, MP4 veya WEBM dosyaları yükleyebilirsiniz.',
        ),
        false,
      );
      return;
    }

    cb(null, true);
  },
};

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async getAll() {
    const data = await this.productsService.getAll();

    return {
      success: true,
      data,
      message: 'Ürün listesi başarıyla getirildi.',
    };
  }

  @Get('admin/listings')
  @UseGuards(AuthGuard('jwt'))
  async getAdminListings(
    @Req() req: AuthenticatedRequest,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('period') period?: string,
    @Query('categoryId') categoryId?: string,
    @Query('status') status?: string,
  ) {
    this.ensureAdmin(req.user.role);

    const numericPage = Number(page);
    const numericLimit = Number(limit);
    const data = await this.productsService.getAdminListingManagement(
      req.user.role,
      {
        page: Number.isFinite(numericPage) ? numericPage : 1,
        limit: Number.isFinite(numericLimit) ? numericLimit : 10,
        period: this.normalizeAdminGrowthPeriod(period),
        categoryId: categoryId?.trim() || undefined,
        status: this.normalizeAdminManagementStatus(status),
      },
    );

    return {
      success: true,
      data,
      message: 'Ürün başvuruları başarıyla getirildi.',
    };
  }

  @Patch('admin/listings/:id/review')
  @UseGuards(AuthGuard('jwt'))
  async reviewAdminListing(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: ReviewProductListingDto,
  ) {
    this.ensureAdmin(req.user.role);

    const data = await this.productsService.reviewListingByAdmin(
      req.user.role,
      id,
      dto,
    );

    return {
      success: true,
      data,
      message:
        dto.status === 'APPROVED'
          ? 'Ürün başvurusu onaylandı.'
          : 'Ürün başvurusu reddedildi.',
    };
  }

  @Get('admin/listings/:id')
  @UseGuards(AuthGuard('jwt'))
  async getAdminListingById(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    this.ensureAdmin(req.user.role);

    const data = await this.productsService.getListingByAdmin(req.user.role, id);

    return {
      success: true,
      data,
      message: 'Ürün başvuru detayı başarıyla getirildi.',
    };
  }

  @Put('admin/listings/:id/step-one')
  @UseGuards(AuthGuard('jwt'))
  async updateAdminListingStepOne(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: CreateProductListingStepOneDto,
  ) {
    this.ensureAdmin(req.user.role);

    const data = await this.productsService.updateListingStepOneByAdmin(
      req.user.role,
      id,
      dto,
    );

    return {
      success: true,
      data,
      message: 'Temel ürün bilgileri başarıyla güncellendi.',
    };
  }

  @Put('admin/listings/:id/step-two')
  @UseGuards(AuthGuard('jwt'))
  async updateAdminListingStepTwo(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateProductListingStepTwoDto,
  ) {
    this.ensureAdmin(req.user.role);

    const data = await this.productsService.updateListingStepTwoByAdmin(
      req.user.role,
      id,
      dto,
    );

    return {
      success: true,
      data,
      message: 'Fiyatlandırma ve stok bilgileri başarıyla güncellendi.',
    };
  }

  @Put('admin/listings/:id/step-three')
  @UseGuards(AuthGuard('jwt'))
  async updateAdminListingStepThree(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateProductListingStepThreeDto,
  ) {
    this.ensureAdmin(req.user.role);

    const data = await this.productsService.updateListingStepThreeByAdmin(
      req.user.role,
      id,
      dto,
    );

    return {
      success: true,
      data,
      message: 'Lojistik bilgileri başarıyla güncellendi.',
    };
  }

  @Get('media/:mediaId')
  async getListingMedia(
    @Param('mediaId') mediaId: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const media = await this.productsService.getListingMediaById(mediaId);

    if (!existsSync(media.filePath)) {
      throw new NotFoundException('Medya dosyası bulunamadı.');
    }

    response.setHeader('Content-Type', media.mimeType);
    response.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(media.originalName)}"`,
    );

    return new StreamableFile(createReadStream(media.filePath));
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async create(
    @Req() _req: AuthenticatedRequest,
    @Body() dto: CreateProductDto,
  ) {
    const data = await this.productsService.create(dto);

    return {
      success: true,
      data,
      message: 'Ürün başarıyla oluşturuldu.',
    };
  }

  @Get('me/listings')
  @UseGuards(AuthGuard('jwt'))
  async getMyListings(
    @Req() req: AuthenticatedRequest,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('categoryId') categoryId?: string,
    @Query('status') status?: string,
  ) {
    const numericPage = Number(page);
    const numericLimit = Number(limit);
    const normalizedStatus = this.normalizeManagementStatus(status);

    const data = await this.productsService.getMyListingManagement(
      req.user.sub,
      req.user.role,
      {
        page: Number.isFinite(numericPage) ? numericPage : 1,
        limit: Number.isFinite(numericLimit) ? numericLimit : 10,
        categoryId: categoryId?.trim() || undefined,
        status: normalizedStatus,
      },
    );

    return {
      success: true,
      data,
      message: 'Ürün listesi başarıyla getirildi.',
    };
  }

  @Get('me/listings/drafts')
  @UseGuards(AuthGuard('jwt'))
  async getMyListingDrafts(@Req() req: AuthenticatedRequest) {
    const data = await this.productsService.getMyListings(
      req.user.sub,
      req.user.role,
    );

    return {
      success: true,
      data,
      message: 'Ürün taslak listesi başarıyla getirildi.',
    };
  }

  @Get('me/listings/:id')
  @UseGuards(AuthGuard('jwt'))
  async getMyListingById(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    const data = await this.productsService.getMyListingById(
      req.user.sub,
      req.user.role,
      id,
    );

    return {
      success: true,
      data,
      message: 'Ürün taslağı başarıyla getirildi.',
    };
  }

  @Patch('me/listings/:id/active')
  @UseGuards(AuthGuard('jwt'))
  async updateMyListingActiveStatus(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateProductListingActiveStatusDto,
  ) {
    const data = await this.productsService.updateMyListingActiveStatus(
      req.user.sub,
      req.user.role,
      id,
      dto.isActive,
    );

    return {
      success: true,
      data,
      message: 'Ürün aktiflik durumu güncellendi.',
    };
  }

  @Delete('me/listings/:id')
  @UseGuards(AuthGuard('jwt'))
  async deleteMyListing(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    const data = await this.productsService.deleteMyListing(
      req.user.sub,
      req.user.role,
      id,
    );

    return {
      success: true,
      data,
      message: 'Ürün silindi.',
    };
  }

  @Post('me/listings/step-one')
  @UseGuards(AuthGuard('jwt'))
  async createMyListingStepOne(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateProductListingStepOneDto,
  ) {
    const data = await this.productsService.createMyListingStepOne(
      req.user.sub,
      req.user.role,
      dto,
    );

    return {
      success: true,
      data,
      message: 'Ürün taslağı ilk adım bilgileriyle oluşturuldu.',
    };
  }

  @Put('me/listings/:id/step-one')
  @UseGuards(AuthGuard('jwt'))
  async updateMyListingStepOne(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: CreateProductListingStepOneDto,
  ) {
    const data = await this.productsService.updateMyListingStepOne(
      req.user.sub,
      req.user.role,
      id,
      dto,
    );

    return {
      success: true,
      data,
      message: 'Temel ürün bilgileri başarıyla güncellendi.',
    };
  }

  @Put('me/listings/:id/step-two')
  @UseGuards(AuthGuard('jwt'))
  async updateMyListingStepTwo(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateProductListingStepTwoDto,
  ) {
    const data = await this.productsService.updateMyListingStepTwo(
      req.user.sub,
      req.user.role,
      id,
      dto,
    );

    return {
      success: true,
      data,
      message: 'Fiyatlandırma ve stok bilgileri başarıyla güncellendi.',
    };
  }

  @Put('me/listings/:id/step-three')
  @UseGuards(AuthGuard('jwt'))
  async updateMyListingStepThree(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateProductListingStepThreeDto,
  ) {
    const data = await this.productsService.updateMyListingStepThree(
      req.user.sub,
      req.user.role,
      id,
      dto,
    );

    return {
      success: true,
      data,
      message: 'Lojistik bilgileri başarıyla güncellendi.',
    };
  }

  @Post('me/listings/:id/media')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ProductListingMediaUploadExceptionFilter)
  @UseInterceptors(
    FileFieldsInterceptor(
      [{ name: PRODUCT_MEDIA_UPLOAD_FIELD, maxCount: 5 }],
      productMediaUploadOptions,
    ),
  )
  async uploadMyListingMedia(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @UploadedFiles()
    files: Partial<
      Record<
        typeof PRODUCT_MEDIA_UPLOAD_FIELD,
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
    const uploadedMedia = this.normalizeUploadedMedia(files);
    const data = await this.productsService.uploadMyListingMedia(
      req.user.sub,
      req.user.role,
      id,
      uploadedMedia,
    );

    return {
      success: true,
      data,
      message: 'Ürün medyaları başarıyla yüklendi.',
    };
  }

  @Post('me/listings/:id/submit')
  @UseGuards(AuthGuard('jwt'))
  async submitMyListing(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: SubmitProductListingDto,
  ) {
    const data = await this.productsService.submitMyListing(
      req.user.sub,
      req.user.role,
      id,
      dto,
    );

    return {
      success: true,
      data,
      message: 'Ürün taslağı onay süreci için gönderildi.',
    };
  }

  private normalizeUploadedMedia(
    files: Partial<
      Record<
        typeof PRODUCT_MEDIA_UPLOAD_FIELD,
        Array<{
          fieldname: string;
          originalname: string;
          mimetype: string;
          size: number;
          path: string;
        }>
      >
    >,
  ): UploadedProductListingMedia[] {
    const uploaded = files[PRODUCT_MEDIA_UPLOAD_FIELD] ?? [];

    return uploaded.map((file) => ({
      originalName: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size,
      filePath: file.path,
    }));
  }

  private ensureAdmin(role: Role): void {
    if (role !== Role.ADMIN) {
      throw new ForbiddenException('Bu işlem için admin yetkisi gereklidir.');
    }
  }

  private normalizeManagementStatus(
    value: string | undefined,
  ):
    | 'ALL'
    | 'ACTIVE'
    | 'PENDING_REVIEW'
    | 'REJECTED'
    | 'PASSIVE'
    | 'OUT_OF_STOCK' {
    if (
      value === 'ACTIVE' ||
      value === 'PENDING_REVIEW' ||
      value === 'REJECTED' ||
      value === 'PASSIVE' ||
      value === 'OUT_OF_STOCK'
    ) {
      return value;
    }

    return 'ALL';
  }

  private normalizeAdminManagementStatus(
    value: string | undefined,
  ): 'ALL' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'DRAFT' {
    if (
      value === 'PENDING_REVIEW' ||
      value === 'APPROVED' ||
      value === 'REJECTED' ||
      value === 'DRAFT'
    ) {
      return value;
    }

    return 'ALL';
  }

  private normalizeAdminGrowthPeriod(
    value: string | undefined,
  ): 'DAILY' | 'WEEKLY' | 'MONTHLY' {
    if (value === 'DAILY' || value === 'MONTHLY') {
      return value;
    }

    return 'WEEKLY';
  }
}
