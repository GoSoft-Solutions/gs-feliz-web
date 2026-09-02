import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ContentService } from './content.service';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { ListContentQueryDto, PresignUploadDto } from './dto/presign-upload.dto';

type Ret<K extends keyof ContentService> = ReturnType<ContentService[K]>;

@ApiTags('content')
@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Post('upload-url')
  @ApiOperation({ summary: 'Get a presigned URL to upload a file directly to S3' })
  requestUpload(@Body() dto: PresignUploadDto): Ret<'requestUpload'> {
    return this.contentService.requestUpload(dto);
  }

  @Post()
  @ApiOperation({ summary: 'Register a content item (uploaded file or external link)' })
  create(@Body() dto: CreateContentDto): Ret<'create'> {
    return this.contentService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List content items (optionally by category)' })
  findAll(@Query() query: ListContentQueryDto): Ret<'findAll'> {
    return this.contentService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a content item' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Ret<'findOne'> {
    return this.contentService.findOne(id);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Resolve a shareable download link for a content item' })
  download(@Param('id', ParseUUIDPipe) id: string): Ret<'getDownloadLink'> {
    return this.contentService.getDownloadLink(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a content item' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateContentDto,
  ): Ret<'update'> {
    return this.contentService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a content item (and its S3 object)' })
  remove(@Param('id', ParseUUIDPipe) id: string): Ret<'remove'> {
    return this.contentService.remove(id);
  }
}
