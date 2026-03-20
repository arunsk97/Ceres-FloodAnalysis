import { NgModule, isDevMode } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ServiceWorkerModule } from '@angular/service-worker';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { NewAssessmentComponent } from './pages/new-assessment/new-assessment.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { BottomNavComponent } from './components/bottom-nav/bottom-nav.component';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { AssessmentDetailsComponent } from './pages/assessment-details/assessment-details.component';

@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    NewAssessmentComponent,
    SettingsComponent,
    BottomNavComponent,
    AssessmentDetailsComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule,
    FormsModule,
    HttpClientModule,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: !isDevMode(),
      // Register the ServiceWorker as soon as the application is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:30000'
    })
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
