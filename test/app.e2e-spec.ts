import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service';
import * as pactum from 'pactum';
import { AuthDto } from 'src/auth/dto';
import { EditUserDto } from 'src/user/dto';
import { CreateBookmarkDto, EditBookmarkDto } from 'src/bookmark/dto';

describe('App e2e', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    // compine modules
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    // declare app and add setting from main.ts
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true, // only accept body value from dto
      }),
    );

    // initialize app
    await app.init();
    await app.listen(3333);
    prisma = app.get(PrismaService);

    await prisma.cleanDb();
    pactum.request.setBaseUrl('http://localhost:3333/api/v1');
  });

  // close after testing done
  afterAll(async () => {
    app.close();
  });

  describe('Auth', () => {
    const dto: AuthDto = {
      email: 'test@mail.com',
      password: '123',
    };

    describe('Signup', () => {
      it('Should throw if email empty', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({
            password: dto.password,
          })
          .expectStatus(400);
      });

      it('Should throw if password empty', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({
            email: dto.email,
          })
          .expectStatus(400);
      });

      it('Should throw if no body', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({})
          .expectStatus(400);
      });

      it('Should Signup', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody(dto)
          .expectStatus(201);
      });
    });

    describe('Signin', () => {
      it('Should throw if email empty', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody({
            password: dto.password,
          })
          .expectStatus(400);
      });

      it('Should throw if password empty', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody({
            email: dto.email,
          })
          .expectStatus(400);
      });

      it('Should throw if no body', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody({})
          .expectStatus(400);
      });

      it('Should Signin', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody(dto)
          .expectStatus(200)
          .stores('userAt', 'access_token');
      });
    });
  });

  describe('User', () => {
    describe('Get Me', () => {
      it('should not get current user', () => {
        return pactum.spec().get('/users/me').expectStatus(401);
      });

      it('should get current user', () => {
        return pactum
          .spec()
          .get('/users/me')
          .withBearerToken(`$S{userAt}`)
          .expectStatus(200);
      });
    });

    describe('Edit User', () => {
      const dto: EditUserDto = {
        firstName: 'First',
      };
      it('should edit user', () => {
        return pactum
          .spec()
          .patch('/users')
          .withBearerToken(`$S{userAt}`)
          .withBody(dto)
          .expectBodyContains(dto.firstName)
          .expectStatus(200);
      });
    });
  });

  describe('Bookmarks', () => {
    describe('Get Empty bookmarks', () => {
      it('should get bookmarks', () => {
        return pactum
          .spec()
          .get('/bookmarks')
          .withBearerToken('$S{userAt}')
          .expectStatus(200)
          .expectBody([]);
      });
    });

    describe('Create Bookmark', () => {
      const dto: CreateBookmarkDto = {
        title: 'first',
        link: 'link',
      };

      it('should create bookmark', () => {
        return pactum
          .spec()
          .post('/bookmarks')
          .withBearerToken(`$S{userAt}`)
          .withBody(dto)
          .expectStatus(201)
          .stores('bookmarkId', 'id');
      });
    });
    
    describe('Get Bookmarks', () => {
      it('should get bookmarks', () => {
        return pactum
          .spec()
          .get('/bookmarks')
          .withBearerToken(`$S{userAt}`)
          .expectStatus(200)
          .expectJsonLength(1);
      });
    });

    describe('Get Bookmark By Id', () => {
      it('should get bookmark by id', () => {
        return pactum
          .spec()
          .get(`/bookmarks/$S{bookmarkId}`)
          .withBearerToken(`$S{userAt}`)
          .expectStatus(200)
          .expectBodyContains(`$S{bookmarkId}`);
      });
    });

    describe('Edit Bookmark', () => {
      const dto: EditBookmarkDto = {
        title: 'update',
        link: 'link update',
      };

      it('should edit bookmark', () => {
        return pactum
          .spec()
          .patch('/bookmarks/$S{bookmarkId}')
          .withBearerToken(`$S{userAt}`)
          .withBody(dto)
          .expectStatus(200)
          .expectBodyContains(dto.title)
          .expectBodyContains(dto.link);
      });
    });

    describe('Delete Bookmark', () => {
      it('should delete bookmark', () => {
        return pactum
          .spec()
          .delete('/bookmarks/$S{bookmarkId}')
          .withBearerToken(`$S{userAt}`)
          .expectStatus(200);
      });
    });

    describe('Get Bookmarks After Delete', () => {
      it('should get bookmarks', () => {
        return pactum
          .spec()
          .get('/bookmarks')
          .withBearerToken(`$S{userAt}`)
          .expectStatus(200)
          .expectJsonLength(0);
      });
    });
  });
});
