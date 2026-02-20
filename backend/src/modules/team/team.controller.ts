import { Body, Controller, Delete, Get, Headers, Param, Patch, Post } from '@nestjs/common';
import { CreateTeamMemberDto } from './dto/create-team-member.dto';
import { UpdateTeamMemberDto } from './dto/update-team-member.dto';
import { TeamService } from './team.service';

@Controller('team')
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @Get()
  async list(@Headers('x-tenant-id') tenantId: string) {
    return {
      message_key: 'team.listed',
      message: 'Team loaded',
      data: await this.teamService.list(tenantId),
    };
  }

  @Post()
  async create(@Headers('x-tenant-id') tenantId: string, @Body() body: CreateTeamMemberDto) {
    return {
      message_key: 'team.created',
      message: 'Member created',
      data: await this.teamService.create(tenantId, body),
    };
  }

  @Patch(':id')
  async update(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string, @Body() body: UpdateTeamMemberDto) {
    return {
      message_key: 'team.updated',
      message: 'Member updated',
      data: await this.teamService.update(tenantId, id, body),
    };
  }

  @Delete(':id')
  async remove(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string) {
    await this.teamService.remove(tenantId, id);
    return {
      message_key: 'team.deleted',
      message: 'Member deleted',
      data: { id },
    };
  }
}
