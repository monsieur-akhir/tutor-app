import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { SearchService, SearchFilters } from './search.service';

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('tutors')
  @ApiOperation({ summary: 'Search for tutors' })
  @ApiResponse({ status: 200, description: 'Tutors found' })
  @ApiQuery({ name: 'query', required: false, type: String })
  @ApiQuery({ name: 'subject', required: false, type: String })
  @ApiQuery({ name: 'minRating', required: false, type: Number })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async searchTutors(@Query() filters: SearchFilters) {
    const results = await this.searchService.searchTutors(filters);
    return {
      success: true,
      data: results,
      total: results.length,
      filters,
    };
  }

  @Get('coaches')
  @ApiOperation({ summary: 'Search for coaches' })
  @ApiResponse({ status: 200, description: 'Coaches found' })
  @ApiQuery({ name: 'query', required: false, type: String })
  @ApiQuery({ name: 'subject', required: false, type: String })
  @ApiQuery({ name: 'minRating', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async searchCoaches(@Query() filters: SearchFilters) {
    const results = await this.searchService.searchCoaches(filters);
    return {
      success: true,
      data: results,
      total: results.length,
      filters,
    };
  }

  @Get('mentors')
  @ApiOperation({ summary: 'Search for mentors' })
  @ApiResponse({ status: 200, description: 'Mentors found' })
  @ApiQuery({ name: 'query', required: false, type: String })
  @ApiQuery({ name: 'subject', required: false, type: String })
  @ApiQuery({ name: 'minRating', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async searchMentors(@Query() filters: SearchFilters) {
    const results = await this.searchService.searchMentors(filters);
    return {
      success: true,
      data: results,
      total: results.length,
      filters,
    };
  }

  @Get('suggestions')
  @ApiOperation({ summary: 'Get search suggestions' })
  @ApiResponse({ status: 200, description: 'Search suggestions' })
  @ApiQuery({ name: 'query', required: true, type: String })
  async getSuggestions(@Query('query') query: string) {
    const suggestions = await this.searchService.getSearchSuggestions(query);
    return {
      success: true,
      data: suggestions,
      query,
    };
  }
}
