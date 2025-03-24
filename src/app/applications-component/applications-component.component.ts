import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApplicationService } from '../services/application/application.service';

@Component({
  selector: 'app-applications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './applications.component.html',
  styleUrls: ['./applications.component.css']
})
export class ApplicationsComponent implements OnInit {
  applications: any[] = [];
  loading = false;
  error = '';

  constructor(private applicationService: ApplicationService) { }

  ngOnInit(): void {
    this.loadApplications();
  }

  loadApplications(): void {
    this.loading = true;
    this.applicationService.getAllApplications().subscribe({
      next: (response) => {
        this.applications = response.content || [];
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading applications:', error);
        this.error = 'Failed to load applications';
        this.loading = false;
      }
    });
  }
}
