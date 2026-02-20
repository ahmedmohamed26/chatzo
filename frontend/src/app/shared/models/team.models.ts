export type TeamRole = 'company_admin' | 'agent';

export type TeamMember = {
  id: string;
  fullName: string;
  email: string;
  role: TeamRole;
  status: string;
  position: string;
  preferredLanguage: string;
  createdAt: string;
};

export type CreateTeamMemberPayload = {
  full_name: string;
  email: string;
  password: string;
  role: TeamRole;
  position?: string;
};

export type UpdateTeamMemberPayload = {
  full_name?: string;
  email?: string;
  password?: string;
  role?: TeamRole;
  position?: string;
};
