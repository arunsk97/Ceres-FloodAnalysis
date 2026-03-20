import { Injectable } from '@angular/core';
import Dexie, { Table } from 'dexie';
import { Assessment } from '../models/assessment.model';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService extends Dexie {
  assessments!: Table<Assessment, string>; // uuid string

  constructor() {
    super('FloodAssessmentDB');
    
    // Define schema
    this.version(1).stores({
      assessments: 'id, isSynced, farmName'
    });
  }

  /**
   * Adds or updates an assessment in IndexedDB.
   */
  async saveAssessment(assessment: Assessment): Promise<void> {
    if (!assessment.id) {
      assessment.id = crypto.randomUUID();
    }
    assessment.lastModifiedDate = new Date().toISOString();
    await this.assessments.put(assessment);
  }

  /**
   * Retrieves all pending assessments that need syncing.
   */
  async getPendingAssessments(): Promise<Assessment[]> {
    return this.assessments.filter(a => !a.isSynced).toArray();
  }

  /**
   * Retrieves a single assessment by ID.
   */
  async getAssessmentById(id: string): Promise<Assessment | undefined> {
    return this.assessments.get(id);
  }

  /**
   * Retrieves all assessments.
   */
  async getAllAssessments(): Promise<Assessment[]> {
    return this.assessments.toArray();
  }

  /**
   * Marks a list of assessments as synced.
   */
  async markAsSynced(ids: string[]): Promise<void> {
    await this.assessments.where('id').anyOf(ids).modify({ isSynced: true });
  }

  /**
   * Deletes a list of assessments permanently from IndexedDB.
   */
  async deleteAssessments(ids: string[]): Promise<void> {
    await this.assessments.bulkDelete(ids);
  }

  /**
   * Clears the entire database storage.
   */
  async purgeCache(): Promise<void> {
    await this.assessments.clear();
  }

  /**
   * Upserts records from the server, skipping any that are currently locally pending to avoid overwriting edits.
   */
  async bulkUpsertFromServer(serverAssessments: Assessment[]): Promise<void> {
    const localPending = await this.getPendingAssessments();
    const pendingIds = new Set(localPending.map(a => a.id));

    // Filter out server records that have local pending edits
    const recordsToInsert = serverAssessments.filter(sa => !pendingIds.has(sa.id));

    if (recordsToInsert.length > 0) {
      await this.assessments.bulkPut(recordsToInsert);
    }
  }
}
