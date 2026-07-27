import { Controller, Get } from '@nestjs/common';

const LUSAKA_AREAS = [
  'Roma',
  'Kabulonga',
  'CBD',
  'Woodlands',
  'Rhodes Park',
  'Olympia',
  'Chilanga',
  'Chelstone',
  'Matero',
  'Chilenje',
] as const;

const CATEGORIES = [
  'BARBER',
  'SALON',
  'NAILS',
  'BRIDAL',
  'MOBILE',
] as const;

@Controller('meta')
export class MetaController {
  @Get('areas')
  areas() {
    return { city: 'Lusaka', areas: LUSAKA_AREAS };
  }

  @Get('categories')
  categories() {
    return { categories: CATEGORIES };
  }
}
