import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export type QuickReplyCategory = 'general' | 'sales' | 'support' | 'follow-up';

export type QuickReply = {
  id: string;
  title: string;
  category: QuickReplyCategory;
  content: string;
};

type ApiResponse<T> = {
  message_key: string;
  message: string;
  data: T;
};

@Injectable({ providedIn: 'root' })
export class QuickRepliesApiService {
  private readonly baseUrl = 'http://localhost:3000/api/v1/quick-replies';

  constructor(private readonly http: HttpClient) {}

  list(): Observable<ApiResponse<QuickReply[]>> {
    return this.http.get<ApiResponse<QuickReply[]>>(this.baseUrl, { headers: this.headers });
  }

  create(payload: Omit<QuickReply, 'id'>): Observable<ApiResponse<QuickReply>> {
    return this.http.post<ApiResponse<QuickReply>>(this.baseUrl, payload, { headers: this.headers });
  }

  update(id: string, payload: Partial<Omit<QuickReply, 'id'>>): Observable<ApiResponse<QuickReply>> {
    return this.http.patch<ApiResponse<QuickReply>>(`${this.baseUrl}/${id}`, payload, { headers: this.headers });
  }

  remove(id: string): Observable<ApiResponse<{ id: string }>> {
    return this.http.delete<ApiResponse<{ id: string }>>(`${this.baseUrl}/${id}`, { headers: this.headers });
  }

  private get headers(): HttpHeaders {
    const tenantId = localStorage.getItem('tenant_id') ?? '';
    return new HttpHeaders({ 'x-tenant-id': tenantId });
  }
}
