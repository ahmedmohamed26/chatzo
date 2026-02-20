import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CreateTeamMemberPayload,
  TeamMember,
  UpdateTeamMemberPayload,
} from '../../shared/models/team.models';

type ApiResponse<T> = {
  message_key: string;
  message: string;
  data: T;
};

@Injectable({ providedIn: 'root' })
export class TeamApiService {
  private readonly baseUrl = 'http://localhost:3000/api/v1/team';

  constructor(private readonly http: HttpClient) {}

  list(): Observable<ApiResponse<TeamMember[]>> {
    return this.http.get<ApiResponse<TeamMember[]>>(this.baseUrl, { headers: this.headers });
  }

  create(payload: CreateTeamMemberPayload): Observable<ApiResponse<TeamMember>> {
    return this.http.post<ApiResponse<TeamMember>>(this.baseUrl, payload, { headers: this.headers });
  }

  update(id: string, payload: UpdateTeamMemberPayload): Observable<ApiResponse<TeamMember>> {
    return this.http.patch<ApiResponse<TeamMember>>(`${this.baseUrl}/${id}`, payload, { headers: this.headers });
  }

  remove(id: string): Observable<ApiResponse<{ id: string }>> {
    return this.http.delete<ApiResponse<{ id: string }>>(`${this.baseUrl}/${id}`, { headers: this.headers });
  }

  private get headers(): HttpHeaders {
    const tenantId = localStorage.getItem('tenant_id') ?? '';
    return new HttpHeaders({ 'x-tenant-id': tenantId });
  }
}
