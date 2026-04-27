import { Transform } from 'class-transformer';
import { IsBoolean } from 'class-validator';

const toBoolean = ({ value }: { value: unknown }): boolean => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }

  return false;
};

export class UpsertLogisticsApplicationDocumentsDto {
  @Transform(toBoolean)
  @IsBoolean({
    message: 'Lojistik Partnerliği Sözleşmesi onayı zorunludur.',
  })
  approvedSupplierAgreement!: boolean;

  @Transform(toBoolean)
  @IsBoolean({
    message: 'KVKK Aydınlatma Metni onayı zorunludur.',
  })
  approvedKvkkAgreement!: boolean;

  @Transform(toBoolean)
  @IsBoolean({
    message: 'Ticari elektronik ileti izni geçerli bir değer olmalıdır.',
  })
  approvedCommercialMessage!: boolean;
}
