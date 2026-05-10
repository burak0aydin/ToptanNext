import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { UpsertProductReviewDto } from './dto/upsert-product-review.dto';
import { ProductReviewsService } from './product-reviews.service';

type AuthenticatedRequest = Request & {
  user: JwtPayload;
};

@Controller('product-reviews')
export class ProductReviewsController {
  constructor(private readonly productReviewsService: ProductReviewsService) {}

  @Get('product/:productListingId')
  async getProductReviews(@Param('productListingId') productListingId: string) {
    const data = await this.productReviewsService.getProductReviews(productListingId);

    return {
      success: true,
      data,
    };
  }

  @Get('product/:productListingId/me')
  @UseGuards(AuthGuard('jwt'))
  async getMyReviewState(
    @Req() req: AuthenticatedRequest,
    @Param('productListingId') productListingId: string,
  ) {
    const data = await this.productReviewsService.getMyReviewState(
      req.user.sub,
      req.user.role,
      productListingId,
    );

    return {
      success: true,
      data,
    };
  }

  @Post('product/:productListingId')
  @UseGuards(AuthGuard('jwt'))
  async upsertReview(
    @Req() req: AuthenticatedRequest,
    @Param('productListingId') productListingId: string,
    @Body() dto: UpsertProductReviewDto,
  ) {
    const data = await this.productReviewsService.upsertReview(
      req.user.sub,
      req.user.role,
      productListingId,
      dto,
    );

    return {
      success: true,
      data,
      message: 'Değerlendirme kaydedildi.',
    };
  }
}
