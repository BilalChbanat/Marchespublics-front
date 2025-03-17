import {Routes} from '@angular/router';
import {LangingComponent} from './pages/langing/langing.component';
import {RegisterComponent} from './auth/register/register.component';
import {LoginComponent} from './auth/login/login.component';
import {ProfileComponent} from './auth/profile/profile.component';
import {DepartmentComponent} from './department/department.component';

export const routes: Routes = [
  {path: '', component: LangingComponent},
  {path: 'signup', component: RegisterComponent},
  {path: 'login', component: LoginComponent},
  {path: 'profile', component: ProfileComponent},
  { path: 'departments', component: DepartmentComponent },
];
