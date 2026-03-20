# Design System & Development Guide: Ceres Flood Assessment App (Finalized)

## 1. Design Philosophy: The "Field-Ready" Standard
This application is designed specifically for high-stress, low-connectivity environments. The UI prioritizes **legibility under sunlight**, **large touch targets for gloved hands**, and **automated data entry** to minimize field time.

---

## 2. Information Architecture & Navigation

### Primary Navigation (BottomNavBar) - FIXED
The app uses a **persistent, fixed bottom navigation bar** for high-reachability.
*   **Assessments (Icon: assignment):** Navigates to the Dashboard (`My Assessments`).
*   **Add New (Icon: add_box):** Navigates to the `New Assessment` form.
*   **Settings (Icon: settings):** Navigates to the `Settings & Sync` management screen.

### Top App Bar Actions - SIMPLIFIED
*   **Left Side:** No menu icon. Only a 'Back' arrow on internal screens like `Assessment Details`.
*   **Right Side (Sync Now):** Primary global action to trigger a manual push of local data.

---

## 3. Screen-by-Screen Interaction Detail

### Screen 1: My Assessments (Dashboard)
*   **Clickable Elements:**
    *   `NEW ASSESSMENT` Button: Navigates to the form.
    *   `Sync Now` (Top Right): Triggers manual sync.
    *   Search Bar: Real-time filtering by farm or sector.
    *   Filter Chips (All/Synced/Pending): Toggles the list view.
    *   Individual Farm Cards: Clicking a card navigates to `Assessment Details`.
    *   **Bottom Nav:** Assessments (Active), Add New, Settings.

### Screen 2: New Assessment (Form)
*   **Clickable Elements:**
    *   `X` (Top Left): Closes form without saving.
    *   `Sync Now` (Top Right): Immediate sync attempt.
    *   Condition Selectors (Good/Moderate/Bad): Large, mutually exclusive buttons.
    *   Condition Comments: Text area for site notes.
    *   Chicken Counter: `[-]` and `[+]` buttons. Negative numbers are blocked via logic.
    *   Livestock Notes: Text area for bird health observations.
    *   Infrastructure Toggles: Large switches for Water, Fence, and Ventilation.
    *   `Capture Photo`: Opens camera/file picker.
    *   `Finish & Sync`: Validates and attempts upload (saves locally if offline).
    *   `Save to Drafts`: Saves work-in-progress state.

### Screen 3: Assessment Details
*   **Clickable Elements:**
    *   `Back Arrow` (Top Left): Returns to dashboard.
    *   `Edit Record`: Re-opens the form with existing data.
    *   `Add Supplemental Media`: Post-assessment photo upload.

### Screen 4: Settings & Sync
*   **Clickable Elements:**
    *   `Push Local Data`: Manual global sync trigger.
    *   `Auto-Sync Toggle`: Enables background sync.
    *   `Export`: Generates CSV backup.
    *   `Purge`: Clears local cache.

---

## 4. Mobile-First & Field UX Rationale
*   **No Dropdowns:** Replaced with large toggle buttons to reduce precision taps.
*   **High Contrast:** Public Sans + Ceres Green (#5D8822) ensures readability in glare.
*   **Fixed Nav:** Reducing thumb travel time for core actions.
*   **Offline-First:** All actions save to IndexedDB immediately before attempting any network requests.