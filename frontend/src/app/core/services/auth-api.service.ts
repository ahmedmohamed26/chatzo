import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

type ApiResponse<T> = {
  message_key: string;
  message: string;
  data: T;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  first_name: string;
  last_name: string;
  organization_name: string;
  email: string;
  password: string;
};

type LoginResponseData = {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email: string;
    full_name: string;
    preferred_language: string;
    tenant_id: string;
    role: string;
  };
};

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly baseUrl = 'http://localhost:3000/api/v1';

  constructor(private readonly http: HttpClient) {}

  login(payload: LoginPayload): Observable<ApiResponse<LoginResponseData>> {
    return this.http.post<ApiResponse<LoginResponseData>>(`${this.baseUrl}/auth/login`, payload);
  }

  register(payload: RegisterPayload): Observable<ApiResponse<{ email: string; full_name: string }>> {
    return this.http.post<ApiResponse<{ email: string; full_name: string }>>(
      `${this.baseUrl}/auth/register`,
      payload,
    );
  }
}
