import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

export interface FileUploadResponse {
  fileName: string;
  filePath: string;
  fileSize: number;
  fileType: string;
}

@Injectable({
  providedIn: 'root'
})
export class FileUploadService {
  private apiUrl = 'http://localhost:8080/files';

  constructor(private http: HttpClient) { }

  uploadFile(file: File): Observable<FileUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<FileUploadResponse>(`${this.apiUrl}/upload`, formData)
      .pipe(
        tap(response => console.log('File upload response:', response)),
        catchError(error => {
          console.error('Error uploading file:', error);
          return throwError(() => new Error('File upload failed. Please try again.'));
        })
      );
  }
}
