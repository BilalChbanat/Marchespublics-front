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
  roles?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8080/auth';
  public currentUserSubject = new BehaviorSubject<User | null>(null);
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

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;

    if (!user.roles || user.roles.length === 0) {
      return false;
    }

    return user.roles.includes(role);
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
          console.log('Raw API response:', response); // <-- Add this
          console.log('JWT Token:', response.token);

          if (response && response.token) {
            // Store token in localStorage
            localStorage.setItem('auth_token', response.token);

            const tokenPayload = this.decodeJwtToken(response.token);
            console.log('Decoded Token:', tokenPayload);

            // Create user object from available data
            let userData: User;

            if (response.user) {
              // If API returns user object, use it directly
              userData = {
                id: response.user.id,
                username: response.user.username,
                email: response.user.email,
                roles: response.user.roles || []
              };
            } else {
              try {
                const tokenPayload = this.decodeJwtToken(response.token);
                userData = {
                  id: tokenPayload.id || 0,
                  username: tokenPayload.sub || email.split('@')[0],
                  email: tokenPayload.email || email,
                  // Try different property names based on your backend
                  roles: tokenPayload.roles ||
                    tokenPayload.authorities ||
                    tokenPayload.role ||
                    [] // Fallback to empty array
                };
              } catch (error) {
                userData = {
                  id: 0,
                  username: email.split('@')[0],
                  email: email,
                  roles: []
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
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (error) {
        console.error('Error parsing user data', error);
        return null;
      }
    }
    return null;
  }
  getCurrentUserId(): number | null {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        return user.id;
      } catch (error) {
        console.error('Error parsing user data', error);
        return null;
      }
    }
    return null;
  }



  private decodeJwtToken(token: string): any {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT token format');
      }

      const base64Payload = parts[1];
      const base64 = base64Payload.replace(/-/g, '+').replace(/_/g, '/');

      const jsonPayload = atob(base64);

      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error decoding JWT:', error);
      return {};
    }


  }
  isAuthenticated(): boolean {
    const token = localStorage.getItem('auth_token');
    return !!token;
  }
}
