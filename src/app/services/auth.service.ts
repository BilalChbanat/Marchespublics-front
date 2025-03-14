import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

export interface SignupRequest {
  username: string;
  email: string;
  password: string;
}

export interface SignupResponse {
  id: number;
  username: string;
  email: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  expiresIn: number;
  user?: {
    id: number;
    username: string;
    email: string;
  };
}

export interface User {
  id: number;
  username: string;
  email: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8080/auth';
  private currentUserSubject = new BehaviorSubject<User | null>(null);

  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadUserFromStorage();
  }

  private loadUserFromStorage(): void {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('auth_token');

    if (userStr && token) {
      try {
        const user = JSON.parse(userStr);
        this.currentUserSubject.next(user);
      } catch (e) {
        localStorage.removeItem('user');
        localStorage.removeItem('auth_token');
      }
    }
  }

  signup(signupRequest: SignupRequest): Observable<SignupResponse> {
    return this.http.post<SignupResponse>(`${this.apiUrl}/signup`, signupRequest);
  }

  login(email: string, password: string): Observable<LoginResponse> {
    const loginRequest: LoginRequest = { email, password };

    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, loginRequest)
      .pipe(
        tap(response => {
          console.log('Raw login response:', response);

          if (response && response.token) {
            localStorage.setItem('auth_token', response.token);

            let userData: User;

            if (response.user) {
              userData = {
                id: response.user.id,
                username: response.user.username,
                email: response.user.email
              };
            } else {
              try {
                const tokenPayload = this.decodeJwtToken(response.token);
                userData = {
                  id: tokenPayload.id || 0,
                  username: tokenPayload.sub || email.split('@')[0],
                  email: tokenPayload.email || email
                };
              } catch (error) {
                userData = {
                  id: 0,
                  username: email.split('@')[0],
                  email: email
                };
              }
            }

            localStorage.setItem('user', JSON.stringify(userData));

            this.currentUserSubject.next(userData);

            console.log('User data stored:', userData);
          }
        })
      );
  }

  logout(): void {
    try {
      this.http.post<any>(`${this.apiUrl}/logout`, {}).subscribe({
        next: () => this.clearUserData(),
        error: () => this.clearUserData()
      });
    } catch {
      this.clearUserData();
    }
  }

  clearUserData(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('auth_token');
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  checkToken(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/check-token`);
  }

  /**
   * Decode JWT token to get payload data
   * @param token JWT token string
   * @returns Decoded payload as an object
   */
  private decodeJwtToken(token: string): any {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT token format');
      }

      const base64Payload = parts[1];
      const base64 = base64Payload.replace(/-/g, '+').replace(/_/g, '/');

      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );

      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error decoding JWT:', error);
      return {};
    }
  }
}
