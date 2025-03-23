import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {NgClass, NgForOf, NgIf, DatePipe} from '@angular/common';
import {PublicationService, Publication} from '../services/publication/publication.service';
import {DepartmentService, Department} from '../services/department/department-service.service';
import {CategoryService, Category} from '../services/category/category.service';
import {ApplicationDto, ApplicationService} from '../services/application/application.service';
import {FileUploadService} from '../services/file-upload/file-upload.service';
import {CompanyService} from '../services/company/company.service';
import {AuthService} from '../services/auth/auth.service';

@Component({
  selector: 'app-publication',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgClass,
    NgIf,
    NgForOf,
    DatePipe,
    FormsModule
  ],
  templateUrl: './publication.component.html',
  styleUrls: ['./publication.component.css']
})
export class PublicationComponent implements OnInit {
  publicationForm: FormGroup;
  publications: Publication[] = [];
  filteredPublications: Publication[] = [];
  departments: Department[] = [];
  categories: Category[] = [];
  isSubmitting = false;
  showForm = false;
  editMode = false;
  currentPublicationId: number | null = null;
  successMessage = '';
  errorMessage = '';

  currentPage = 1;
  pageSize = 9;
  totalItems = 0;

  searchFilter = '';
  categoryFilter = '';
  statusFilter = '';

  selectedPublication: Publication | null = null;
  showApplicationForm = false;
  coverLetterFile: File | null = null;
  applicationSubmitting = false;
  applicationSuccessMessage = '';
  applicationErrorMessage = '';

  applicationData = {
    proposedBudget: null as number | null,
    coverLetterPath: '',
    publicationId: null as number | null,
    companyId: null as number | null
  };

  constructor(
    private fb: FormBuilder,
    private publicationService: PublicationService,
    private departmentService: DepartmentService,
    private categoryService: CategoryService,
    private applicationService: ApplicationService,
    private fileUploadService: FileUploadService,
    private companyService: CompanyService,
    private authService: AuthService
  ) {
    this.publicationForm = this.fb.group({
      title: ['', [Validators.required]],
      description: ['', [Validators.required]],
      deadlineDate: ['', [Validators.required]],
      estimatedBudget: ['', [Validators.required, Validators.min(0)]],
      categoryId: ['', [Validators.required]],
      departmentId: ['', [Validators.required]],
      status: ['DRAFT', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.loadPublications();
    this.loadDepartments();
    this.loadCategories();
  }

  loadPublications(): void {
    console.log('Fetching publications...');
    this.publicationService.getAllPublications().subscribe({
      next: (response: any) => {
        if (response && response.content) {
          this.publications = response.content;
          console.log(this.publications.length);
          this.applyFilters();
          this.totalItems = response.totalElements;
        } else {
          this.publications = [];
          this.filteredPublications = [];
          this.totalItems = 0;
          console.warn('No content property found in response');
        }
      },
      error: (error) => {
        console.error('Error loading publications:', error);
        this.errorMessage = 'Failed to load publications. Please try again.';
      }
    });
  }

  loadDepartments(): void {
    this.departmentService.getAllDepartments().subscribe({
      next: (response: any) => {
        if (response && response.content) {
          this.departments = response.content;
        }
      },
      error: (error) => {
        console.error('Error loading departments:', error);
      }
    });
  }

  loadCategories(): void {
    this.categoryService.getAllCategories().subscribe({
      next: (response: any) => {
        if (response && response.content) {
          this.categories = response.content;
        }
      },
      error: (error) => {
        console.error('Error loading categories:', error);
      }
    });
  }

  applyForPublication(publication: any, event: Event): void {
    event.stopPropagation();
    this.showPublicationModal(publication);
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
    if (!this.showForm) {
      this.resetForm();
    }
  }

  resetForm(): void {
    this.publicationForm.reset();
    this.editMode = false;
    this.currentPublicationId = null;
    this.successMessage = '';
    this.errorMessage = '';
  }

  onSubmit(): void {
    if (this.publicationForm.invalid) {
      Object.keys(this.publicationForm.controls).forEach(key => {
        this.publicationForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const currentUserId = this.authService.getCurrentUserId();
    if (!currentUserId) {
      this.errorMessage = 'Please log in to create a publication';
      this.isSubmitting = false;
      return;
    }

    // First, fetch the user's department
    this.departmentService.getDepartmentByUserId(currentUserId).subscribe({
      next: (department) => {
        const formValues = this.publicationForm.value;

        const publicationData: Publication = {
          ...formValues,
          departmentId: department.id, // Use the fetched department ID
          categoryId: Number(formValues.categoryId),
          estimatedBudget: Number(formValues.estimatedBudget),
          deadlineDate: formValues.deadlineDate
            ? new Date(formValues.deadlineDate).toISOString()
            : null
        };

        this.publicationService.createPublication(publicationData).subscribe({
          next: (response) => {
            this.handleSuccess('Publication created successfully!');
            this.loadPublications();
          },
          error: (error) => {
            console.error('Full error object:', error);
            console.error('Error status:', error.status);
            console.error('Error message:', error.error?.message);
            console.error('Error details:', error.error);

            if (error.status === 403) {
              this.errorMessage = 'You do not have permission to create a publication. Please check your authentication.';
            } else if (error.status === 401) {
              this.errorMessage = 'Authentication failed. Please log in again.';
            } else {
              this.errorMessage = error.error?.message || 'An unexpected error occurred.';
            }

            this.isSubmitting = false;
          }
        });
      },
      error: (error) => {
        console.error('Error fetching department:', error);
        this.errorMessage = 'Unable to fetch your department. Please ensure you are assigned to a department.';
        this.isSubmitting = false;
      }
    });
  }

  editPublication(publication: Publication, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    this.showForm = true;
    this.editMode = true;
    this.currentPublicationId = publication.id!;

    const deadlineDate = publication.deadlineDate
      ? new Date(publication.deadlineDate)
      : null;
    const formattedDate = deadlineDate
      ? deadlineDate.toISOString().split('T')[0]
      : null;

    this.publicationForm.patchValue({
      title: publication.title,
      description: publication.description,
      deadlineDate: formattedDate,
      estimatedBudget: publication.estimatedBudget,
      categoryId: publication.categoryId,
      departmentId: publication.departmentId,
      status: publication.status
    });
  }

  deletePublication(id: number, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    if (confirm('Are you sure you want to delete this publication?')) {
      this.publicationService.deletePublication(id).subscribe({
        next: () => {
          this.successMessage = 'Publication deleted successfully!';
          this.loadPublications();
        },
        error: (error) => {
          console.error('Error deleting publication:', error);
          this.errorMessage = 'Failed to delete publication. Please try again.';
        }
      });
    }
  }

  applyFilters(): void {
    let result = [...this.publications];

    if (this.statusFilter) {
      result = result.filter(pub => pub.status === this.statusFilter);
    }

    if (this.searchFilter) {
      const search = this.searchFilter.toLowerCase();
      result = result.filter(pub =>
        pub.title.toLowerCase().includes(search) ||
        pub.description.toLowerCase().includes(search)
      );
    }

    if (this.categoryFilter) {
      result = result.filter(pub => pub.categoryId.toString() === this.categoryFilter);
    }

    this.filteredPublications = result;
  }

  onSearchChange(event: Event): void {
    this.searchFilter = (event.target as HTMLInputElement).value;
    this.applyFilters();
  }

  onCategoryFilterChange(event: Event): void {
    this.categoryFilter = (event.target as HTMLSelectElement).value;
    this.applyFilters();
  }

  onStatusFilterChange(event: Event): void {
    this.statusFilter = (event.target as HTMLSelectElement).value;
    this.applyFilters();
  }

  get totalPages(): number {
    return Math.ceil(this.filteredPublications.length / this.pageSize);
  }

  get paginatedPublications(): Publication[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredPublications.slice(startIndex, startIndex + this.pageSize);
  }

  setPage(page: number): void {
    if (page < 1 || page > this.totalPages) {
      return;
    }
    this.currentPage = page;
  }

  get pages(): number[] {
    const pages = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  formatBudget(budget: number): string {
    return new Intl.NumberFormat('fr-MA', {style: 'currency', currency: 'MAD'}).format(budget);
  }

  getDepartmentName(departmentId: number): string {
    const department = this.departments.find(d => d.id === departmentId);
    return department ? department.name : 'Unknown Department';
  }

  getCategoryName(categoryId: number): string {
    const category = this.categories.find(c => c.id === categoryId);
    return category ? category.name : 'Unknown Category';
  }

  formatDate(date: string): string {
    const d = new Date(date);
    return d.toLocaleDateString('fr-MA', {day: '2-digit', month: 'short', year: 'numeric'});
  }

  private handleSuccess(message: string): void {
    this.isSubmitting = false;
    this.successMessage = message;
    this.resetForm();

    setTimeout(() => {
      this.showForm = false;
    }, 1000);
  }

  private handleError(error: any): void {
    this.isSubmitting = false;
    console.error('Error submitting publication:', error);
    console.error('Error status:', error.status);
    console.error('Error details:', error.error);

    if (error.error && error.error.message) {
      this.errorMessage = error.error.message;
    } else if (error.status === 403) {
      this.errorMessage = 'You do not have permission to perform this action.';
    } else {
      this.errorMessage = 'An error occurred. Please try again.';
    }
  }

  checkUserRole(): void {
    const token = localStorage.getItem('auth_token');
    if (token) {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));

      const payload = JSON.parse(jsonPayload);
      console.log('Token payload:', payload);
      console.log('User roles:', payload.roles || payload.role || 'No role found in token');
    }
  }

  get f() {
    return this.publicationForm.controls;
  }

  protected readonly Math = Math;

  showPublicationModal(publication: Publication): void {
    this.selectedPublication = publication;
    this.resetApplicationData();
  }

  closeModal(): void {
    this.selectedPublication = null;
    this.showApplicationForm = false;
    this.resetApplicationData();
  }

  resetApplicationData(): void {
    this.applicationData = {
      proposedBudget: null,
      coverLetterPath: '',
      publicationId: null,
      companyId: null
    };
    this.coverLetterFile = null;
    this.applicationSuccessMessage = '';
    this.applicationErrorMessage = '';
  }

  toggleApplicationForm(): void {
    this.showApplicationForm = true;
    if (this.selectedPublication && this.selectedPublication.id) {
      this.applicationData.publicationId = this.selectedPublication.id;
      this.applicationData.companyId = this.getCurrentUserCompanyId();
    }
  }

  cancelApplication(): void {
    this.showApplicationForm = false;
    this.resetApplicationData();
  }

  onFileSelected(event: any): void {
    if (event.target.files.length > 0) {
      this.coverLetterFile = event.target.files[0];
    }
  }

  submitApplication(): void {
    if (!this.applicationData.proposedBudget || !this.coverLetterFile) {
      this.applicationErrorMessage = 'Please fill all required fields';
      return;
    }

    this.applicationSubmitting = true;
    this.applicationErrorMessage = '';
    this.applicationSuccessMessage = '';

    console.log('Uploading file:', this.coverLetterFile);

    // First upload the file
    this.fileUploadService.uploadFile(this.coverLetterFile).subscribe({
      next: (response) => {
        console.log('File upload complete, response:', response);

        if (response && response.filePath) {
          this.applicationData.coverLetterPath = response.filePath;

          // Get the current user ID from localStorage
          const userJson = localStorage.getItem('user');
          if (!userJson) {
            this.applicationSubmitting = false;
            this.applicationErrorMessage = 'You must be logged in to submit an application';
            return;
          }

          const user = JSON.parse(userJson);
          const userId = user.id;

          this.companyService.getCompaniesByUserId(userId).subscribe({
            next: (companies) => {
              if (companies && companies.length > 0) {
                // Use the first company associated with this user
                this.applicationData.companyId = companies[0].id ?? null;
                console.log('Using company ID:', this.applicationData.companyId);
                this.createApplication();
              } else {
                this.applicationSubmitting = false;
                this.applicationErrorMessage = 'No company found for your account. Please create a company first.';
              }
            },
            error: (error) => {
              console.error('Error fetching user company:', error);
              this.applicationSubmitting = false;
              this.applicationErrorMessage = 'Failed to retrieve your company information.';
            }
          });
        } else {
          console.error('File upload response missing filePath:', response);
          this.applicationSubmitting = false;
          this.applicationErrorMessage = 'Error processing uploaded file. Please try again.';
        }
      },
      error: (error) => {
        console.error('File upload error:', error);
        this.applicationSubmitting = false;
        this.applicationErrorMessage = 'Failed to upload file: ' + (error.message || 'Unknown error');
      }
    });
  }

  createApplication(): void {
    // Make sure we have all required data before proceeding
    if (!this.applicationData.publicationId || !this.applicationData.companyId ||
      !this.applicationData.proposedBudget || !this.applicationData.coverLetterPath) {
      this.applicationSubmitting = false;
      this.applicationErrorMessage = 'Missing required application data';
      return;
    }

    const applicationDto: ApplicationDto = {
      publicationId: this.applicationData.publicationId,
      companyId: this.applicationData.companyId,
      proposedBudget: this.applicationData.proposedBudget,
      coverLetterPath: this.applicationData.coverLetterPath
    };

    this.applicationService.apply(applicationDto).subscribe({
      next: (response) => {
        this.applicationSubmitting = false;
        this.applicationSuccessMessage = 'Application submitted successfully!';

        // Close modal after delay
        setTimeout(() => {
          this.closeModal();
        }, 2000);
      },
      error: (error) => {
        this.applicationSubmitting = false;
        console.error('Error submitting application:', error);

        if (error.error && error.error.message) {
          this.applicationErrorMessage = error.error.message;
        } else {
          this.applicationErrorMessage = 'Failed to submit application. Please try again.';
        }
      }
    });
  }

  getCurrentUserCompanyId(): number {
    // Replace this with your actual logic to get the company ID
    const userData = localStorage.getItem('user_data');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        return user.companyId;
      } catch (e) {
        console.error('Error parsing user data', e);
      }
    }
    return 2; // Change this to a valid company ID that exists in your database
  }
}
