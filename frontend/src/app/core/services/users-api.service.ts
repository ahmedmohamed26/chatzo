import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

type ApiResponse<T> = {
  message_key: string;
  message: string;
  data: T;
};

type UserProfile = {
  id: string;
  email: string;
  full_name: string;
  preferred_language: 'en' | 'ar';
  tenant_id: string;
  role: string;
};

@Injectable({ providedIn: 'root' })
export class UsersApiService {
  private readonly baseUrl = 'http://localhost:3000/api/v1/me';

  constructor(private readonly http: HttpClient) {}

  getMe(): Observable<ApiResponse<UserProfile>> {
    return this.http.get<ApiResponse<UserProfile>>(this.baseUrl, { headers: this.headers });
  }

  updateLanguage(preferred_language: 'en' | 'ar'): Observable<ApiResponse<UserProfile>> {
    return this.http.patch<ApiResponse<UserProfile>>(
      `${this.baseUrl}/language`,
      { preferred_language },
      { headers: this.headers },
    );
  }

  private get headers(): HttpHeaders {
    const userId = localStorage.getItem('user_id') ?? '';
    return new HttpHeaders({ 'x-user-id': userId });
  }
}
