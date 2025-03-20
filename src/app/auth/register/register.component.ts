import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Router, RouterLink} from '@angular/router';
import { AuthService, SignupRequest } from '../../services/auth/auth.service';
import {NgClass, NgIf} from '@angular/common';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgClass,
    NgIf,
    RouterLink
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent implements OnInit {
  signupForm: FormGroup;
  isSubmitting = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.signupForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
      terms: [false, Validators.requiredTrue]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  ngOnInit(): void { }

  passwordMatchValidator(group: FormGroup): { [key: string]: boolean } | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;

    return password === confirmPassword ? null : { 'passwordMismatch': true };
  }

  onSubmit(): void {
    if (this.signupForm.invalid) {
      Object.keys(this.signupForm.controls).forEach(key => {
        this.signupForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const signupRequest: SignupRequest = {
      username: this.signupForm.value.username,
      email: this.signupForm.value.email,
      password: this.signupForm.value.password
    };

    this.authService.signup(signupRequest).subscribe({
      next: (response) => {
        this.loginAfterSignup(this.signupForm.value.email, this.signupForm.value.password);
      },
      error: (error) => {
        this.isSubmitting = false;
        if (error.error && error.error.message) {
          this.errorMessage = error.error.message;
        } else {
          this.errorMessage = 'An error occurred during registration. Please try again.';
        }
      }
    });
  }

  loginAfterSignup(email: string, password: string): void {
    this.authService.login(email, password).subscribe({
      next: (loginResponse) => {
        this.isSubmitting = false;
        this.router.navigate(['/']);
      },
      error: (error) => {
        this.isSubmitting = false;
        this.router.navigate(['/login'], {
          queryParams: {
            registered: 'success',
            autologin: 'failed'
          }
        });
      }
    });
  }

  get f() { return this.signupForm.controls; }
  get passwordMatchError() {
    return this.signupForm.hasError('passwordMismatch') && this.f['confirmPassword'].touched;
  }
}
