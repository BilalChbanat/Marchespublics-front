import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgClass, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService, User } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgClass,
    NgIf,
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  profileForm: FormGroup;
  currentUser: User | null = null;
  isSubmitting = false;
  successMessage = '';
  errorMessage = '';
  showUpdateForm = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private http: HttpClient
  ) {
    this.profileForm = this.fb.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: [''],
      confirmPassword: ['']
    }, {
      validators: this.passwordMatchValidator
    });
  }

  ngOnInit(): void {
    // Get current user from auth service
    this.currentUser = this.authService.getCurrentUser();

    if (this.currentUser) {
      // Populate form with current user data
      this.profileForm.patchValue({
        username: this.currentUser.username,
        email: this.currentUser.email
      });
    }
  }

  toggleUpdateForm(): void {
    this.showUpdateForm = !this.showUpdateForm;

    if (!this.showUpdateForm) {
      this.successMessage = '';
      this.errorMessage = '';

      this.profileForm.patchValue({
        password: '',
        confirmPassword: ''
      });

      this.profileForm.markAsPristine();
      this.profileForm.markAsUntouched();
    }
  }

  passwordMatchValidator(group: FormGroup): { [key: string]: boolean } | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;

    if (password && confirmPassword) {
      return password === confirmPassword ? null : { 'passwordMismatch': true };
    }
    return null;
  }

  onSubmit(): void {
    if (this.profileForm.invalid) {
      Object.keys(this.profileForm.controls).forEach(key => {
        this.profileForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const updateData: any = {
      username: this.profileForm.value.username,
      email: this.profileForm.value.email
    };

    if (this.profileForm.value.password) {
      updateData.password = this.profileForm.value.password;
    }

    if (this.currentUser && this.currentUser.id) {
      this.http.put(`http://localhost:8080/users/update/${this.currentUser.id}`, updateData)
        .subscribe({
          next: (response: any) => {
            this.isSubmitting = false;
            this.successMessage = 'Profile updated successfully!';

            const updatedUser: User = {
              id: this.currentUser!.id,
              username: updateData.username,
              email: updateData.email
            };

            localStorage.setItem('user', JSON.stringify(updatedUser));
            this.authService.currentUserSubject.next(updatedUser);

            this.profileForm.patchValue({
              password: '',
              confirmPassword: ''
            });

            setTimeout(() => {
              this.showUpdateForm = false;
            }, 3000);
          },
          error: (error) => {
            this.isSubmitting = false;
            if (error.error && error.error.message) {
              this.errorMessage = error.error.message;
            } else {
              this.errorMessage = 'An error occurred while updating your profile.';
            }
          }
        });
    } else {
      this.isSubmitting = false;
      this.errorMessage = 'Unable to update profile. User information is missing.';
    }
  }

  // Convenience getter for form fields
  get f() { return this.profileForm.controls; }

  // Check if passwords match for displaying error
  get passwordMatchError() {
    return this.profileForm.hasError('passwordMismatch') &&
      this.f['confirmPassword'].value &&
      this.f['confirmPassword'].touched;
  }
}
