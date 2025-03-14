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
  expiresIn?: number;
  user?: User;
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
  public currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    // Load user from localStorage on service initialization
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
        // If parsing fails, clear potentially corrupted data
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
            // Store token in localStorage
            localStorage.setItem('auth_token', response.token);

            // Create user object from available data
            let userData: User;

            if (response.user) {
              // If API returns user object, use it directly
              userData = {
                id: response.user.id,
                username: response.user.username,
                email: response.user.email
              };
            } else {
              // If API doesn't return a user object, try to extract from JWT token
              try {
                const tokenPayload = this.decodeJwtToken(response.token);
                userData = {
                  id: tokenPayload.id || 0,
                  username: tokenPayload.sub || email.split('@')[0], // Try to get from token or use email username
                  email: tokenPayload.email || email
                };
              } catch (error) {
                // Fallback to basic user info
                userData = {
                  id: 0,
                  username: email.split('@')[0], // Use first part of email as username
                  email: email
                };
              }
            }

            // Store user data in localStorage
            localStorage.setItem('user', JSON.stringify(userData));

            // Update currentUserSubject
            this.currentUserSubject.next(userData);

            console.log('User data stored:', userData);
          }
        })
      );
  }

  logout(): void {
    // Clear user data and navigate to login
    this.clearUserData();
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

  /**
   * Decode JWT token to get payload data
   * @param token JWT token string
   * @returns Decoded payload as an object
   */
  private decodeJwtToken(token: string): any {
    try {
      // JWT token is split into three parts separated by dots
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT token format');
      }

      // The payload is the second part
      const base64Payload = parts[1];
      const base64 = base64Payload.replace(/-/g, '+').replace(/_/g, '/');

      // Decode base64
      const jsonPayload = atob(base64);

      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error decoding JWT:', error);
      return {};
    }
  }
}
