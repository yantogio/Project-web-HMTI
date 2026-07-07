import {
  Controller, Get, Post, Put, Delete,
  Body, Param, ParseIntPipe, Req,
  UploadedFile, UseInterceptors, UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ShowcaseService } from './showcase.service';
import { CreateShowcaseDto } from './dto/create-showcase.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';

const ALLOWED_ROLES = ['ketum', 'bendahara', 'sekretaris'];

@Controller('showcase')
export class ShowcaseController {
  constructor(private readonly showcaseService: ShowcaseService) {}

  // Rute publik — TANPA guard, ditempatkan di atas agar tidak konflik dengan rute lain
  @Get('active')
  findActive() {
    return this.showcaseService.findActive();
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ALLOWED_ROLES)
  findAll() {
    return this.showcaseService.findAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ALLOWED_ROLES)
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
  }))
  create(
    @Body() dto: CreateShowcaseDto,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Req() req: any,
  ) {
    return this.showcaseService.create(dto, file, req.user.nia);
  }

  @Put(':id/toggle')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ALLOWED_ROLES)
  toggle(@Param('id', ParseIntPipe) id: number) {
    return this.showcaseService.toggleVisibility(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ALLOWED_ROLES)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.showcaseService.remove(id);
  }
}
