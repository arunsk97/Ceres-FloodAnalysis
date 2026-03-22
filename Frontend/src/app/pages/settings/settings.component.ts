import { Component, OnInit } from '@angular/core';
import { DatabaseService } from '../../services/database.service';
import { SyncService } from '../../services/sync.service';
import { NetworkService } from '../../services/network.service';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  pendingCount$: Observable<number> | undefined;
  
  // UI Bindings for new mockup
  autoSyncEnabled: boolean = true;
  storageUsedFormatted: string = '0 MB';
  storageQuotaFormatted: string = 'Unknown';

  constructor(
    private dbService: DatabaseService,
    private syncService: SyncService,
    private networkService: NetworkService
  ) {}

  get simulateOffline(): boolean {
    return this.networkService.isSimulationOffline;
  }

  set simulateOffline(value: boolean) {
    this.networkService.setSimulationOffline(value);
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.pendingCount$ = from(this.dbService.getPendingAssessments()).pipe(
      map(assessments => assessments.length)
    );
    this.estimateStorage();
  }

  async estimateStorage(): Promise<void> {
    if (navigator.storage && navigator.storage.estimate) {
      try {
        const estimation = await navigator.storage.estimate();
        const usage = estimation.usage || 0;
        const quota = estimation.quota || 0;
        
        // Convert usage to MB
        const usedMB = (usage / (1024 * 1024)).toFixed(1);
        this.storageUsedFormatted = `${usedMB} MB`;

        // Convert quota to GB
        if (quota > 0) {
          const quotaGB = (quota / (1024 * 1024 * 1024)).toFixed(1);
          this.storageQuotaFormatted = `${quotaGB} GB`;
        } else {
          this.storageQuotaFormatted = 'Unknown';
        }
      } catch (e) {
        console.error('Failed to estimate storage', e);
      }
    }
  }

  /**
   * Forces manual synchronization of all local environmental data
   */
  async forceSync(): Promise<void> {
    if (!this.networkService.isOnline) {
      alert('No connection. Please try again when online.');
      return;
    }
    const result = await this.syncService.pushPendingData();
    if (result.success) {
      alert(`Synced ${result.count} local records to the global database.`);
      this.loadData();
    } else {
      alert(`Global sync failed: ${result.error}`);
    }
  }

  /**
   * Exports data to CSV format. 
   * If online, downloads full master DB. If offline, warns and downloads local IndexedDB subset.
   */
  async exportToCsv(): Promise<void> {
    let assessments: any[] = [];
    let titlePrefix: string = '';

    if (!this.networkService.isOnline) {
      alert('WARNING: You are currently offline. Only locally indexed records resting on this device will be downloaded.');
      assessments = await this.dbService.getAllAssessments();
      titlePrefix = 'local-indexed';
    } else {
      try {
        assessments = await this.syncService.getServerData();
        titlePrefix = 'full-master-data';
      } catch (e) {
        alert('Failed to reach global server. Exporting local indexed records only.');
        assessments = await this.dbService.getAllAssessments();
        titlePrefix = 'local-fallback';
      }
    }

    if (assessments.length === 0) {
      alert('No data available to export.');
      return;
    }

    const headers = ['ID', 'Farm Name', 'Address', 'Latitude', 'Longitude', 'Condition', 'Total Chickens', 'Condition Comments', 'Is Synced', 'Created Date'];
    
    const rows = assessments.map(a => [
      a.id,
      `"${a.farmName?.replace(/"/g, '""')}"`,
      `"${a.address?.replace(/"/g, '""')}"`,
      a.latitude,
      a.longitude,
      a.condition,
      a.totalChickens,
      `"${a.conditionComments?.replace(/"/g, '""') || ''}"`,
      a.isSynced,
      a.createdDate
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `assessments-export-${titlePrefix}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Clears synchronized records to free up space
   */
  async purgeCache(): Promise<void> {
    if (confirm("Are you sure you want to completely clear all local data? Warning: Any unsynced drafts will be destroyed.")) {
      await this.dbService.purgeCache();
      alert("Local data has been cleared.");
      this.loadData();
    }
  }
}
