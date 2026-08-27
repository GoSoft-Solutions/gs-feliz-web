import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { ListContactsQueryDto } from './dto/list-contacts-query.dto';

// Explicit return types below work around TS2742 ("inferred type cannot
// be named without a reference to .../@prisma/client/runtime/library"),
// which surfaces under pnpm's isolated node_modules layout when a
// controller method's return type is inferred purely from a Prisma
// query. Annotating with the service's own return type is enough to
// satisfy the compiler without introducing a hard Prisma type import here.
type ContactsServiceReturn<K extends keyof ContactsService> = ReturnType<ContactsService[K]>;

@ApiTags('contacts')
@Controller('contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a contact' })
  create(@Body() dto: CreateContactDto): ContactsServiceReturn<'create'> {
    return this.contactsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List contacts (paginated, filterable by status/search)' })
  findAll(@Query() query: ListContactsQueryDto): ContactsServiceReturn<'findAll'> {
    return this.contactsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a contact by id' })
  findOne(@Param('id', ParseUUIDPipe) id: string): ContactsServiceReturn<'findOne'> {
    return this.contactsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a contact' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateContactDto,
  ): ContactsServiceReturn<'update'> {
    return this.contactsService.update(id, dto);
  }

  @Get(':id/events')
  @ApiOperation({ summary: "List a contact's event history" })
  findEvents(@Param('id', ParseUUIDPipe) id: string): ContactsServiceReturn<'findEvents'> {
    return this.contactsService.findEvents(id);
  }
}
