import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('evaluations')
@Controller('evaluations')
export class EvaluationsController {
  @Get()
  @ApiOperation({ summary: 'Get evaluations' })
  @ApiResponse({ status: 200, description: 'Evaluations retrieved' })
  async getEvaluations() {
    return { message: 'Get evaluations endpoint - to be implemented' };
  }

  @Post()
  @ApiOperation({ summary: 'Create evaluation' })
  @ApiResponse({ status: 201, description: 'Evaluation created' })
  async createEvaluation(@Body() data: any) {
    return { message: 'Create evaluation endpoint - to be implemented', data };
  }
}
