import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DepartmentService, Department } from '../services/department/department-service.service';
import { AuthService } from '../services/auth/auth.service';
import {NgClass, NgForOf, NgIf} from '@angular/common';

@Component({
  selector: 'app-department',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgClass,
    NgIf,
    NgForOf,
  ],
  templateUrl: './department.component.html',
  styleUrls: ['./department.component.css']
})
export class DepartmentComponent implements OnInit {
  departmentForm: FormGroup;
  departments: Department[] = [];
  isSubmitting = false;
  showForm = false;
  editMode = false;
  currentDepartmentId: number | null = null;
  successMessage = '';
  errorMessage = '';
  currentUserId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private departmentService: DepartmentService,
    private authService: AuthService // Add AuthService
  ) {
    this.departmentForm = this.fb.group({
      name: ['', [Validators.required]],
      address: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    // Get current user ID
    this.currentUserId = this.authService.getCurrentUserId();
    this.loadDepartments();
  }

  loadDepartments(): void {
    console.log('Fetching departments...');
    this.departmentService.getAllDepartments().subscribe({
      next: (response: any) => {
        console.log('Departments received:', response);

        if (response && response.content) {
          this.departments = response.content;
        } else {
          this.departments = [];
          console.warn('No content property found in response');
        }
      },
      error: (error) => {
        console.error('Error loading departments:', error);
        this.errorMessage = 'Failed to load departments. Please try again.';
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
    this.departmentForm.reset();
    this.editMode = false;
    this.currentDepartmentId = null;
    this.successMessage = '';
    this.errorMessage = '';
  }

  onSubmit(): void {
    if (this.departmentForm.invalid) {
      Object.keys(this.departmentForm.controls).forEach(key => {
        this.departmentForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Get current user ID safely
    const currentUserId = this.authService.getCurrentUserId();

    if (!currentUserId) {
      this.errorMessage = 'Please log in to create a department';
      this.isSubmitting = false;
      return;
    }

    const departmentData: Department = {
      ...this.departmentForm.value,
      userId: currentUserId
    };

    if (this.editMode && this.currentDepartmentId) {
      this.departmentService.updateDepartment(this.currentDepartmentId, departmentData).subscribe({
        next: (response) => {
          this.handleSuccess('Department updated successfully!');
          this.loadDepartments();
        },
        error: (error) => this.handleError(error)
      });
    } else {
      this.departmentService.createDepartment(departmentData).subscribe({
        next: (response) => {
          this.handleSuccess('Department created successfully!');
          this.loadDepartments();
        },
        error: (error) => this.handleError(error)
      });
    }
  }

  editDepartment(department: Department): void {
    this.showForm = true;
    this.editMode = true;
    this.currentDepartmentId = department.id!;
    this.departmentForm.patchValue({
      name: department.name,
      address: department.address,
      email: department.email,
      phone: department.phone
    });
  }

  deleteDepartment(id: number): void {
    if (confirm('Are you sure you want to delete this department?')) {
      this.departmentService.deleteDepartment(id).subscribe({
        next: () => {
          this.successMessage = 'Department deleted successfully!';
          this.loadDepartments();
        },
        error: (error) => {
          console.error('Error deleting department:', error);
          this.errorMessage = 'Failed to delete department. Please try again.';
        }
      });
    }
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
    console.error('Error submitting department:', error);

    if (error.error && error.error.message) {
      this.errorMessage = error.error.message;
    } else {
      this.errorMessage = 'An error occurred. Please try again.';
    }
  }

  // Convenience getter for form fields
  get f() { return this.departmentForm.controls; }
}
