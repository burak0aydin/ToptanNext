import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuoteOfferCard } from './QuoteOfferCard';
import type { ChatQuote, QuoteStatus } from '@/features/chat/api/chat.api';

function buildQuote(status: QuoteStatus): ChatQuote {
  return {
    id: 'quote-1',
    productListingId: 'prd-1',
    productName: 'Test Ürün',
    productImageMediaId: null,
    quantity: 50,
    unitPrice: 950,
    logisticsFee: null,
    currency: 'TRY',
    notes: 'Test teklif',
    status,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    counterQuoteId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

describe('QuoteOfferCard', () => {
  it('renders actions for pending quote when user is buyer', async () => {
    const user = userEvent.setup();
    const onAccept = jest.fn().mockResolvedValue(undefined);

    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);

    render(
      <QuoteOfferCard
        quote={buildQuote('PENDING')}
        isOwn={false}
        onAccept={onAccept}
        onReject={jest.fn().mockResolvedValue(undefined)}
        onCounter={jest.fn()}
      />,
    );

    expect(screen.getByText('Teklifi Kabul Et ve Onayla')).toBeInTheDocument();
    expect(screen.getByText('Karşı Teklif Gönder')).toBeInTheDocument();

    await user.click(screen.getByText('Teklifi Kabul Et ve Onayla'));

    expect(onAccept).toHaveBeenCalledTimes(1);
    confirmSpy.mockRestore();
  });

  it.each([
    ['ACCEPTED', '✓ Kabul Edildi'],
    ['REJECTED', '✗ Reddedildi'],
    ['EXPIRED', 'Süresi Doldu'],
    ['COUNTERED', 'Karşı Teklif Gönderildi'],
  ] as const)('renders status badge for %s', (status, expectedLabel) => {
    render(
      <QuoteOfferCard
        quote={buildQuote(status)}
        isOwn={false}
        onAccept={jest.fn().mockResolvedValue(undefined)}
        onReject={jest.fn().mockResolvedValue(undefined)}
        onCounter={jest.fn()}
      />,
    );

    expect(screen.getByText(expectedLabel)).toBeInTheDocument();
    expect(screen.queryByText('Teklifi Kabul Et ve Onayla')).not.toBeInTheDocument();
  });

  it('does not render response actions for own pending quote', () => {
    render(
      <QuoteOfferCard
        quote={buildQuote('PENDING')}
        isOwn
        onAccept={jest.fn().mockResolvedValue(undefined)}
        onReject={jest.fn().mockResolvedValue(undefined)}
        onCounter={jest.fn()}
      />,
    );

    expect(screen.queryByText('Teklifi Kabul Et ve Onayla')).not.toBeInTheDocument();
    expect(screen.queryByText('Karşı Teklif Gönder')).not.toBeInTheDocument();
    expect(screen.getByText('Beklemede')).toBeInTheDocument();
  });
});
