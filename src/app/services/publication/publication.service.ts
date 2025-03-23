import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {map, Observable, tap, throwError} from 'rxjs';
import {catchError} from 'rxjs/operators';
import {AuthService} from '../auth/auth.service';

export interface PageResponse<T> {
  content: T[];
  pageable: any;
  last: boolean;
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  sort: any;
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}

export interface Publication {
  id?: number;
  title: string;
  description: string;
  deadlineDate: string | null;
  estimatedBudget: number;
  categoryId: number;
  departmentId: number;
  status: string;
  department?: {
    id: number;
    name: string;
  };
  category?: {
    id: number;
    name: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class PublicationService {
  private apiUrl = 'http://localhost:8080/pubs';

  constructor(private http: HttpClient, private authService: AuthService) { }

  getAllPublications(page: number = 0, size: number = 190): Observable<any> {
    return this.http.get(`${this.apiUrl}?page=${page}&size=${size}`);
  }

  getPublicationById(id: number): Observable<Publication> {
    return this.http.get<Publication>(`${this.apiUrl}/${id}`);
  }

  createPublication(publication: Publication): Observable<Publication> {
    const token = this.authService.getToken();

    if (!token) {
      return throwError(() => new Error('No authentication token found'));
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });

    const formattedPublication = {
      ...publication,
      deadlineDate: publication.deadlineDate ?
        new Date(publication.deadlineDate).toISOString() :
        null
    };

    return this.http.post<Publication>(`${this.apiUrl}/save`, formattedPublication, {
      headers
    }).pipe(
      tap(response => console.log('Publication created:', response)),
      catchError(error => {
        console.error('Error creating publication:', error);
        return throwError(() => error);
      })
    );
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }


  updatePublication(id: number, publication: Publication): Observable<Publication> {
    return this.http.put<Publication>(
      `${this.apiUrl}/${id}`,
      publication,
      { headers: this.getHeaders() }
    );
  }

  getPublicationsByUserId(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/user/${userId}`);
  }

  getPublicationsByDepartmentId(departmentId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/department/${departmentId}`);
  }

  deletePublication(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  updateApplicationStatus(applicationId: number, status: string): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.authService.getToken()}`
    });

    // Using PUT instead of PATCH to match the backend
    return this.http.put<any>(
      `${this.apiUrl}/${applicationId}/status?status=${status}`,
      {},
      { headers }
    );
  }
}
