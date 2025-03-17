import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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

export interface Company {
  id?: number;
  name: string;
  address: string;
  employeesNumber: number;
  registrationDate: string;
  email: string;
}

@Injectable({
  providedIn: 'root'
})
export class CompanyService {
  private apiUrl = 'http://localhost:8080/companies';

  constructor(private http: HttpClient) { }

  getAllCompanies(): Observable<PageResponse<Company>> {
    return this.http.get<PageResponse<Company>>(this.apiUrl);
  }

  getCompanyById(id: number): Observable<Company> {
    return this.http.get<Company>(`${this.apiUrl}/${id}`);
  }

  createCompany(company: Company): Observable<Company> {
    return this.http.post<Company>(`${this.apiUrl}/save`, company);
  }

  updateCompany(id: number, company: Company): Observable<Company> {
    return this.http.put<Company>(`${this.apiUrl}/${id}`, company);
  }

  deleteCompany(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
