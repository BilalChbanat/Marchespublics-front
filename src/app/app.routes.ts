import { Routes } from '@angular/router';
import {LangingComponent} from './pages/langing/langing.component';
import {RegisterComponent} from './auth/register/register.component';

export const routes: Routes = [
  {path: '' , component : LangingComponent},
  {path: 'signup', component : RegisterComponent},
];
