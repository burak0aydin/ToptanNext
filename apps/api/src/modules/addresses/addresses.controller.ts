import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { AddressesService, CreateAddressDto, UpdateAddressDto } from './addresses.service';

type AuthenticatedRequest = Request & {
  user: JwtPayload;
};

@Controller('addresses')
@UseGuards(AuthGuard('jwt'))
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Post()
  async createAddress(
    @Req() req: AuthenticatedRequest,
    @Body() data: CreateAddressDto,
  ) {
    const address = await this.addressesService.createAddress(req.user.sub, data);

    return {
      success: true,
      data: address,
      message: 'Adres başarıyla kaydedildi.',
    };
  }

  @Get()
  async getUserAddresses(@Req() req: AuthenticatedRequest) {
    const addresses = await this.addressesService.getUserAddresses(req.user.sub);

    return {
      success: true,
      data: addresses,
    };
  }

  @Get(':id')
  async getAddressById(
    @Req() req: AuthenticatedRequest,
    @Param('id') addressId: string,
  ) {
    const address = await this.addressesService.getAddressById(addressId, req.user.sub);

    return {
      success: true,
      data: address,
    };
  }

  @Put(':id')
  async updateAddress(
    @Req() req: AuthenticatedRequest,
    @Param('id') addressId: string,
    @Body() data: UpdateAddressDto,
  ) {
    const address = await this.addressesService.updateAddress(addressId, req.user.sub, data);

    return {
      success: true,
      data: address,
      message: 'Adres başarıyla güncellendi.',
    };
  }

  @Delete(':id')
  async deleteAddress(
    @Req() req: AuthenticatedRequest,
    @Param('id') addressId: string,
  ) {
    await this.addressesService.deleteAddress(addressId, req.user.sub);

    return {
      success: true,
      data: null,
      message: 'Adres başarıyla silindi.',
    };
  }

  @Put(':id/select')
  async setSelectedAddress(
    @Req() req: AuthenticatedRequest,
    @Param('id') addressId: string,
  ) {
    const address = await this.addressesService.setSelectedAddress(addressId, req.user.sub);

    return {
      success: true,
      data: address,
      message: 'Geçerli adres güncellendi.',
    };
  }
}
