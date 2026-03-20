import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DatabaseService } from '../../services/database.service';
import { Assessment, FarmCondition } from '../../models/assessment.model';

/**
 * AssessmentDetailsComponent presents a read-only deep dive into a specific farm record.
 * It pulls data from the DatabaseService (which hides whether the data is local or server-synced).
 */
@Component({
  selector: 'app-assessment-details',
  templateUrl: './assessment-details.component.html',
  styleUrls: ['./assessment-details.component.scss']
})
export class AssessmentDetailsComponent implements OnInit {
  assessment: Assessment | undefined;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dbService: DatabaseService
  ) {}

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.assessment = await this.dbService.getAssessmentById(id);
    }
  }

  getConditionTitle(condition: FarmCondition | undefined): string {
    if (condition === undefined) return '';
    return condition === 0 ? 'Resilient / Optimized' : (condition === 1 ? 'Moderate / Monitoring' : 'Requires Intervention');
  }

  getConditionDesc(condition: FarmCondition | undefined): string {
    if (condition === undefined) return '';
    if (condition === 0) return 'Structural integrity of coops is high. Drainage systems cleared of debris. Soil moisture content indicates optimal recovery after recent rainfall. No immediate intervention required.';
    if (condition === 1) return 'Some vulnerabilities present. Coops sustained minor damage. Close monitoring of soil moisture needed.';
    return 'Significant destruction observed. Immediate structural repair and relief efforts demanded.';
  }

  getInfraStatus(value: boolean | undefined): { label: string, cssClass: string } {
    if (value === undefined) return { label: 'UNKNOWN', cssClass: 'unknown' };
    return value ? { label: 'OPERATIONAL', cssClass: 'success' } : { label: 'MAINTENANCE REQ.', cssClass: 'danger' };
  }

  editRecord(): void {
    if (this.assessment?.id) {
      this.router.navigate(['/edit-assessment', this.assessment.id]);
    }
  }
}
