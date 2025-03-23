import { Component, OnInit } from '@angular/core';
import { CompanyService, Company } from '../../services/company/company.service';
import { DepartmentService, Department } from '../../services/department/department-service.service';
import { ApplicationService, ApplicationDto } from '../../services/application/application.service';
import { NgClass, NgForOf, NgIf, DatePipe } from '@angular/common';
import { PublicationService, Publication } from '../../services/publication/publication.service';
import { CategoryService, Category } from '../../services/category/category.service';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [NgClass, NgForOf, NgIf, DatePipe, RouterModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  userCompanies: Company[] = [];
  userPublications: Publication[] = [];
  categories: Category[] = [];
  userDepartment: Department | null = null;
  userApplications: ApplicationDto[] = [];

  // Modal state variables
  selectedPublication: Publication | null = null;
  isViewMode: boolean = true; // Controls if publication modal is in view or edit mode
  newPublication: Publication | null = null; // For adding new publication

  selectedCompanyForEdit: Company | null = null;
  selectedCompanyForView: Company | null = null;
  newCompany: Company | null = null;

  selectedApplicationForView: ApplicationDto | null = null;

  loading = {
    companies: false,
    department: false,
    applications: false,
    publications: false
  };

  error = {
    companies: '',
    department: '',
    applications: '',
    publications: ''
  };

  stats = {
    applicationGrowth: 15,
    successRate: 75,
    acceptedApplications: 0,
    averageBudget: 0
  };

  recentActivities = [
    {
      icon: '📝',
      title: 'Application Submitted',
      description: 'You submitted an application for "Office Renovation Project"',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000)
    },
    {
      icon: '✅',
      title: 'Application Accepted',
      description: 'Your application for "Software Development" was accepted',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    }
  ];

  constructor(
    private companyService: CompanyService,
    private departmentService: DepartmentService,
    private applicationService: ApplicationService,
    private publicationService: PublicationService,
    private categoryService: CategoryService
  ) {}

  ngOnInit(): void {
    this.loadUserData();
    this.loadCategories();
  }

  private loadUserData(): void {
    this.loadUserCompanies();
    this.loadUserDepartment();
    this.loadUserApplications();
    this.loadUserPublications();
  }

  private loadUserCompanies(): void {
    this.loading.companies = true;
    this.companyService.getCompaniesByUserId(this.getCurrentUserId()).subscribe({
      next: (companies) => {
        this.userCompanies = companies;
        this.loading.companies = false;
      },
      error: (error) => {
        this.handleError('companies', 'Failed to load companies', error);
      }
    });
  }

  private loadUserPublications(): void {
    this.loading.publications = true;
    this.publicationService.getPublicationsByUserId(this.getCurrentUserId()).subscribe({
      next: (publications) => {
        this.userPublications = publications;
        this.loading.publications = false;
      },
      error: (error) => {
        this.handleError('publications', 'Failed to load publications', error);
      }
    });
  }

  private loadUserDepartment(): void {
    this.loading.department = true;
    this.departmentService.getDepartmentByUserId(this.getCurrentUserId()).subscribe({
      next: (department) => {
        this.userDepartment = department;
        this.loading.department = false;
      },
      error: (error) => {
        this.handleError('department', 'Failed to load department', error);
      }
    });
  }

  private loadUserApplications(): void {
    this.loading.applications = true;
    this.companyService.getCompaniesByUserId(this.getCurrentUserId()).subscribe({
      next: (companies) => {
        if (companies.length > 0) {
          this.loadApplicationsForCompanies(companies);
        } else {
          this.loading.applications = false;
        }
      },
      error: (error) => {
        this.handleError('applications', 'Failed to load applications', error);
      }
    });
  }

  private loadApplicationsForCompanies(companies: Company[]): void {
    const companyIds = companies.map(company => company.id!);
    let allApplications: ApplicationDto[] = [];
    let completedRequests = 0;

    companyIds.forEach(companyId => {
      this.applicationService.getApplicationsByCompany(companyId).subscribe({
        next: (response) => {
          if (response.content) {
            allApplications = [...allApplications, ...response.content];
          }
          if (++completedRequests === companyIds.length) {
            this.userApplications = allApplications;
            this.calculateStats();
            this.loading.applications = false;
          }
        },
        error: (error) => {
          if (++completedRequests === companyIds.length) {
            this.loading.applications = false;
            this.calculateStats();
          }
        }
      });
    });
  }

  private loadCategories(): void {
    this.categoryService.getAllCategories().subscribe({
      next: (response) => {
        if (response.content) this.categories = response.content;
      },
      error: (error) => console.error('Error loading categories:', error)
    });
  }

  private calculateStats(): void {
    this.stats.acceptedApplications = this.userApplications.filter(
      app => app.status === 'ACCEPTED'
    ).length;

    this.stats.successRate = this.userApplications.length > 0
      ? Math.round((this.stats.acceptedApplications / this.userApplications.length) * 100)
      : 0;

    this.stats.averageBudget = this.userApplications.length > 0
      ? this.userApplications.reduce((sum, app) => sum + (app.proposedBudget || 0), 0) / this.userApplications.length
      : 0;
  }

  // Company actions
  showCompanyDetailsModal(company: Company): void {
    this.selectedCompanyForView = { ...company };
  }

  showEditCompanyModal(company: Company): void {
    this.selectedCompanyForEdit = { ...company }; // Clone to avoid direct binding
    this.selectedCompanyForView = null; // Close view modal if open
  }

  showAddCompanyModal(): void {
    // Initialize new company with default values
    this.newCompany = {
      name: '',
      address: '',
      employeesNumber: 0,
      registrationDate: new Date().toISOString(),
      email: '',
      userId: this.getCurrentUserId()
    };
  }

  closeCompanyEditModal(): void {
    this.selectedCompanyForEdit = null;
  }

  closeCompanyViewModal(): void {
    this.selectedCompanyForView = null;
  }

  closeCompanyModal(): void {
    this.selectedCompanyForEdit = null;
    this.selectedCompanyForView = null;
    this.newCompany = null;
  }

  saveCompany(): void {
    if (this.selectedCompanyForEdit && this.selectedCompanyForEdit.id) {
      this.companyService.updateCompany(this.selectedCompanyForEdit.id, this.selectedCompanyForEdit).subscribe({
        next: () => {
          this.loadUserCompanies();
          this.closeCompanyEditModal();
        },
        error: (error) => {
          console.error('Error updating company:', error);
        }
      });
    }
  }

  saveNewCompany(): void {
    if (this.newCompany) {
      this.companyService.createCompany(this.newCompany).subscribe({
        next: () => {
          this.loadUserCompanies();
          this.closeCompanyModal();
        },
        error: (error) => {
          console.error('Error creating company:', error);
        }
      });
    }
  }

  deleteCompany(id: number): void {
    if (confirm('Are you sure you want to delete this company?')) {
      this.companyService.deleteCompany(id).subscribe({
        next: () => this.loadUserCompanies(),
        error: (error) => console.error('Delete failed:', error)
      });
    }
  }

  // Publication actions
  showPublicationModal(publication: Publication): void {
    this.selectedPublication = {...publication};
    this.isViewMode = true;
  }

  showAddPublicationModal(): void {
    // Initialize new publication with default values
    this.newPublication = {
      title: '',
      description: '',
      deadlineDate: new Date().toISOString(),
      estimatedBudget: 0,
      categoryId: this.categories.length > 0 ? this.categories[0].id : 0,
      departmentId: this.userDepartment?.id || 0,
      status: 'DRAFT'
    };
  }

  deletePublication(id: number): void {
    if (confirm('Are you sure you want to delete this publication?')) {
      this.publicationService.deletePublication(id).subscribe({
        next: () => this.loadUserPublications(),
        error: (error) => console.error('Delete failed:', error)
      });
    }
  }

  // Application actions
  showApplicationModal(application: ApplicationDto): void {
    this.selectedApplicationForView = application;
  }

  closeApplicationModal(): void {
    this.selectedApplicationForView = null;
  }

  getCurrentUserId(): number {
    const userJson = localStorage.getItem('user');
    return userJson ? JSON.parse(userJson).id : 0;
  }

  formatBudget(budget: number): string {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD'
    }).format(budget);
  }

  getCategoryName(categoryId: number): string {
    const category = this.categories.find(c => c.id === categoryId);
    return category?.name || 'Unknown Category';
  }

  private handleError(field: keyof typeof this.error, message: string, error: any): void {
    console.error(message, error);
    this.error[field] = message;
    this.loading[field] = false;
  }

  showEditPublicationModal(publication: Publication): void {
    this.selectedPublication = {...publication};
    this.isViewMode = false;
  }

  closeModal(): void {
    this.selectedPublication = null;
    this.newPublication = null;
    this.isViewMode = true;
  }

  savePublication(): void {
    if (this.selectedPublication && this.selectedPublication.id) {
      this.publicationService.updatePublication(this.selectedPublication.id, this.selectedPublication)
        .subscribe({
          next: () => {
            this.loadUserPublications();
            this.closeModal();
          },
          error: (error) => {
            console.error('Error updating publication:', error);
          }
        });
    }
  }

  saveNewPublication(): void {
    if (this.newPublication) {
      this.newPublication.departmentId = this.getCurrentUserId();
      this.publicationService.createPublication(this.newPublication)
        .subscribe({
          next: () => {
            this.loadUserPublications();
            this.closeModal();
          },
          error: (error) => {
            console.error('Error creating publication:', error);
            // Add error handling logic here
          }
        });
    }
  }

  selectedDepartmentForEdit: Department | null = null;

  showEditDepartmentModal(department: Department): void {
    this.selectedDepartmentForEdit = { ...department };
  }

  closeDepartmentEditModal(): void {
    this.selectedDepartmentForEdit = null;
  }

  saveDepartment(): void {
    if (this.selectedDepartmentForEdit && this.selectedDepartmentForEdit.id) {
      this.departmentService.updateDepartment(this.selectedDepartmentForEdit.id, this.selectedDepartmentForEdit).subscribe({
        next: () => {
          this.loadUserDepartment();
          this.closeDepartmentEditModal();
        },
        error: (error) => {
          console.error('Error updating department:', error);
        }
      });
    }
  }
}
