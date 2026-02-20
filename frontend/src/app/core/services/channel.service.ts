import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ChannelSummary, ConnectedAccount, ConnectWhatsappPayload } from '../../shared/models/channel.models';

type ApiResponse<T> = {
  message_key: string;
  message: string;
  data: T;
};

@Injectable({ providedIn: 'root' })
export class ChannelService {
  private readonly baseUrl = 'http://localhost:3000/api/v1/channels';

  constructor(private readonly http: HttpClient) {}

  getChannelSummary(): Observable<ApiResponse<ChannelSummary>> {
    return this.http.get<ApiResponse<ChannelSummary>>(`${this.baseUrl}/summary`, { headers: this.headers });
  }

  listConnectedAccounts(): Observable<ApiResponse<ConnectedAccount[]>> {
    return this.http.get<ApiResponse<ConnectedAccount[]>>(this.baseUrl, { headers: this.headers });
  }

  connectWhatsapp(payload: ConnectWhatsappPayload): Observable<ApiResponse<ConnectedAccount>> {
    return this.http.post<ApiResponse<ConnectedAccount>>(`${this.baseUrl}/whatsapp`, payload, { headers: this.headers });
  }

  deleteChannel(channelId: string): Observable<ApiResponse<{ id: string }>> {
    return this.http.delete<ApiResponse<{ id: string }>>(`${this.baseUrl}/${channelId}`, { headers: this.headers });
  }

  private get headers(): HttpHeaders {
    const tenantId = localStorage.getItem('tenant_id') ?? '';
    return new HttpHeaders({ 'x-tenant-id': tenantId });
  }
}
