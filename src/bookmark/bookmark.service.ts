import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookmarkDto, EditBookmarkDto } from './dto';

@Injectable()
export class BookmarkService {
  constructor(private prisma: PrismaService) {}

  async createBookmark(userId: number, dto: CreateBookmarkDto) {
    const bookmark = await this.prisma.bookMark.create({
      data: {
        ...dto,
        user_id: userId,
      },
    });

    return bookmark;
  }

  async getBookmarks(userId: number) {
    const bookmarks = await this.prisma.bookMark.findMany({
      where: {
        user_id: userId,
      },
    });

    return bookmarks;
  }

  async getBookmarkById(userId: number, bookmarkId: number) {
    const bookmark = await this.prisma.bookMark.findFirst({
      where: {
        id: bookmarkId,
      },
    });

    if (!bookmark) {
      throw new NotFoundException('Bookmark Not Found');
    }

    if (bookmark.user_id !== userId) {
      throw new ForbiddenException("You don't have access");
    }

    return bookmark;
  }

  async editBookmarkById(
    userId: number,
    bookmarkId: number,
    dto: EditBookmarkDto,
  ) {
    await this.getBookmarkById(userId, bookmarkId);

    const updateBookmark = await this.prisma.bookMark.update({
      where: {
        id: bookmarkId,
      },
      data: {
        ...dto,
      },
    });

    return updateBookmark;
  }

  async deleteBookmarkById(userId: number, bookmarkId: number) {
    await this.getBookmarkById(userId, bookmarkId);

    const deleteBookmark = await this.prisma.bookMark.delete({
      where: {
        id: bookmarkId,
      },
    });

    return deleteBookmark;
  }
}
