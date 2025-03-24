import {Routes} from '@angular/router';
import {LangingComponent} from './pages/langing/langing.component';
import {RegisterComponent} from './auth/register/register.component';
import {LoginComponent} from './auth/login/login.component';
import {ProfileComponent} from './auth/profile/profile.component';
import {DepartmentComponent} from './department/department.component';
import {CompanyComponent} from './company/company.component';
import {PublicationComponent} from './publication/publication.component';
import {DashboardComponent} from './pages/dashboard/dashboard.component';
import {AuthGuard} from './guards/auth/auth-guard.guard';
import {GuestGuard} from './guards/GuestGuard/guest-guard.guard';
import {NotFoundComponent} from './not-found/not-found.component';
import {AdminComponent} from './pages/admin/admin.component';
import {ApplicationsComponent} from './applications-component/applications-component.component';

export const routes: Routes = [
  {path: '', component: LangingComponent},
  {path: 'signup', component: RegisterComponent, canActivate: [GuestGuard]},
  {path: 'login', component: LoginComponent, canActivate: [GuestGuard]},

  {path: 'profile', component: ProfileComponent, canActivate: [AuthGuard] },
  { path: 'departments', component: DepartmentComponent, canActivate: [AuthGuard]  },
  { path: 'company', component: CompanyComponent, canActivate: [AuthGuard]  },
  { path: 'pubs', component: PublicationComponent, canActivate: [AuthGuard] },
  {path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },

  {
    path: 'admin',
    component: AdminComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'departments', component: DepartmentComponent },
      { path: 'company', component: CompanyComponent },
      { path: 'company/edit/:id', component: CompanyComponent },
      { path: 'pubs', component: PublicationComponent },
      { path: 'pubs/edit/:id', component: PublicationComponent },
      { path: 'applications', component: ApplicationsComponent }
    ]
  },


  { path: 'company/edit/:id', component: CompanyComponent, canActivate: [AuthGuard]  },
  { path: 'pubs/edit/:id', component: PublicationComponent, canActivate: [AuthGuard]  },

  { path: '**', component: NotFoundComponent }
];
