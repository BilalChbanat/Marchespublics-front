import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CompanyService, Company } from '../services/company/company.service';
import {DatePipe, NgClass, NgForOf, NgIf} from '@angular/common';

@Component({
  selector: 'app-company',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgClass,
    NgIf,
    NgForOf,
    DatePipe,
  ],
  templateUrl: './company.component.html',
  styleUrls: ['./company.component.css']
})
export class CompanyComponent implements OnInit {
  companyForm: FormGroup;
  companies: Company[] = [];
  isSubmitting = false;
  showForm = false;
  editMode = false;
  currentCompanyId: number | null = null;
  successMessage = '';
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private companyService: CompanyService
  ) {
    this.companyForm = this.fb.group({
      name: ['', [Validators.required]],
      address: ['', [Validators.required]],
      employeesNumber: ['', [Validators.required, Validators.min(1)]],
      registrationDate: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      userId: [this.getCurrentUserId(), [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.loadCompanies();
  }

  loadCompanies(): void {
    console.log('Fetching companies...');
    this.companyService.getAllCompanies().subscribe({
      next: (response: any) => {
        console.log('Companies received:', response);

        // Extract companies from the content property
        if (response && response.content) {
          this.companies = response.content;
        } else {
          this.companies = [];
          console.warn('No content property found in response');
        }
      },
      error: (error) => {
        console.error('Error loading companies:', error);
        this.errorMessage = 'Failed to load companies. Please try again.';
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
    this.companyForm.reset();
    this.editMode = false;
    this.currentCompanyId = null;
    this.successMessage = '';
    this.errorMessage = '';
  }

  onSubmit(): void {
    if (this.companyForm.invalid) {
      Object.keys(this.companyForm.controls).forEach(key => {
        this.companyForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const companyData: Company = this.companyForm.value;

    if (this.editMode && this.currentCompanyId) {
      this.companyService.updateCompany(this.currentCompanyId, companyData).subscribe({
        next: (response) => {
          this.handleSuccess('Company updated successfully!');
          this.loadCompanies();
        },
        error: (error) => this.handleError(error)
      });
    } else {
      this.companyService.createCompany(companyData).subscribe({
        next: (response) => {
          this.handleSuccess('Company created successfully!');
          this.loadCompanies();
        },
        error: (error) => this.handleError(error)
      });
    }
  }

  private getCurrentUserId(): number {
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

    this.errorMessage = 'You must be logged in to create a company';
    throw new Error('User not authenticated');
  }

  editCompany(company: Company): void {
    this.showForm = true;
    this.editMode = true;
    this.currentCompanyId = company.id!;
    this.companyForm.patchValue({
      name: company.name,
      address: company.address,
      employeesNumber: company.employeesNumber,
      registrationDate: company.registrationDate,
      email: company.email,
      userId: company.userId || this.getCurrentUserId() // Add this line
    });
  }

  deleteCompany(id: number): void {
    if (confirm('Are you sure you want to delete this company?')) {
      this.companyService.deleteCompany(id).subscribe({
        next: () => {
          this.successMessage = 'Company deleted successfully!';
          this.loadCompanies();
        },
        error: (error) => {
          console.error('Error deleting company:', error);
          this.errorMessage = 'Failed to delete company. Please try again.';
        }
      });
    }
  }

  private handleSuccess(message: string): void {
    this.isSubmitting = false;
    this.successMessage = message;
    this.resetForm();

    setTimeout(() => {
      this.showForm = false;
    }, 2000);
  }

  private handleError(error: any): void {
    this.isSubmitting = false;
    console.error('Error submitting company:', error);

    if (error.error && error.error.message) {
      this.errorMessage = error.error.message;
    } else {
      this.errorMessage = 'An error occurred. Please try again.';
    }
  }

  get f() { return this.companyForm.controls; }
}
