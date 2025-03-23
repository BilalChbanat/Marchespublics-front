import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../auth/auth.service'; // Adjust the import path as needed

export interface Department {
  id?: number;
  name: string;
  address: string;
  email: string;
  phone: string;
  userId?: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class DepartmentService {
  private apiUrl = 'http://localhost:8080/departments';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  // Helper method to get authenticated headers
  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  getAllDepartments(): Observable<Department[]> {
    return this.http.get<Department[]>(this.apiUrl, { headers: this.getAuthHeaders() });
  }

  getDepartmentById(id: number): Observable<Department> {
    return this.http.get<Department>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
  }

  createDepartment(department: Department): Observable<Department> {
    const currentUserId = this.authService.getCurrentUserId();
    if (!currentUserId) {
      throw new Error('No authenticated user found');
    }

    department.userId = currentUserId;

    return this.http.post<Department>(`${this.apiUrl}/save`, department, { headers: this.getAuthHeaders() });
  }

  updateDepartment(id: number, department: Department): Observable<Department> {
    // Ensure userId is set from the current authenticated user
    const currentUserId = this.authService.getCurrentUserId();
    if (!currentUserId) {
      throw new Error('No authenticated user found');
    }

    department.userId = currentUserId;

    return this.http.put<Department>(`${this.apiUrl}/${id}`, department, { headers: this.getAuthHeaders() });
  }

  deleteDepartment(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
  }

  getDepartmentByUserId(userId: number): Observable<Department> {
    return this.http.get<Department>(`${this.apiUrl}/user/${userId}`);
  }
}
