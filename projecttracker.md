# EmParking - Apartment Complex Parking Bay Sharing App

## Project Summary

EmParking is an application to streamline the process of sharing parking bays among residents of an apartment complex. Instead of relying on WhatsApp group messages to coordinate parking bay availability, this app provides a structured system for bay owners to mark their spots as available and for residents to claim temporarily available bays.

## Requirements

1. **Database (or data model)**
   - **User**: already exists.
   - **Bay**:
     • `id`
     • `owner_id` (FK → User)
     • `label` (e.g. "A23")
   - **Availability**:
     • `bay_id` (FK → Bay)
     • `is_available` (boolean)
     • `available_from` (optional timestamp)
     • `available_until` (optional timestamp)
     • `recurring_pattern` (optional: daily, weekdays, weekends, etc.)
   - **Claim**:
     • `id`
     • `bay_id` (FK)
     • `claimer_id` (FK → User)
     • `claimed_at` (timestamp)
     • `expected_duration` (optional)
     • `released_at` (nullable timestamp)
     • `notes` (optional text for special instructions)

2. **Flows & Endpoints**
   - **Owner Onboarding**:
     • Register/claim their bay (creates Bay if not exist)
     • Edit bay details (label, location info)
     • Set default availability preferences
   - **Availability Management**:
     • Toggle bay availability ("Make my bay available now")
     • Schedule future availability (date ranges, recurring patterns)
     • Override regular patterns for special cases
   - **Bay Discovery & Claiming**:
     • List all currently available bays
     • Filter by building/location, duration, etc.
     • Claim a bay with expected duration
     • Release a claimed bay
   - **Analytics**:
     • View usage history
     • Track popular times

3. **User Roles & Flows**
   - **Bay Owner**:
     • Register their bay with a specific label/identifier
     • Set availability preferences (always available when not using, specific days/times, etc.)
     • View history of who has used their bay
     • Receive notifications when someone claims/releases their bay

- **Owner Onboarding**:
  • Register/claim their bay (creates Bay if not exist)
  • Edit bay details (label)
  • Set default availability preferences
- **Availability Management**:
  • Toggle bay availability ("Make my bay available now")
  • Schedule future availability (date ranges, recurring patterns)
  • Override regular patterns for special cases
- **Bay Discovery & Claiming**:
  • List all currently available bays
  • Filter by availability duration
  • Claim a bay with expected duration
  • Release a claimed bay
- **Analytics**:
  • View usage history
  • Track popular times

### 3. User Roles & Flows

- **Bay Owner**:
  • Register their bay with a specific label/identifier
  • Set availability preferences (always available when not using, specific days/times, etc.)
  • View history of who has used their bay
  • Receive notifications when someone claims/releases their bay
- **Parking Seeker**:
  • Browse available bays in real-time
  • Claim an available bay with expected duration
  • Release a bay when no longer needed
  • Receive reminders to release bay when duration is near end

### 4. Notifications

- Push notifications for bay claims and releases
- Reminders for scheduled availability changes
- Alerts when a previously unavailable bay becomes available
- Duration expiry reminders for claimers

### 5. Dashboard Views

- **Owner Dashboard**:
  • Current bay status (available, claimed, by whom)
  • Claim history and statistics
  • Quick toggle controls for availability
- **Community Dashboard**:
  • Map or list view of all available bays
  • Filtering and sorting options
  • Quick claim buttons
- **Analytics**:
  • Usage patterns over time
  • Most active users
  • Peak demand times

### 6. Additional Features (Future)

- In-app messaging between owners and claimers
- Rating system for responsible bay usage
- Integration with building management systems
- QR codes for bay identification/verification

### 7. API Endpoints

- **Claim Bay**:
  • When a resident clicks "Claim," create a new Claim record, set `is_available=false`, send notification to owner
- **Release Bay**:
  • When a resident clicks "Release," set `released_at=now()`, set `is_available=true`, send notification to owner
- **History**:
  • Return past Claim/Release logs for bays owned by a user

### 8. UI Components

- **My Bay (Owner)**:
  • Show bay label, availability status, toggle switch (and optional date pickers)
  • Show a simple log (who claimed & when)
- **Browse Bays (Seeker)**:
  • List or grid of "Available Bays" (show bay label + owner's unit)
  • "Claim" button on each card; after claiming, show "Release" button until they release
- Real-time updates: simple polling (e.g., every 10–15 sec) to refresh available bays

### 9. Constraints

- Only one bay per owner
- Atomic claim: once claimed, no other user can claim until release
- All timestamps logged

## Next Steps
Generate all necessary models, routes/controllers, and frontend views in the existing framework so that a developer can drop this into the project, run migrations, and have a working MVP within minutes.
