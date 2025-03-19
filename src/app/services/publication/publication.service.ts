import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import { Observable } from 'rxjs';

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
  deadlineDate: string;
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

  constructor(private http: HttpClient) { }

  getAllPublications(): Observable<PageResponse<Publication>> {
    return this.http.get<PageResponse<Publication>>(this.apiUrl);
  }

  getPublicationById(id: number): Observable<Publication> {
    return this.http.get<Publication>(`${this.apiUrl}/${id}`);
  }

  createPublication(publication: Publication): Observable<Publication> {
    return this.http.post<Publication>(`${this.apiUrl}/save`, publication);
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

  deletePublication(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
