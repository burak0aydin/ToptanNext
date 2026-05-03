import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { createHash } from 'crypto';
import { PaymentCard } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface CreatePaymentCardDto {
  cardNumber: string;
  expiry: string;
  cvv?: string;
  cardHolderName: string;
}

export interface UpdatePaymentCardDto {
  expiry: string;
  cardHolderName: string;
}

function normalizeCardNumber(cardNumber: string): string {
  return cardNumber.replace(/\D/g, '');
}

function detectBrand(cardNumber: string): string {
  if (/^4/.test(cardNumber)) return 'Visa';
  if (/^(5[1-5]|2[2-7])/.test(cardNumber)) return 'Mastercard';
  if (/^3[47]/.test(cardNumber)) return 'American Express';
  if (/^6/.test(cardNumber)) return 'Discover';
  return 'Kart';
}

function parseExpiry(expiry: string): { month: string; year: string } {
  const match = expiry.trim().match(/^(\d{2})\/(\d{2})$/);

  if (!match) {
    throw new BadRequestException('Son kullanma tarihi AA/YY formatında olmalıdır');
  }

  const month = Number(match[1]);
  if (month < 1 || month > 12) {
    throw new BadRequestException('Son kullanma ayı geçersiz');
  }

  return { month: match[1], year: match[2] };
}

function fingerprintCard(userId: string, cardNumber: string): string {
  return createHash('sha256').update(`${userId}:${cardNumber}`).digest('hex');
}

@Injectable()
export class PaymentCardsService {
  constructor(private readonly prisma: PrismaService) {}

  async createCard(userId: string, data: CreatePaymentCardDto): Promise<PaymentCard> {
    const cardNumber = normalizeCardNumber(data.cardNumber);

    if (cardNumber.length !== 16) {
      throw new BadRequestException('Kart numarası 16 haneli olmalıdır');
    }

    if (!data.cardHolderName?.trim()) {
      throw new BadRequestException('Kart sahibi boş olamaz');
    }

    if (data.cvv && !/^\d{3,4}$/.test(data.cvv.trim())) {
      throw new BadRequestException('CVV 3 veya 4 haneli olmalıdır');
    }

    const { month, year } = parseExpiry(data.expiry);
    const lastFour = cardNumber.slice(-4);
    const fingerprint = fingerprintCard(userId, cardNumber);

    return this.prisma.$transaction(async (tx) => {
      await tx.paymentCard.updateMany({
        where: { userId },
        data: { isSelected: false },
      });

      return tx.paymentCard.create({
        data: {
          userId,
          cardHolderName: data.cardHolderName.trim(),
          brand: detectBrand(cardNumber),
          lastFour,
          maskedNumber: `**** **** **** ${lastFour}`,
          expiryMonth: month,
          expiryYear: year,
          fingerprint,
          isSelected: true,
        },
      });
    });
  }

  async getUserCards(userId: string): Promise<PaymentCard[]> {
    return this.prisma.paymentCard.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getCardById(cardId: string, userId: string): Promise<PaymentCard> {
    const card = await this.prisma.paymentCard.findUnique({
      where: { id: cardId },
    });

    if (!card) {
      throw new NotFoundException('Kart bulunamadı');
    }

    if (card.userId !== userId) {
      throw new ForbiddenException('Bu karta erişim izniniz yok');
    }

    return card;
  }

  async deleteCard(cardId: string, userId: string): Promise<PaymentCard> {
    await this.getCardById(cardId, userId);

    return this.prisma.paymentCard.delete({
      where: { id: cardId },
    });
  }

  async updateCard(
    cardId: string,
    userId: string,
    data: UpdatePaymentCardDto,
  ): Promise<PaymentCard> {
    await this.getCardById(cardId, userId);

    if (!data.cardHolderName?.trim()) {
      throw new BadRequestException('Kart sahibi boş olamaz');
    }

    const { month, year } = parseExpiry(data.expiry);

    return this.prisma.paymentCard.update({
      where: { id: cardId },
      data: {
        cardHolderName: data.cardHolderName.trim(),
        expiryMonth: month,
        expiryYear: year,
      },
    });
  }

  async selectCard(cardId: string, userId: string): Promise<PaymentCard> {
    await this.getCardById(cardId, userId);

    await this.prisma.paymentCard.updateMany({
      where: { userId },
      data: { isSelected: false },
    });

    return this.prisma.paymentCard.update({
      where: { id: cardId },
      data: { isSelected: true },
    });
  }
}
