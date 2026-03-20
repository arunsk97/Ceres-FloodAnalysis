import { Component, OnInit } from '@angular/core';
import { DatabaseService } from '../../services/database.service';
import { SyncService } from '../../services/sync.service';
import { NetworkService } from '../../services/network.service';
import { Assessment, FarmCondition } from '../../models/assessment.model';
import { BehaviorSubject, combineLatest, from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  assessments$: Observable<Assessment[]> | undefined;
  filteredAssessments$: Observable<Assessment[]> | undefined;
  pendingCount$: Observable<number> | undefined;

  searchTerm$ = new BehaviorSubject<string>('');
  filterStatus$ = new BehaviorSubject<'ALL' | 'SYNCED' | 'PENDING'>('ALL');

  localPending$ = new BehaviorSubject<Assessment[]>([]);
  serverSynced$ = new BehaviorSubject<Assessment[]>([]);
  hasMoreServerData$ = new BehaviorSubject<boolean>(true);
  shouldShowLoadMore$: Observable<boolean> | undefined;

  constructor(
    private dbService: DatabaseService,
    private syncService: SyncService,
    private networkService: NetworkService
  ) {}

  ngOnInit(): void {
    // Initialize data streams and trigger initial fetch
    this.loadData();
  }

  /**
   * Orchestrates the complex RxJS data combine logic.
   * Merges local IndexedDB drafts with server-side paginated history into a single unified stream.
   */
  loadData(): void {
    // 1. Load pending drafts from local db
    this.dbService.getAllAssessments().then(records => {
      this.localPending$.next(records.filter(r => !r.isSynced));
    });

    // 2. Set derivation streams
    const combinedRaw$ = combineLatest([this.localPending$, this.serverSynced$]).pipe(
      map(([pending, synced]) => [...pending, ...synced])
    );

    this.assessments$ = combinedRaw$;
    
    this.pendingCount$ = this.localPending$.pipe(
      map(pending => pending.length)
    );

    this.filteredAssessments$ = combineLatest([
      combinedRaw$,
      this.searchTerm$,
      this.filterStatus$
    ]).pipe(
      map(([assessments, search, status]) => {
        // Robust sort newest first (descending)
        const sorted = [...assessments].sort((a, b) => {
          const safeParse = (dateString?: string) => {
            if (!dateString) return 0;
            const ms = new Date(dateString).getTime();
            return isNaN(ms) ? 0 : ms;
          };
          
          const tA = Math.max(safeParse(a.lastModifiedDate), safeParse(a.createdDate));
          const tB = Math.max(safeParse(b.lastModifiedDate), safeParse(b.createdDate));
          
          return tB - tA; // descending (newest on top)
        });

        // Filter by Status and Search
        let filtered = sorted;

        if (status === 'PENDING') {
          filtered = filtered.filter(a => !a.isSynced);
        } else if (status === 'SYNCED') {
          filtered = filtered.filter(a => a.isSynced);
        }

        if (search) {
          const searchLower = search.toLowerCase();
          filtered = filtered.filter(a => 
             a.farmName.toLowerCase().includes(searchLower) || 
             (a.id && a.id.toLowerCase().includes(searchLower))
          );
        }

        return filtered;
      })
    );

    this.shouldShowLoadMore$ = combineLatest([
      this.hasMoreServerData$,
      this.filterStatus$
    ]).pipe(
      map(([hasMore, status]) => {
        return hasMore && (status === 'ALL' || status === 'SYNCED');
      })
    );

    // 3. Reset and pull first page of server history
    this.serverSynced$.next([]);
    this.hasMoreServerData$.next(true);

    if (this.networkService.isOnline) {
       this.fetchNextServerPage();
    }
  }

  /**
   * Physically dispatches pagination queries to the .NET API.
   * Implements Skip/Take logic to prevent loading entire database into mobile memory.
   */
  async fetchNextServerPage(): Promise<void> {
    try {
      const skip = this.serverSynced$.value.length;
      const take = 5; // Load next 5 chunk
      const newItems = await this.syncService.pullPaginatedServerData(skip, take);
      
      if (newItems.length < take) {
        this.hasMoreServerData$.next(false);
      }
      
      this.serverSynced$.next([...this.serverSynced$.value, ...newItems]);
    } catch(e) {
      console.warn("Could not fetch next server page", e);
    }
  }

  loadMoreData(): void {
    if (!this.networkService.isOnline) {
      alert('No connection. Please try again when online.');
      return;
    }
    this.fetchNextServerPage();
  }

  onSearchChange(event: any): void {
    this.searchTerm$.next(event.target.value);
  }

  setFilter(status: 'ALL' | 'SYNCED' | 'PENDING'): void {
    this.filterStatus$.next(status);
  }

  /**
   * Action to manually push all offline data
   */
  async syncNow(): Promise<void> {
    const result = await this.syncService.pushPendingData();
    if (result.success) {
      alert(`Successfully synced ${result.count} records.`);
      this.loadData(); // Re-fetch observables
    } else {
      alert(`Sync failed: ${result.error}`);
    }
  }

  getUrgencyLabel(condition: FarmCondition): string {
    switch (condition) {
      case FarmCondition.Bad: return 'ACTION REQUIRED';
      case FarmCondition.Moderate: return 'MONITORING';
      case FarmCondition.Good: return 'STABLE';
      default: return 'UNKNOWN';
    }
  }

  getSoilLabel(condition: FarmCondition): string {
    switch (condition) {
      case FarmCondition.Bad: return 'CRITICAL';
      case FarmCondition.Moderate: return 'MODERATE';
      case FarmCondition.Good: return 'OPTIMAL';
      default: return 'UNKNOWN';
    }
  }
}
