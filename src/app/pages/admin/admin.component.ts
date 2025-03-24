// src/app/admin/admin.component.ts
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../layouts/sidebar/sidebar.component';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent],
  template: `
    <div class="flex h-screen bg-gray-100">
      <!-- Sidebar -->
      <app-sidebar></app-sidebar>

      <!-- Main Content -->
      <div class="flex-1 overflow-auto">
        <div class="p-6">
          <router-outlet></router-outlet>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class AdminComponent {}
