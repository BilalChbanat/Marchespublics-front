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

export const routes: Routes = [
  {path: '', component: LangingComponent},
  {path: 'signup', component: RegisterComponent, canActivate: [GuestGuard]},
  {path: 'login', component: LoginComponent, canActivate: [GuestGuard]},

  {path: 'profile', component: ProfileComponent, canActivate: [AuthGuard] },
  { path: 'departments', component: DepartmentComponent, canActivate: [AuthGuard]  },
  { path: 'company', component: CompanyComponent, canActivate: [AuthGuard]  },
  { path: 'pubs', component: PublicationComponent, canActivate: [AuthGuard] },
  {path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },

  // here

  { path: 'company/edit/:id', component: CompanyComponent, canActivate: [AuthGuard]  },
  { path: 'pubs/edit/:id', component: PublicationComponent, canActivate: [AuthGuard]  },
];
