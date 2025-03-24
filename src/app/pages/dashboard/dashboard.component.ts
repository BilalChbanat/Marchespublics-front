import {Component, OnInit} from '@angular/core';
import {CompanyService, Company} from '../../services/company/company.service';
import {DepartmentService, Department} from '../../services/department/department-service.service';
import {ApplicationService, ApplicationDto} from '../../services/application/application.service';
import {NgClass, NgForOf, NgIf, DatePipe} from '@angular/common';
import {PublicationService, Publication} from '../../services/publication/publication.service';
import {CategoryService, Category} from '../../services/category/category.service';
import {RouterModule} from '@angular/router';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [NgClass, NgForOf, NgIf, DatePipe, RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  userCompanies: Company[] = [];
  userPublications: Publication[] = [];
  categories: Category[] = [];
  userDepartment: Department | null = null;
  userApplications: ApplicationDto[] = [];

  selectedPublication: Publication | null = null;
  isViewMode: boolean = true;
  newPublication: Publication | null = null;

  showForm: boolean = false;
  editMode: boolean = false;

  selectedCompanyForEdit: Company | null = null;
  selectedCompanyForView: Company | null = null;
  newCompany: Company | null = null;

  selectedApplicationForView: ApplicationDto | null = null;

  publicationForm: FormGroup;
  isSubmitting: boolean = false;
  departments: any[] = [];

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
    private categoryService: CategoryService,
    private fb: FormBuilder
  ) {
    this.publicationForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      status: ['DRAFT', Validators.required],
      estimatedBudget: [0, [Validators.required, Validators.min(0)]],
      deadlineDate: ['', Validators.required],
      categoryId: ['', Validators.required],
      departmentId: [{ value: '', disabled: true }, Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadUserData();
    this.loadCategories();
    this.loadPublicationApplications();
    this.loadDepartments();
  }

  get f() {
    return this.publicationForm.controls;
  }

  onSubmit(): void {
    if (this.publicationForm.invalid) {
      return;
    }

    this.isSubmitting = true;
    const formData = this.publicationForm.getRawValue();

    formData.departmentId = this.userDepartment?.id || formData.departmentId;

    if (this.editMode && this.selectedPublication) {
      const updatedPublication = {
        ...this.selectedPublication,
        ...formData
      };

      this.publicationService.updatePublication(updatedPublication.id, updatedPublication)
        .subscribe({
          next: () => {
            this.loadUserPublications();
            this.toggleForm();
            this.isSubmitting = false;
          },
          error: (error) => {
            console.error('Error updating publication:', error);
            this.isSubmitting = false;
          }
        });
    } else {
      this.publicationService.createPublication(formData)
        .subscribe({
          next: () => {
            this.loadUserPublications();
            this.toggleForm();
            this.isSubmitting = false;
          },
          error: (error) => {
            console.error('Error creating publication:', error);
            this.isSubmitting = false;
          }
        });
    }
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


  showCompanyDetailsModal(company: Company): void {
    this.selectedCompanyForView = {...company};
  }

  showEditCompanyModal(company: Company): void {
    this.selectedCompanyForEdit = {...company}; // Clone to avoid direct binding
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

  showPublicationModal(publication: Publication): void {
    this.selectedPublication = {...publication};
    this.isViewMode = true;
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
    this.selectedDepartmentForEdit = {...department};
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

  publicationApplications: any[] = [];
  publicationApplicationsLoading = false;
  publicationApplicationsError = '';

  loadPublicationApplications(): void {
    this.publicationApplicationsLoading = true;

    this.publicationService.getPublicationsByUserId(this.getCurrentUserId()).subscribe({
      next: (publications) => {
        if (publications && publications.length > 0) {
          const publicationIds = publications.map(pub => pub.id!);

          let allApplications: any[] = [];
          let completedRequests = 0;

          publicationIds.forEach(pubId => {
            this.applicationService.getApplicationsByPublication(pubId).subscribe({
              next: (response) => {
                if (response && response.content) {
                  allApplications = [...allApplications, ...response.content];
                } else if (Array.isArray(response)) {
                  allApplications = [...allApplications, ...response];
                }

                if (++completedRequests === publicationIds.length) {
                  this.publicationApplications = allApplications;
                  this.publicationApplicationsLoading = false;
                }
              },
              error: (error) => {
                console.error(`Error loading applications for publication ${pubId}:`, error);
                if (++completedRequests === publicationIds.length) {
                  this.publicationApplicationsLoading = false;
                  this.publicationApplicationsError = 'Failed to load applications';
                }
              }
            });
          });
        } else {
          this.publicationApplications = [];
          this.publicationApplicationsLoading = false;
        }
      },
      error: (error) => {
        console.error('Error loading publications for applications:', error);
        this.publicationApplicationsError = 'Failed to load publications';
        this.publicationApplicationsLoading = false;
      }
    });
  }

  updateApplicationStatus(applicationId: number, newStatus: string): void {
    if (newStatus === 'REJECTED' && !confirm('Are you sure you want to reject this application?')) {
      return;
    }

    this.applicationService.updateApplicationStatus(applicationId, newStatus).subscribe({
      next: (updatedApp) => {
        const index = this.publicationApplications.findIndex(app => app.id === applicationId);
        if (index !== -1) {
          this.publicationApplications[index] = {
            ...this.publicationApplications[index],
            status: newStatus
          };
        }
        alert(`Application ${newStatus.toLowerCase()} successfully`);
      },
      error: (error) => {
        console.error('Error updating application status:', error);
        alert('Failed to update application status');
      }
    });
  }

  showAddPublicationModal(): void {
    this.editMode = false;
    this.resetForm();
    this.showForm = true;
  }

  loadDepartments(): void {
    this.departmentService.getAllDepartments().subscribe({
      next: (departments) => {
        this.departments = departments;
      },
      error: (error) => {
        console.error('Error loading departments:', error);
      }
    });
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
  }

  resetForm(): void {
    this.publicationForm.reset({
      title: '',
      description: '',
      status: 'DRAFT',
      estimatedBudget: 0,
      deadlineDate: this.formatDateForInput(new Date()),
      categoryId: this.categories.length > 0 ? this.categories[0].id : '',
      departmentId: this.userDepartment?.id || ''
    });
  }

  populateForm(publication: Publication): void {
    this.publicationForm.setValue({
      title: publication.title,
      description: publication.description,
      status: publication.status,
      estimatedBudget: publication.estimatedBudget,
      deadlineDate: this.formatDateForInput(new Date(publication.deadlineDate || new Date())),
      categoryId: publication.categoryId,
      departmentId: publication.departmentId
    });
  }

  formatDateForInput(date: Date): string {
    return date.toISOString().slice(0, 16);
  }
}
