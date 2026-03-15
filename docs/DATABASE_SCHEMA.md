# Database Schema Version 1  

#### 📘 CATEGORY 1: LOOKUP TABLES

*These tables change rarely. They only need `created_at`.*

**1. `roles`**

* `id` (PK, BigInt)
* `slug` (String, Unique) ➡️ *'admin', 'doctor', 'patient', 'receptionist', 'lab-tech'*
* `name` (String)
* `created_at` (timestamptz)

**2. `departments`**

* `id` (PK, BigInt)
* `slug` (String, Unique)
* `name` (String)
* `created_at` (timestamptz)

**3. `appointment_statuses`**

* `id` (PK, BigInt)
* `slug` (String, Unique) ➡️ *'booked', 'completed', 'cancelled', 'no-show'*
* `name` (String)
* `created_at` (timestamptz)

**4. `schedule_statuses`**

* `id` (PK, BigInt)
* `slug` (String, Unique) ➡️ *'available', 'booked', 'unavailable'*
* `name` (String)
* `created_at` (timestamptz)

**5. `lab_report_statuses`**

* `id` (PK, BigInt)
* `slug` (String, Unique) ➡️ *'pending', 'processing', 'completed', 'rejected'*
* `name` (String)
* `created_at` (timestamptz)

---

#### 👤 CATEGORY 2: IDENTITY & PROFILES

*These are domain tables. They get `created_at`, `updated_at`, and `deleted_at`.*

**6. `users`**

* `id` (PK, BigInt)
* `public_id` (UUIDv7, Unique)
* `slug` (String, Unique)
* `username` (String)
* `email` (String, Unique)
* `password_hash` (String)
* `gender` (Char)
* `date_of_birth` (DateOnly)
* `phone` (String)
* `ic_number` (String, Unique)
* `address` (String)
* `created_at` (timestamptz)
* `updated_at` (timestamptz, Nullable)
* `deleted_at` (timestamptz, Nullable)

**7. `user_roles`**

* `user_id` (PK, FK ➡️ users.id)
* `role_id` (PK, FK ➡️ roles.id)
* `created_at` (timestamptz)

**8. `doctors`**

* `id` (PK, BigInt)
* `public_id` (UUIDv7, Unique)
* `slug` (String, Unique)
* `user_id` (Unique FK ➡️ users.id)
* `department_id` (FK ➡️ departments.id)
* `specialization` (String)
* `created_at` (timestamptz)
* `updated_at` (timestamptz, Nullable)
* `deleted_at` (timestamptz, Nullable)

**9. `patients`**

* `id` (PK, BigInt)
* `public_id` (UUIDv7, Unique)
* `slug` (String, Unique)
* `user_id` (Unique FK ➡️ users.id)
* `blood_group` (String, Nullable)
* `created_at` (timestamptz)
* `updated_at` (timestamptz, Nullable)
* `deleted_at` (timestamptz, Nullable)

---

#### 🏥 CATEGORY 3: CLINIC OPERATIONS & AWS

*The core transactional tables.*

**10. `doctor_schedules`**

* `id` (PK, BigInt)
* `public_id` (UUIDv7, Unique)
* `doctor_id` (FK ➡️ doctors.id)
* `status_id` (FK ➡️ schedule_statuses.id)
* `date` (DateOnly)
* `start_time` (TimeOnly)
* `end_time` (TimeOnly)
* `created_at` (timestamptz)
* `updated_at` (timestamptz, Nullable)
* `deleted_at` (timestamptz, Nullable)

**11. `appointments`**

* `id` (PK, BigInt)
* `public_id` (UUIDv7, Unique)
* `slug` (String, Unique)
* `patient_id` (FK ➡️ patients.id)
* `doctor_id` (FK ➡️ doctors.id)
* `schedule_id` (Unique FK ➡️ doctor_schedules.id)
* `status_id` (FK ➡️ appointment_statuses.id)
* `created_by_user_id` (FK ➡️ users.id) *(Tracks if Receptionist or Patient booked it)*
* `visit_reason` (String)
* `check_in_datetime` (timestamptz, Nullable)
* `cancellation_reason` (String, Nullable)
* `created_at` (timestamptz)
* `updated_at` (timestamptz, Nullable)
* `deleted_at` (timestamptz, Nullable)

**12. `consultations`**

* `id` (PK, BigInt)
* `public_id` (UUIDv7, Unique)
* `slug` (String, Unique)
* `appointment_id` (Unique FK ➡️ appointments.id)
* `consultation_notes` (Text)
* `consultation_datetime` (timestamptz)
* `created_at` (timestamptz)
* `updated_at` (timestamptz, Nullable)
* `deleted_at` (timestamptz, Nullable)

**13. `prescriptions`**

* `id` (PK, BigInt)
* `public_id` (UUIDv7, Unique)
* `consultation_id` (FK ➡️ consultations.id)
* `medication_name` (String)
* `dosage` (String)
* `instructions` (String)
* `created_at` (timestamptz)
* `updated_at` (timestamptz, Nullable)
* `deleted_at` (timestamptz, Nullable)

**14. `lab_reports`** *(The AWS S3 & SQS Integration Table)*

* `id` (PK, BigInt)
* `public_id` (UUIDv7, Unique)
* `slug` (String, Unique)
* `consultation_id` (FK ➡️ consultations.id)
* `patient_id` (FK ➡️ patients.id)
* `status_id` (FK ➡️ lab_report_statuses.id)
* `report_type` (String)
* `s3_object_key` (String, Nullable)
* `uploaded_at` (timestamptz, Nullable)
* `created_at` (timestamptz)
* `updated_at` (timestamptz, Nullable)
* `deleted_at` (timestamptz, Nullable)

TODO: Encouraged to update some of the `string/text` data types from some of the columns from each table to use JSONB string or array instead (e.g. `prescriptions.instructions`, `users.address`, `consultations.consultation_notes`, `lab_reports.biomarkers`). If appriopriate, may suggest creating a new table entirely.

TODO: Suggest new `audit` table for database-level auditing. Can utilize `FUNCTION TRIGGERS`.
