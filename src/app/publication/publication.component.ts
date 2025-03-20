import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgClass, NgForOf, NgIf, DatePipe } from '@angular/common';
import { PublicationService, Publication } from '../services/publication/publication.service';
import { DepartmentService, Department } from '../services/department/department-service.service';
import { CategoryService, Category } from '../services/category/category.service';

@Component({
  selector: 'app-publication',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgClass,
    NgIf,
    NgForOf,
    DatePipe
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

  // Pagination
  currentPage = 1;
  pageSize = 6;
  totalItems = 0;

  // Filters
  searchFilter = '';
  categoryFilter = '';
  statusFilter = '';

  constructor(
    private fb: FormBuilder,
    private publicationService: PublicationService,
    private departmentService: DepartmentService,
    private categoryService: CategoryService
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
        console.log('Publications received:', response);

        if (response && response.content) {
          this.publications = response.content;
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

    const formValues = this.publicationForm.value;

    const publicationData: Publication = {
      ...formValues,
      departmentId: Number(formValues.departmentId),
      categoryId: Number(formValues.categoryId),
      estimatedBudget: Number(formValues.estimatedBudget)
    };

    console.log("Sending publication data:", publicationData);

    if (this.editMode && this.currentPublicationId) {
      this.publicationService.updatePublication(this.currentPublicationId, publicationData).subscribe({
        next: (response) => {
          this.handleSuccess('Publication updated successfully!');
          this.loadPublications();
        },
        error: (error) => this.handleError(error)
      });
    } else {
      this.publicationService.createPublication(publicationData).subscribe({
        next: (response) => {
          this.handleSuccess('Publication created successfully!');
          this.loadPublications();
        },
        error: (error) => this.handleError(error)
      });
    }
  }

  editPublication(publication: Publication): void {
    this.showForm = true;
    this.editMode = true;
    this.currentPublicationId = publication.id!;

    const deadlineDate = new Date(publication.deadlineDate);
    const formattedDate = deadlineDate.toISOString().split('T')[0];

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

  deletePublication(id: number): void {
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
    let result = this.publications.filter(pub => pub.status === 'PUBLISHED');

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
    return new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(budget);
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
    return d.toLocaleDateString('fr-MA', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  private handleSuccess(message: string): void {
    this.isSubmitting = false;
    this.successMessage = message;
    this.resetForm();

    // Hide the form after successful submission
    setTimeout(() => {
      this.showForm = false;
    }, 2000);
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

  get f() { return this.publicationForm.controls; }

  protected readonly Math = Math;
}
