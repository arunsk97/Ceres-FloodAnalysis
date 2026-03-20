import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NetworkService {
  private forceOffline: boolean = false;
  private onlineStatus = new BehaviorSubject<boolean>(navigator.onLine);
  public isOnline$: Observable<boolean> = this.onlineStatus.asObservable();

  constructor() {
    // Listen to native browser events
    window.addEventListener('online', () => this.updateOnlineStatus());
    window.addEventListener('offline', () => this.updateOnlineStatus());
  }

  /**
   * Get the current effective online status.
   * If simulation toggle is active, this overrides native state.
   */
  get isOnline(): boolean {
    if (this.forceOffline) {
      return false;
    }
    return navigator.onLine;
  }

  /**
   * Set the simulation toggle for demo purposes
   */
  setSimulationOffline(offline: boolean) {
    this.forceOffline = offline;
    this.updateOnlineStatus();
  }

  get isSimulationOffline(): boolean {
    return this.forceOffline;
  }

  private updateOnlineStatus() {
    this.onlineStatus.next(this.isOnline);
  }
}
