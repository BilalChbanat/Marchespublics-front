// dashboard.component.ts
import {Component, OnInit} from '@angular/core';
import {CompanyService, Company} from '../../services/company/company.service';
import {DepartmentService, Department} from '../../services/department/department-service.service';
import {ApplicationService, ApplicationDto} from '../../services/application/application.service';
import {NgClass, NgForOf, NgIf, DatePipe} from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [NgClass, NgForOf, NgIf, DatePipe],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  userCompanies: Company[] = [];
  userDepartment: Department | null = null;
  userApplications: ApplicationDto[] = [];
  loading = {
    companies: false,
    department: false,
    applications: false
  };
  error = {
    companies: '',
    department: '',
    applications: ''
  };

  constructor(
    private companyService: CompanyService,
    private departmentService: DepartmentService,
    private applicationService: ApplicationService
  ) {
  }

  ngOnInit(): void {
    this.loadUserData();
  }

  loadUserData(): void {
    this.loadUserCompanies();
    this.loadUserDepartment();
    this.loadUserApplications();
  }

  loadUserCompanies(): void {
    this.loading.companies = true;
    const userId = this.getCurrentUserId();

    // Assuming you've added a method to get companies by user ID
    this.companyService.getCompaniesByUserId(userId).subscribe({
      next: (companies) => {
        this.userCompanies = companies;
        this.loading.companies = false;
      },
      error: (error) => {
        console.error('Error loading user companies:', error);
        this.error.companies = 'Failed to load your companies';
        this.loading.companies = false;
      }
    });
  }

  loadUserDepartment(): void {
    this.loading.department = true;
    const userId = this.getCurrentUserId();

    // Assuming you've added a method to get department by user ID
    this.departmentService.getDepartmentByUserId(userId).subscribe({
      next: (department) => {
        this.userDepartment = department;
        this.loading.department = false;
      },
      error: (error) => {
        console.error('Error loading user department:', error);
        this.error.department = 'Failed to load your department';
        this.loading.department = false;
      }
    });
  }

  recentActivities: any[] = [
    {
      icon: '📝',
      title: 'Application Submitted',
      description: 'You submitted an application for "Office Renovation Project"',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
    },
    {
      icon: '✅',
      title: 'Application Accepted',
      description: 'Your application for "Software Development" was accepted',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    }
  ];

  stats = {
    applicationGrowth: 15,
    successRate: 75,
    acceptedApplications: 0,
    averageBudget: 0
  };

  calculateStats(): void {
    if (this.userApplications.length > 0) {
      this.stats.acceptedApplications = this.userApplications.filter(app =>
        app.status === 'ACCEPTED'
      ).length;

      this.stats.successRate = Math.round(
        (this.stats.acceptedApplications / this.userApplications.length) * 100
      );

      const totalBudget = this.userApplications.reduce(
        (sum, app) => sum + (app.proposedBudget || 0), 0
      );
      this.stats.averageBudget = totalBudget / this.userApplications.length;
    } else {
      this.stats.acceptedApplications = 0;
      this.stats.successRate = 0;
      this.stats.averageBudget = 0;
    }
  }

  // In dashboard.component.ts, modify the loadUserApplications method
  loadUserApplications(): void {
    this.loading.applications = true;
    const userId = this.getCurrentUserId();
    console.log('Loading applications for user ID:', userId);

    this.companyService.getCompaniesByUserId(userId).subscribe({
      next: (companies) => {
        console.log('User companies:', companies);
        if (companies && companies.length > 0) {
          const companyIds = companies.map(company => company.id!);
          console.log('Company IDs:', companyIds);

          let allApplications: ApplicationDto[] = [];
          let completedRequests = 0;

          companyIds.forEach(companyId => {
            console.log('Fetching applications for company ID:', companyId);

            // Let's inspect the exact URL being called
            const url = `${this.applicationService['apiUrl']}/company/${companyId}`;
            console.log('Calling endpoint:', url);

            this.applicationService.getApplicationsByCompany(companyId).subscribe({
              next: (response) => {
                console.log('Raw response for company ID ' + companyId + ':', response);
                console.log('Response type:', typeof response);

                try {
                  // Handle different response formats
                  if (response && response.content && Array.isArray(response.content)) {
                    console.log('Processing paginated response:', response.content);
                    allApplications = [...allApplications, ...response.content];
                  } else if (Array.isArray(response)) {
                    console.log('Processing array response:', response);
                    allApplications = [...allApplications, ...response];
                  } else if (response && typeof response === 'object') {
                    console.log('Processing object response:', response);
                    // Check if it's a Page object without a content property
                    if (response.hasOwnProperty('pageable') && response.hasOwnProperty('totalElements')) {
                      console.log('Detected Page object without content property');
                      // This might be a Spring Data Page serialized differently
                      allApplications.push(response);
                    } else {
                      // It's likely a single application
                      allApplications.push(response);
                    }
                  }
                } catch (err) {
                  console.error('Error processing applications response:', err);
                }

                completedRequests++;
                console.log(`Completed ${completedRequests} of ${companyIds.length} requests`);

                if (completedRequests === companyIds.length) {
                  console.log('Final applications:', allApplications);
                  console.log('Number of applications:', allApplications.length);
                  this.userApplications = allApplications;
                  this.loading.applications = false;
                  this.calculateStats();
                }
              },
              error: (error) => {
                console.error(`Error loading applications for company ${companyId}:`, error);
                console.error('Full error details:', JSON.stringify(error));
                completedRequests++;

                if (completedRequests === companyIds.length) {
                  this.loading.applications = false;
                  this.calculateStats();
                }
              }
            });
          });
        } else {
          console.log('No companies found for user.');
          this.userApplications = [];
          this.loading.applications = false;
          this.calculateStats();
        }
      },
      error: (error) => {
        console.error('Error loading user companies for applications:', error);
        this.error.applications = 'Failed to load your applications';
        this.loading.applications = false;
      }
    });
  }

  getCurrentUserId(): number {
    const userJson = localStorage.getItem('user');
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        if (user && user.id) {
          return user.id;
        }
      } catch (e) {
        console.error('Error parsing user data', e);
      }
    }
    return 0; // Default value, handle appropriately in your application
  }

  // Helper method to format currency values
  formatBudget(budget: number): string {
    return new Intl.NumberFormat('fr-MA', {style: 'currency', currency: 'MAD'}).format(budget);
  }
}
