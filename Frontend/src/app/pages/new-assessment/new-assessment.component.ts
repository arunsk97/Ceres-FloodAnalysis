import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { DatabaseService } from '../../services/database.service';
import { SyncService } from '../../services/sync.service';
import { NetworkService } from '../../services/network.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-new-assessment',
  templateUrl: './new-assessment.component.html',
  styleUrls: ['./new-assessment.component.scss']
})
export class NewAssessmentComponent implements OnInit {
  assessmentForm!: FormGroup;
  isSaving = false;
  editingId: string | null = null;
  photosBase64: string[] = [];
  originalCreatedDate: string | null = null;

  constructor(
    private fb: FormBuilder,
    private dbService: DatabaseService,
    private syncService: SyncService,
    private networkService: NetworkService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  async ngOnInit(): Promise<void> {
    this.assessmentForm = this.fb.group({
      farmName: ['', Validators.required],
      address: ['', Validators.required],
      condition: [0, Validators.required], // 0: Good, 1: Moderate, 2: Bad
      totalChickens: [0, [Validators.required, this.nonNegativeValidator]],
      conditionComments: [''],
      livestockNotes: [''],
      waterAccess: [true],
      perimeterFence: [true],
      ventilation: [false],
      latitude: [0],
      longitude: [0]
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.editingId = id;
      const record = await this.dbService.getAssessmentById(id);
      if (record) {
        this.assessmentForm.patchValue(record);
        this.originalCreatedDate = record.createdDate;
        if (record.photosBase64 && record.photosBase64.length > 0) {
          this.photosBase64 = record.photosBase64;
        }
      }
    } else {
      this.captureGeolocation();
    }
  }

  /**
   * Custom validator for Live Inventory logic
   */
  nonNegativeValidator(control: AbstractControl): { [key: string]: boolean } | null {
    if (control.value < 0) {
      return { 'negativeNumber': true };
    }
    return null;
  }

  incrementChickens(amount: number): void {
    const current = this.assessmentForm.get('totalChickens')?.value || 0;
    const newVal = current + amount;
    if (newVal >= 0) {
      this.assessmentForm.patchValue({ totalChickens: newVal });
    }
  }

  /**
   * Automatically retrieves lat/long upon opening the form.
   */
  captureGeolocation(): void {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.assessmentForm.patchValue({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.warn('Geolocation failed, relying on user input or defaulting to 0: ', error);
        }
      );
    }
  }

  /**
   * Converts user-uploaded image to Base64 to store in IndexedDB.
   */
  async onFileSelected(event: any) {
    const files = event.target.files;
    if (files && files.length > 0) {
      // Allow up to 4 photos max (including existing ones)
      const countToAdd = Math.min(files.length, 4 - this.photosBase64.length);
      
      for (let i = 0; i < countToAdd; i++) {
        const file = files[i];
        try {
          const base64 = await this.convertToBase64(file);
          this.photosBase64.push(base64);
        } catch (e) {
          console.error('Error reading file', e);
        }
      }
    }
  }

  private convertToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }

  getEmptySlots() {
    return new Array(Math.max(0, 4 - this.photosBase64.length));
  }

  /**
   * Follows offline-first flow: saves to local DB and navigates away.
   */
  async saveAssessment(): Promise<void> {
    if (this.assessmentForm.invalid) {
      alert('Please fill out all required fields correctly. Check the live inventory count.');
      return;
    }

    this.isSaving = true;
    const formVal = this.assessmentForm.value;
    
    const assessment = {
      id: this.editingId || undefined,
      farmName: formVal.farmName,
      address: formVal.address,
      condition: Number(formVal.condition),
      totalChickens: formVal.totalChickens,
      conditionComments: formVal.conditionComments,
      livestockNotes: formVal.livestockNotes,
      waterAccess: formVal.waterAccess,
      perimeterFence: formVal.perimeterFence,
      ventilation: formVal.ventilation,
      latitude: formVal.latitude,
      longitude: formVal.longitude,
      photosBase64: this.photosBase64.length > 0 ? this.photosBase64 : undefined,
      isSynced: false, // Critical offline-first flag
      createdDate: this.originalCreatedDate || new Date().toISOString(),
      lastModifiedDate: new Date().toISOString()
    };

    try {
      await this.dbService.saveAssessment(assessment);
      
      // Eager Auto-Sync if currently online
      if (this.networkService.isOnline) {
        // Fire asynchronously to avoid blocking navigation
        this.syncService.pushPendingData().catch(e => console.error("Eager sync failed", e));
      }

      this.router.navigate(['/dashboard']);
    } catch (e) {
      console.error(e);
      alert('Error saving assessment locally.');
    } finally {
      this.isSaving = false;
    }
  }
}
