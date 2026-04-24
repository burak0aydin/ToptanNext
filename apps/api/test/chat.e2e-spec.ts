import { CanActivate, ExecutionContext, ForbiddenException, INestApplication, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Test } from '@nestjs/testing';
import { Role } from '@prisma/client';
import * as request from 'supertest';
import { ConversationsController } from '../src/modules/conversations/conversations.controller';
import { QuotesController } from '../src/modules/quotes/quotes.controller';
import { ConversationsService } from '../src/modules/conversations/conversations.service';
import { QuotesService } from '../src/modules/quotes/quotes.service';

let currentUser: {
  sub: string;
  email: string;
  role: Role;
} = {
  sub: 'buyer-1',
  email: 'buyer@example.com',
  role: Role.BUYER,
};

@Injectable()
class TestAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    req.user = currentUser;
    return true;
  }
}

describe('Chat module (e2e)', () => {
  let app: INestApplication;

  const conversationsServiceMock = {
    getConversationList: jest.fn(),
    getConversationById: jest.fn(),
    getMessages: jest.fn(),
    createConversation: jest.fn(),
    archiveConversation: jest.fn(),
  };

  const quotesServiceMock = {
    getQuoteById: jest.fn(),
    acceptQuote: jest.fn(),
    rejectQuote: jest.fn(),
    createCounterOffer: jest.fn(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ConversationsController, QuotesController],
      providers: [
        { provide: ConversationsService, useValue: conversationsServiceMock },
        { provide: QuotesService, useValue: quotesServiceMock },
      ],
    }) 
      .overrideGuard(AuthGuard('jwt'))
      .useClass(TestAuthGuard)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    currentUser = {
      sub: 'buyer-1',
      email: 'buyer@example.com',
      role: Role.BUYER,
    };
  });

  it('GET /conversations returns list for authenticated user', async () => {
    conversationsServiceMock.getConversationList.mockResolvedValue([
      { id: 'conv-1', unreadCount: 1 },
    ]);

    const response = await request(app.getHttpServer())
      .get('/conversations')
      .expect(200);

    expect(conversationsServiceMock.getConversationList).toHaveBeenCalledWith('buyer-1', {
      filter: undefined,
      search: undefined,
    });
    expect(response.body.success).toBe(true);
    expect(response.body.data[0].id).toBe('conv-1');
  });

  it('GET /conversations/:id/messages forwards cursor pagination params', async () => {
    conversationsServiceMock.getMessages.mockResolvedValue({
      items: [{ id: 'msg-1' }],
      nextCursor: 'msg-2',
    });

    const response = await request(app.getHttpServer())
      .get('/conversations/conv-1/messages?cursor=msg-0&limit=20')
      .expect(200);

    expect(conversationsServiceMock.getMessages).toHaveBeenCalledWith(
      'buyer-1',
      'conv-1',
      'msg-0',
      20,
    );
    expect(response.body.data.nextCursor).toBe('msg-2');
  });

  it('PATCH /quotes/:id/accept rejects non-buyer role', async () => {
    currentUser = {
      sub: 'supplier-1',
      email: 'supplier@example.com',
      role: Role.SUPPLIER,
    };

    await request(app.getHttpServer())
      .patch('/quotes/quote-1/accept')
      .expect(403);

    expect(quotesServiceMock.acceptQuote).not.toHaveBeenCalled();
  });

  it('GET /quotes/:id returns 403 when membership is denied by service', async () => {
    quotesServiceMock.getQuoteById.mockRejectedValue(
      new ForbiddenException('Bu teklif için erişim yetkiniz yok.'),
    );

    await request(app.getHttpServer())
      .get('/quotes/quote-1')
      .expect(403);
  });
});
