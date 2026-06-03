# Requirements Document

## Introduction

Refactoring major do projeto "Binder" (atualmente "RoleQuest BR") para "Roleta Brusca". Esta especificação cobre: rebranding global, integração Firebase Firestore para persistência e autenticação, reformulação da tela "Código" para "Jogar" com sistema de pontuação, sistema Partner/Sidekick em tempo real com códigos temporários de 15 segundos, área administrativa com geolocalização de eventos, e exibição de progressão de nível/título no perfil.

## Glossary

- **App**: A aplicação PWA "Roleta Brusca" executada no navegador.
- **Firestore**: O serviço Firebase Cloud Firestore usado para persistência remota e sincronização.
- **Player**: Um usuário registrado no sistema com perfil, XP, nível e títulos.
- **Event**: Uma sessão de jogo com duração limitada, participantes e ranking.
- **Category**: Uma categoria fixa de ação que pode ser pontuada durante um evento.
- **Sidekick**: O jogador que gera um código de validação para outro jogador pontuar.
- **Validator**: O jogador que digita o código gerado por um Sidekick na tela "Jogar" para pontuar.
- **Validation_Code**: Um código alfanumérico temporário gerado pelo Sidekick com validade de 15 segundos.
- **Toast**: Um componente visual de notificação temporária exibido ao usuário.
- **Admin**: Um jogador com permissões elevadas para criar eventos geográficos e visualizar rankings.
- **Geo_Event**: Um evento criado por um Admin com coordenadas geográficas e raio de ativação.
- **Play_Screen**: A tela "Jogar" que substitui a antiga tela "Código", onde o Validator digita códigos para pontuar.
- **Level_Rules**: O módulo de regras que calcula nível e títulos a partir do XP acumulado.
- **SyncAdapter**: O módulo responsável por sincronizar dados locais (PouchDB) com o Firestore remoto.

## Requirements

### Requirement 1: Global Rebranding

**User Story:** As a Player, I want the application to be named "Roleta Brusca" consistently, so that the product identity is clear and unified.

#### Acceptance Criteria

1. THE App SHALL display "Roleta Brusca" as the application name in the HTML title element.
2. THE App SHALL display "Roleta Brusca" as the PWA manifest `name` field and "Roleta Brusca" as the `short_name` field, and SHALL include "Roleta Brusca" in the manifest `description` field.
3. THE App SHALL use "roleta_brusca" as the PouchDB database name prefix in the appConfig module, retaining any existing version suffix (e.g., "roleta_brusca_mvp_v1").
4. THE App SHALL display "Roleta Brusca" in all user-facing header, navigation, and fallback text (including the noscript element) previously showing "RoleQuest BR" or "RolêQuest".
5. THE App SHALL use "roletabrusca." (with dot separator) as the prefix for all localStorage keys defined in STORAGE_KEYS, replacing the previous "rolequest." prefix.
6. THE App SHALL reference "Roleta Brusca" in the service worker cache name constant (e.g., "roletabrusca-static-v2"), replacing the previous "rolequest-br" prefix.
7. THE App SHALL display "Roleta Brusca" in the meta description tag content.

### Requirement 2: Firebase Firestore Integration

**User Story:** As a Player, I want my data to be persisted in Firebase Firestore, so that my progress is synchronized across devices and sessions.

#### Acceptance Criteria

1. WHEN the application starts, THE App SHALL initialize the Firebase SDK with project configuration before any sync operations are attempted.
2. WHEN a local PouchDB write succeeds, THE SyncAdapter SHALL push the changed document to the Firestore collection that corresponds to the document type (Player, Event, Category, ValidationCode, ScoreEntry, Achievement) within 5 seconds.
3. WHEN the application starts or network connectivity is restored, THE SyncAdapter SHALL pull remote Firestore changes and overwrite the corresponding local PouchDB documents where the remote `updatedAt` timestamp is more recent than the local `updatedAt` timestamp, completing the pull operation within 10 seconds or aborting with a timeout.
4. WHILE the App is offline, THE SyncAdapter SHALL queue pending writes locally up to a maximum of 500 operations and push them to Firestore in creation order upon network restoration.
5. IF a conflict arises between local and remote data during sync, THEN THE SyncAdapter SHALL resolve the conflict by retaining the document with the most recent `updatedAt` timestamp and discarding the other version.
6. IF a push or pull operation fails due to a network error or Firestore rejection, THEN THE SyncAdapter SHALL retry the operation up to 3 times with exponential backoff before marking the operation as failed and retaining the local data unchanged.
7. THE App SHALL maintain full offline functionality by allowing the Player to create, read, update, and delete all local documents via PouchDB regardless of Firestore connectivity status.
8. THE SyncAdapter SHALL include an `updatedAt` ISO 8601 timestamp on every document written to PouchDB and Firestore, set to the time of the most recent modification.

### Requirement 3: Firebase Authentication

**User Story:** As a Player, I want to log in with my identity, so that my data is associated with my account across devices.

#### Acceptance Criteria

1. THE App SHALL provide a login screen using Firebase Authentication with at least one sign-in method (anonymous or email).
2. WHEN a Player authenticates successfully, THE App SHALL store the Firebase user ID as a field in the local Player document and set the active player session in localStorage.
3. IF a Player is not authenticated, THEN THE App SHALL redirect to the login screen and prevent navigation to any other route until authentication succeeds.
4. WHEN a Player logs out, THE App SHALL sign out from Firebase Authentication, remove the active player ID from localStorage, and redirect to the login screen.
5. THE App SHALL persist the Firebase authentication state across browser sessions using Firebase LOCAL persistence so that the Player remains signed in after closing and reopening the browser.
6. IF Firebase Authentication fails during sign-in, THEN THE App SHALL display an error message indicating the failure reason and remain on the login screen without creating or modifying any Player document.

### Requirement 4: Save and Delete Notifications with Redirect

**User Story:** As a Player, I want visual feedback and automatic navigation when data is saved or deleted, so that I know the operation succeeded.

#### Acceptance Criteria

1. WHEN data is saved successfully to PouchDB and Firestore, THE App SHALL display a success Toast with a confirmation message that remains visible for at least 3 seconds before auto-dismissing.
2. WHEN data is deleted successfully from PouchDB and Firestore, THE App SHALL display a success Toast with a confirmation message that remains visible for at least 3 seconds before auto-dismissing.
3. WHEN data is saved successfully, THE App SHALL navigate to the home screen (#/home) within 500 milliseconds of displaying the Toast.
4. WHEN data is deleted successfully, THE App SHALL navigate to the home screen (#/home) within 500 milliseconds of displaying the Toast.
5. IF a save or delete operation fails, THEN THE App SHALL display an error Toast indicating the failure reason and SHALL remain on the current screen without losing any user-entered form data.
6. WHEN a success or error Toast is displayed, THE App SHALL render it with the ARIA role "status" so that screen readers announce the message without interrupting user focus.

### Requirement 5: Play Screen (Jogar) Reformulation

**User Story:** As a Player, I want a "Jogar" screen where I can type a validation code to score points, so that the scoring flow is streamlined.

#### Acceptance Criteria

1. THE App SHALL replace the route "#/categories" with a route "#/jogar" in the navigation and routing system.
2. THE Play_Screen SHALL display the list of active categories in a grid layout, where each category card shows the category name, description, point value badge, and a "Pontuar" button.
3. WHEN the Player taps "Pontuar" on a category, THE Play_Screen SHALL reveal a text input field below the selected category card, accepting up to 5 alphanumeric characters (A–Z, 0–9), and SHALL collapse any previously revealed input field from another category.
4. WHEN a Player submits a code, THE Play_Screen SHALL normalize the input (trim whitespace, convert to uppercase, strip non-alphanumeric characters) and reject submission if the normalized result is not exactly 5 characters, displaying an inline error message in the input area.
5. WHEN a normalized code is submitted, THE App SHALL look up the code among active validation codes, verify that the code belongs to the current event, that the code has not been used, and that fewer than 15 seconds have elapsed since generation, before awarding points.
6. WHEN a valid code is successfully consumed, THE App SHALL award action points to the Validator, award sidekick points to the Sidekick who generated the code, mark the code as used, and display a success Toast indicating the points earned and the category name.
7. IF the submitted code is not found, already used, expired, or is self-generated, THEN THE Play_Screen SHALL display an error message within the input area describing the failure reason, without navigating away from the screen or clearing the input field.
8. WHILE the Player has an active (not expired, not used) generated code for a given category, THE Play_Screen SHALL display a countdown timer on that category card showing the remaining seconds (from 15 down to 0), updated every 1 second.
9. IF no active event is associated with the current session, THEN THE Play_Screen SHALL disable all "Pontuar" buttons and display a message indicating that scoring requires an active event.

### Requirement 6: Partner/Sidekick Code Generation

**User Story:** As a Sidekick, I want to generate a temporary validation code for a category, so that my friend can type it and we both score points.

#### Acceptance Criteria

1. THE Play_Screen SHALL provide a "Gerar Código" action for each category allowing the Sidekick to create a Validation_Code.
2. WHEN the Sidekick taps "Gerar Código", THE App SHALL generate a unique 5-character uppercase alphanumeric Validation_Code (excluding ambiguous characters O, 0, I, 1) and display it on screen within 2 seconds.
3. IF the App fails to generate a unique Validation_Code after 8 attempts, THEN THE App SHALL display an error message indicating code generation failed and prompt the Sidekick to retry.
4. THE Validation_Code SHALL expire exactly 15 seconds after generation.
5. WHILE the Validation_Code status is "active", THE Play_Screen SHALL display a countdown timer showing the integer seconds remaining, updated every second.
6. WHEN the countdown reaches zero, THE App SHALL update the Validation_Code status to "expired" and remove the code from the active codes display.
7. THE App SHALL prevent a Player from generating a Validation_Code for a category if that Player already has an active unexpired code for the same category and event.
8. WHEN the Validation_Code is generated, THE App SHALL store it in Firestore with status "active", the expiration timestamp, and the generator's Player ID for real-time access by other players on separate devices.

### Requirement 7: Sidekick Scoring Rules

**User Story:** As a Player, I want both the code generator and the code validator to receive points, so that collaboration is rewarded.

#### Acceptance Criteria

1. WHEN a Validator submits a valid Validation_Code on the Play_Screen, THE App SHALL create an "action" score entry for the Validator with the category point value.
2. WHEN a Validator submits a valid Validation_Code on the Play_Screen, THE App SHALL create a "sidekick" score entry for the Sidekick (code generator) with the configured sidekick bonus points.
3. WHEN a Validation_Code is used successfully, THE App SHALL set the code status to "used" and record the usage timestamp before returning the scoring result to the Validator.
4. IF a Validator submits a Validation_Code that has already been used, THEN THE App SHALL reject the submission and display an error message indicating the code was already consumed.
5. IF a Validator submits a Validation_Code that has status other than "active" (e.g., expired or cancelled), THEN THE App SHALL reject the submission and display an error message indicating the code is unavailable.
6. THE App SHALL prevent a Player from validating a code that the same Player generated (self-validation blocked).
7. IF a Validation_Code has exceeded its time-to-live of 15 seconds, THEN THE App SHALL transition its status to "expired" and reject any subsequent submission attempt against it.

### Requirement 8: Admin Panel - Event Creation

**User Story:** As an Admin, I want to create geographically-activated events, so that players within a specific area can participate.

#### Acceptance Criteria

1. THE App SHALL provide an admin route "#/admin" accessible only to Players with the Admin role, where the Admin role is determined by a `role` property with value "admin" on the Player document.
2. WHEN a non-Admin Player attempts to access the admin route, THE App SHALL redirect to the home screen.
3. THE Admin panel SHALL provide a form to create a Geo_Event with the following fields: name (required, 1 to 100 characters), description (optional, 0 to 500 characters), center latitude (required, decimal number from -90 to 90), center longitude (required, decimal number from -180 to 180), and activation radius in meters (required, integer from 50 to 10000).
4. IF the Admin submits the Geo_Event form with any required field empty or any value outside its defined range, THEN THE App SHALL keep the form displayed with the entered values preserved and display an error message indicating which field failed validation.
5. WHEN the Admin submits a Geo_Event form with all fields passing validation, THE App SHALL persist the Geo_Event to the data store with status "active" and a `createdAt` timestamp, and display a success Toast.
6. THE Admin panel SHALL display a list of all Geo_Events showing each event's name, activation radius, and current status (active or closed), ordered by creation date descending.

### Requirement 9: Admin Panel - Real-Time Event Rankings

**User Story:** As an Admin, I want to view real-time rankings for active events, so that I can monitor player progress during events.

#### Acceptance Criteria

1. THE Admin panel SHALL display a selectable list of Geo_Events with status "active", sorted by creation date descending.
2. IF no Geo_Events with status "active" exist, THEN THE Admin panel SHALL display an empty state indicating that no active events are available for ranking.
3. WHEN the Admin selects a Geo_Event, THE Admin panel SHALL display the ranking of participants sorted by total points descending, with tiebreaker order: number of actions descending, then earliest last score timestamp ascending.
4. WHEN a new ScoreEntry is added to the selected Geo_Event in Firestore, THE Admin panel SHALL update the ranking display within 5 seconds without requiring a manual page refresh.
5. THE ranking display SHALL show for each participant: player name, total points, number of actions, number of sidekick validations, and current global level.
6. THE ranking display SHALL include all participants registered for the selected Geo_Event, including those with zero points.

### Requirement 10: Home Screen Geo-Event Search

**User Story:** As a Player, I want to search for events in my area from the home screen, so that I can join nearby geo-activated events.

#### Acceptance Criteria

1. THE home screen SHALL display a "Buscar Evento na Área" button that is visible regardless of whether the Player has an active event.
2. WHEN the Player taps "Buscar Evento na Área", THE App SHALL request the current GPS position using the browser Geolocation API with a timeout of 10 seconds.
3. WHEN the GPS position is obtained, THE App SHALL query Firestore for active Geo_Events within a 50-meter radius of the Player position, returning a maximum of 20 results.
4. IF one or more Geo_Events are found within range, THEN THE App SHALL display the list of matching events showing each event name and distance in meters, with a "Participar" button for each event.
5. IF no Geo_Events are found within range, THEN THE App SHALL display an inline message stating "Nenhum evento encontrado por perto" below the search button.
6. IF GPS permission is denied or unavailable, THEN THE App SHALL display an error Toast indicating that location access is required for event search, and retain the home screen in its current state.
7. IF the GPS request exceeds the 10-second timeout, THEN THE App SHALL display an error Toast indicating that the GPS request timed out and the Player should try again.
8. WHEN the Player taps "Participar" on a found Geo_Event, THE App SHALL add the Player to the event participants list, store the event ID as the active event, and navigate to the event screen.
9. IF adding the Player to the event participants list fails, THEN THE App SHALL display an error Toast indicating the participation failed, and keep the search results visible so the Player can retry.

### Requirement 11: Profile Progression Display

**User Story:** As a Player, I want to see my next level and title on my profile, so that I understand my progression path.

#### Acceptance Criteria

1. WHEN the profile screen is rendered, THE profile screen SHALL display the Player current level (integer starting at 1), current XP (integer, 0 or greater), and current primary title (the most recently earned title from the Player titles list, or the default title if no titles have been earned).
2. WHEN the profile screen is rendered, THE profile screen SHALL display the XP required to reach the next level, calculated as current level multiplied by the configured levelXpStep value.
3. WHEN the profile screen is rendered, THE profile screen SHALL display a progress bar representing the percentage of XP earned toward the next level, calculated as (current XP / XP required for next level) × 100, rounded to the nearest integer and capped at 100%.
4. WHEN the profile screen is rendered, THE profile screen SHALL display the name of the next title the Player will unlock, defined as the first entry in the TITLE_TIERS list whose required level is greater than the Player current level.
5. WHILE the Player current level is equal to or greater than the highest defined title tier level, THE profile screen SHALL display a textual indication that maximum title progression has been reached, in place of a next title name.
6. THE Level_Rules module SHALL expose a function that accepts a current XP value (integer, 0 or greater) and returns the XP remaining until the next level as a non-negative integer.
7. THE Level_Rules module SHALL expose a function that accepts a current level (integer, 1 or greater) and returns the title name of the next title tier, or a value indicating no further title tier exists if the Player is at or above the highest defined title tier level.
8. IF the Player XP value provided to the Level_Rules module functions is not a non-negative integer, THEN THE Level_Rules module SHALL treat the value as 0.
