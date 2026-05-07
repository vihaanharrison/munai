## Plan: Stability Fixes + Remaining Feature Build

### Priority 0 — Critical Fix: chair_sessions FK error

**Root cause:** `chair_sessions.committee_id` has a FK to `committees(id)`, and `conference_id` has a FK to `conferences(id)`. Standalone portals insert with `committee_id = standalone_committees.id` and `conference_id = standalone_committees.id`, neither of which exist in the parent tables → FK violation. This breaks both standalone chair login AND any delegate flow that touches a chair session.

**Fix (migration):**
```sql
ALTER TABLE chair_sessions DROP CONSTRAINT chair_sessions_committee_id_fkey;
ALTER TABLE chair_sessions DROP CONSTRAINT chair_sessions_conference_id_fkey;
ALTER TABLE chair_sessions ADD COLUMN source text NOT NULL DEFAULT 'conference'
  CHECK (source IN ('conference','standalone'));
CREATE INDEX chair_sessions_committee_idx ON chair_sessions(committee_id, active);
```
Then update inserts in `StandaloneChairPortal.tsx` to set `source: 'standalone'` and in `ChairPortal.tsx` to set `source: 'conference'`. Validation at app layer replaces FK enforcement.

Apply the same audit to `delegates`, `pois`, `speakers_list`, `committee_agendas`, `mod_caucus`, `unmod_caucus`, `delegate_documents`, `delegate_blocs`, `custom_tab_entries`, `crisis_triggers` — confirm none have FKs to `committees`/`conferences` that would break standalone usage. (Schema dump shows none currently — so only `chair_sessions` is affected.)

### Priority 1 — Navigation: Back vs Exit vs End

Currently the chair/standalone portals only have an "Exit" (LogOut icon) that ends the session. Per spec:

- **Back button** (`ArrowLeft` icon, left side of header): `navigate(-1)` — pure UI navigation, no state change. Tooltip: "Back".
- **Exit button** (`LogOut` icon, right side): leaves portal but **preserves** the committee/conference and the chair session row stays `active=true` so reopening returns the user straight to their dashboard. For SecGen on a conference: same — exit ≠ delete. Tooltip: "Exit".
- **End button** (`PowerOff` icon, separate, gated): destructive. Confirms via OTP/typed name, then:
  - Conference: only available on/after `start_date + 2 days` (third day). Sets `ended_at = now()`, opens 48 h archive window.
  - Standalone: only the head chair (creator `device_id`) sees it. Sets `ended_at`, opens 24 h archive window.

The user's phrasing "exit deletes the conference" conflicts with the earlier spec ("exiting must not delete it"). We will treat **End** as the destructive action and **Exit** as non-destructive — confirmed by the long-form prompt. Will surface a tooltip on End: "End conference (permanent)".

### Priority 2 — Standalone committee persistence in creator's dashboard

Today `standalone_committees.created_by_device_id` exists but Dashboard does not list them. Plan:

1. On standalone create, also store `created_by_user_id uuid null` (new column) when the creator is logged in.
2. `Dashboard.tsx`: add a "My Standalone Committees" section that queries `standalone_committees` where `created_by_user_id = auth.uid() OR created_by_device_id = <localStorage id>` and `ended_at IS NULL`. Each row has Open / End buttons. Items disappear only when End is invoked.

Migration:
```sql
ALTER TABLE standalone_committees ADD COLUMN created_by_user_id uuid;
CREATE INDEX standalone_committees_creator_idx ON standalone_committees(created_by_user_id, ended_at);
```

### Priority 3 — Remaining feature build

Building only what is NOT yet in the codebase per `.lovable/plan.md` and the file inventory:

**A. Live conference clock with multi-timer view**
- New `LiveTimers.tsx` component: subscribes to `speakers_list` (active row), `mod_caucus`, and `unmod_caucus`. Shows current GSL / mod / unmod / crisis timer in one strip at the top of the chair portal and as a read-only banner for delegates.
- New `TimerDrawer.tsx`: floating side tab (like the existing `PlannedNotes`) with quick controls. Opens from a clock icon.
- Session-type dropdown in `SpeakersList` already chooses GSL/modcaucus/crisis — extend to also include `unmod` and wire the dropdown to drive which timer the active "Start/Next" controls.

**B. Auto-reset after speech + AI scoring loop**
- Extend `SpeakersList.startNextSpeaker`: when current speaker is marked `done`, immediately reset `timeLeft = 0`, fire AI scoring (already wired via `ScoreSpeechModal`) for GSL only, then await chair feedback before persisting combined score.
- New edge function `score-speech` (Deno): input `{ speech_text, country, agenda }`, calls Lovable AI Gateway (`google/gemini-2.5-flash`), returns `{ score: 0-10, ai_feedback: string }`. Modal combines with chair's qualitative input → final 0-20 stored in `speakers_list.ai_score` and added to `delegates.marks.Speaking`.

**C. Crisis vs specialized vs standard committees**
- Committee creation form (`SecGenDashboard` create-committee + `CreateStandaloneCommittee`): add radio for `committee_type` ∈ `general | crisis | specialized`.
- `crisis` → `crisis_mode_active` defaults true, locked on; cumulative triggers (already supported via `crisis_triggers.parent_id`); render `CrisisPanel` as the default tab; speakers list includes parsed `crisis_extra_members`.
- `specialized` → unlocks the existing `CustomTabsManager` with up to 2 chair-defined tabs; preset templates for ICJ (courtroom roles, verdict entry) and IPC (press release composer) selectable on creation.
- Persistent banner in delegate view when `crisis_mode_active`: "Crisis information is session-isolated and will not persist after committee end."

**D. Direct POIs to chair, propagation, and Secretariat updates**
- `pois.to_chair` is already in DB; ensure `DelegateRegister` POI form has a "Send to Chair" toggle and `ChairPOIPanel` filters/badges them. (Already partially done — verify and patch any gaps.)
- Add a Secretariat-only "Push Update" form in `SecretariatDashboard` writing to `conference_updates` with `author_role='secretariat'` and `committee_id=null` (global). Realtime subscribers in chair/delegate portals already pick this up; verify subscription exists, add if missing.

**E. Profile gating + Discover**
- Profile already exists. Add gating: when user clicks "Register as Chair" in any registration UI, check `profiles.awards` length ≥ 2 — if not, redirect to `/profile` with an inline notice.
- `UpcomingEvents` already renamed to Discover route `/events`. Add a "People" tab listing profiles where `visible_in_discover=true`.

**F. Archive download (24 h standalone / 48 h conference)**
- `export-conference-archive` edge function already exists. Add a `?source=standalone&id=<uuid>` mode that bundles only that committee's data. Wire a "Download archive" button on the standalone dashboard card during the 24 h window after `ended_at`.

**G. UI clarity**
- Wrap every icon-only button in `<Tooltip>` with `TooltipContent` (Back, Exit, End, ROP, About, Download, etc.). Audit `GlobalNav`, `StandaloneChairPortal` header, `ChairPortal` header, `SecGenDashboard` header.
- Apply the fixed palette (`--background: #EFEEEA`, `--primary: #145D6B`, `--accent: #BC5928`) consistently in `index.css`. Confirm glass surfaces use `backdrop-blur` + low-opacity surface tokens.

### Files to create

- `supabase/migrations/<ts>_chair_sessions_fix_and_standalone_owner.sql`
- `supabase/functions/score-speech/index.ts`
- `src/components/LiveTimers.tsx`
- `src/components/TimerDrawer.tsx`
- `src/components/chair/SpecializedTemplates.tsx` (ICJ / IPC presets)

### Files to edit

- `src/pages/StandaloneChairPortal.tsx` — add `source:'standalone'`, Back button, persist visibility
- `src/pages/ChairPortal.tsx` — add `source:'conference'`, Back button, integrate `LiveTimers`
- `src/pages/Dashboard.tsx` — list user's standalone committees
- `src/pages/CreateStandaloneCommittee.tsx` — store `created_by_user_id`, committee_type radio
- `src/pages/SecGenDashboard.tsx` — committee_type radio on create, oversight enforcement
- `src/pages/SecretariatDashboard.tsx` — push-update form
- `src/pages/DelegateRegister.tsx` & `StandaloneDelegatePortal.tsx` — country dropdown from matrix only, crisis banner
- `src/components/chair/SpeakersList.tsx` — auto-reset + dropdown wiring + unmod
- `src/components/GlobalNav.tsx` — wrap icons in Tooltip
- `src/index.css` — palette tokens

### Out of scope for this pass

- Email notifications, payment flows, multi-language. Audit-log UI surfacing (table exists; consumer can be added later).

Approve to proceed.