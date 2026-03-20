import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { NewAssessmentComponent } from './pages/new-assessment/new-assessment.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { AssessmentDetailsComponent } from './pages/assessment-details/assessment-details.component';

const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'new-assessment', component: NewAssessmentComponent },
  { path: 'edit-assessment/:id', component: NewAssessmentComponent },
  { path: 'assessment-details/:id', component: AssessmentDetailsComponent },
  { path: 'settings', component: SettingsComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
