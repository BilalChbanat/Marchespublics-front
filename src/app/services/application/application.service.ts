import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {map, Observable} from 'rxjs';

export interface ApplicationDto {
  id?: number;
  publicationId: number;
  companyId: number;
  companyName?: string;
  publicationTitle?: string;
  submissionDate?: string;
  coverLetterPath?: string;
  proposedBudget: number;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApplicationService {
  private apiUrl = 'http://localhost:8080/applications';

  constructor(private http: HttpClient) { }

  apply(applicationData: ApplicationDto): Observable<ApplicationDto> {
    return this.http.post<ApplicationDto>(this.apiUrl, applicationData);
  }

  getAllApplications(page = 0, size = 10): Observable<any> {
    return this.http.get(`${this.apiUrl}?page=${page}&size=${size}`);
  }


  getApplicationById(id: number): Observable<ApplicationDto> {
    return this.http.get<ApplicationDto>(`${this.apiUrl}/${id}`);
  }


  deleteApplication(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  hasApplied(publicationId: number, companyId: number): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/check?publicationId=${publicationId}&companyId=${companyId}`);
  }

  getApplicationsByPublication(publicationId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/publication/${publicationId}`);
  }

  updateApplicationStatus(applicationId: number, status: string): Observable<any> {
    return this.http.patch(
      `${this.apiUrl}/${applicationId}/status?status=${status}`,
      {}
    );
  }


  getApplicationsByCompany(companyId: number, page = 0, size = 20): Observable<any> {
    return this.http.get(`${this.apiUrl}/company/${companyId}?page=${page}&size=${size}`,
      { responseType: 'text' })
      .pipe(
        map(response => {
          try {
            return JSON.parse(response);
          } catch (e) {
            console.error('Error parsing application JSON:', e);
            return { content: [] };
          }
        })
      );
  }

}
