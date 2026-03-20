import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DatabaseService } from './database.service';
import { Assessment } from '../models/assessment.model';
import { lastValueFrom } from 'rxjs';

/**
 * SyncService manages the lifecycle of data movement between the local IndexedDB and the .NET Web API.
 * It implements a "True Wipe" strategy for storage optimization and a "Lazy Loading" pattern for history.
 */
@Injectable({
  providedIn: 'root'
})
export class SyncService {
  private apiUrl = 'http://localhost:5097/api/assessments/sync';

  constructor(
    private http: HttpClient,
    private dbService: DatabaseService
  ) {}

  /**
   * Pushes all locally drafted (Pending) records to the .NET API.
   * On successful sync, it triggers a "True Wipe" deletion from the local IndexedDB
   * to ensure minimal device storage footprint.
   */
  async pushPendingData(): Promise<{ success: boolean; count: number; error?: string }> {
    try {
      const pendingRecords = await this.dbService.getPendingAssessments();
      
      if (pendingRecords.length === 0) {
        return { success: true, count: 0 };
      }

      const result = await lastValueFrom(
        this.http.post<{ message: string, count: number }>(this.apiUrl, pendingRecords)
      );

      // STORAGE OPTIMIZATION: Permanently delete successfully synced records from the local device
      const syncedIds = pendingRecords.map(r => r.id as string);
      await this.dbService.deleteAssessments(syncedIds);

      return { success: true, count: result.count };
    } catch (error: any) {
      console.error('Push Sync failed', error);
      return { success: false, count: 0, error: error.message || 'Unknown error during sync' };
    }
  }

  /**
   * Pulls a paginated slice of historical assessments from the server.
   * LAZY LOADING: This method returns data directly to the UI's active memory (RAM)
   * rather than storing it in IndexedDB, preventing local storage bloat.
   * IMAGE STRIPPING: All Base64 photo strings are removed locally to save bandwidth and UI performance.
   */
  async pullPaginatedServerData(skip: number, take: number): Promise<Assessment[]> {
    try {
      const getUrl = this.apiUrl.replace('/sync', '');
      const serverData = await lastValueFrom(
        this.http.get<Assessment[]>(`${getUrl}?skip=${skip}&take=${take}`)
      );

      serverData.forEach(s => {
        s.isSynced = true;
        s.photosBase64 = []; // Instant stripping for local performance
      });

      return serverData;
    } catch (error: any) {
      console.error('Paginated pull failed', error);
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
