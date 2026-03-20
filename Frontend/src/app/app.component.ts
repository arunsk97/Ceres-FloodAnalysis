import { Component, OnInit } from '@angular/core';
import { NetworkService } from './services/network.service';
import { SyncService } from './services/sync.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'Frontend';

  constructor(
    private networkService: NetworkService,
    private syncService: SyncService
  ) {}

  ngOnInit() {
    // Listen for transitions to ONLINE mode across the entire app instance
    this.networkService.isOnline$.subscribe(async (isOnline) => {
      if (isOnline) {
        console.log('App detected stable connection. Triggering Global Auto-Sync in background.');
        try {
          // Push any local drafted pending records to server
          await this.syncService.pushPendingData();
        } catch(e) {
          console.error("Auto Sync failed in background", e);
        }
      } else {
        console.log('App entered Offline Mode (Mock or Native).');
      }
    });
  }
}
