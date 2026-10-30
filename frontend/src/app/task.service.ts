import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthResponse, LoginRequest, RegisterRequest, Task, TaskPayload } from './task.model';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = '/api/tasks';
  private readonly authEndpoint = '/api/auth';

  login(payload: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.authEndpoint}/login`, payload);
  }

  register(payload: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.authEndpoint}/register`, payload);
  }

  getAll(): Observable<Task[]> {
    return this.http.get<Task[]>(this.endpoint, { headers: this.authHeaders() });
  }

  create(payload: TaskPayload): Observable<Task> {
    return this.http.post<Task>(this.endpoint, payload, { headers: this.authHeaders() });
  }

  update(id: number, payload: TaskPayload): Observable<Task> {
    return this.http.put<Task>(`${this.endpoint}/${id}`, payload, { headers: this.authHeaders() });
  }

  toggle(id: number): Observable<Task> {
    return this.http.patch<Task>(`${this.endpoint}/${id}/toggle`, {}, { headers: this.authHeaders() });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/${id}`, { headers: this.authHeaders() });
  }

  private authHeaders(): HttpHeaders {
    const token = localStorage.getItem('daymark_token');
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }
}
