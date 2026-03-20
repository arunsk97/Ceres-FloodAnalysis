import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DatabaseService } from './database.service';
import { Assessment } from '../models/assessment.model';
import { lastValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SyncService {
  private apiUrl = 'http://localhost:5097/api/assessments/sync'; // Adjust port if needed

  constructor(
    private http: HttpClient,
    private dbService: DatabaseService
  ) {}

  /**
   * Pushes all pending offline records to the .NET API.
   * Uses RxJS converted to Promise for async/await flow.
   */
  async pushPendingData(): Promise<{ success: boolean; count: number; error?: string }> {
    try {
      const pendingRecords = await this.dbService.getPendingAssessments();
      
      if (pendingRecords.length === 0) {
        return { success: true, count: 0 };
      }

      // Send to .NET Web API
      const result = await lastValueFrom(
        this.http.post<{ message: string, count: number }>(this.apiUrl, pendingRecords)
      );

      // Once successfully synced to master DB, instantly purge them from local IndexedDB to save space
      const syncedIds = pendingRecords.map(r => r.id as string);
      await this.dbService.deleteAssessments(syncedIds);

      return { success: true, count: result.count };
    } catch (error: any) {
      console.error('Sync failed', error);
      return { success: false, count: 0, error: error.message || 'Unknown error during sync' };
    }
  }

  /**
   * Pulls a paginated slice of historical assessments from the server.
   * Returns directly to RAM for UI rendering without permanently clogging IndexedDB memory!
   */
  async pullPaginatedServerData(skip: number, take: number): Promise<Assessment[]> {
    try {
      const getUrl = this.apiUrl.replace('/sync', '');
      const serverData = await lastValueFrom(
        this.http.get<Assessment[]>(`${getUrl}?skip=${skip}&take=${take}`)
      );

      // Secure payload constraints mapping
      serverData.forEach(s => {
        s.isSynced = true;
        s.photosBase64 = []; // Strip giant images immediately
      });

      return serverData;
    } catch (error: any) {
      console.error('Failed to pull server data', error);
      throw error;
    }
  }

  /**
   * Directly fetches full historical master data without altering the local IndexedDB.
   */
  async getServerData(): Promise<Assessment[]> {
    const getUrl = this.apiUrl.replace('/sync', '');
    // Defaults to take=1000 natively in C#
    return await lastValueFrom(
      this.http.get<Assessment[]>(getUrl)
    );
  }
}
