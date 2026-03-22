# TeleHealth Portal Database Schema

> **Version:** 1.0 — DDAC CT071-3-3  
> **Database:** PostgreSQL 18+ (via Amazon RDS)  
> **ORM:** Entity Framework Core  
> **Auth:** ASP.NET Core Identity  
> **UUID Generation:** Native PostgreSQL `uuidv7()` function  
> **Last Updated:** 2026-03-17

---

## Technology Stack

| Component | Technology | Notes |
| ----------- | ----------- | ------- |
| **Database** | PostgreSQL 18+ | Supports native `uuidv7()` function for time-sortable UUIDs |
| **Hosting** | Amazon RDS | Managed PostgreSQL with automated backups |
| **ORM** | Entity Framework Core | Code-first migrations, LINQ queries |
| **Auth** | ASP.NET Core Identity | Handles email/phone verification under the hood |
| **UUIDs** | UUIDv7 | Native PostgreSQL 18 function |
| **Validation** | FluentValidation + Data Annotations | Application-layer validation |
| **Seeding** | Bogus | Realistic fake data generation for development |

---

## Design Principles

| Principle | Implementation |
| ----------- | ---------------- |
| **Dual ID Strategy** | `id` (BIGINT) for internal joins + `public_id` (UUIDv7) for API exposure |
| **No Enums** | Lookup tables for all status/type values (roles, departments, statuses) |
| **Soft Deletes** | `deleted_at` timestamp on all mutable domain tables |
| **JSONB Flexibility** | Semi-structured data (address, allergies, symptoms, biomarkers) stored efficiently |
| **Database Validation** | `UNIQUE`, `CHECK`, and `NOT NULL` constraints for data integrity |
| **Auditability** | `audit_logs` table with triggers capturing all INSERT/UPDATE/DELETE |
| **AWS Integration** | S3 object keys stored; bucket name in appsettings.json |

---

## Table Summary

### Core Tables (16 Total)

| Category | Count | Tables |
| ---------- | --- | -------- |
| **Authentication & RBAC** | 3 | users, roles, user_roles |
| **Lookup Tables** | 4 | departments, appointment_statuses, schedule_statuses, lab_report_statuses |
| **Identity Profiles** | 2 | doctors, patients |
| **Clinic Operations** | 5 | doctor_schedules, appointments, consultations, prescriptions, lab_reports |
| **System & Audit** | 2 | notifications, audit_logs |

---

## Detailed Schema

### 1. Lookup Tables

These tables contain static reference data that rarely changes.

#### roles

Immutable lookup for role-based access control.

| Column | Type | Constraints | Notes |
| -------- | ------ | ------------- | ------- |
| id | INTEGER | PRIMARY KEY, GENERATED ALWAYS AS IDENTITY | Internal ID |
| slug | VARCHAR(50) | NOT NULL, UNIQUE | URL-friendly identifier: 'admin', 'doctor', 'patient', 'receptionist', 'lab_tech' |
| name | VARCHAR(100) | NOT NULL | Display name: 'Administrator', 'Doctor', etc. |
| description | VARCHAR(255) | | Role description |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Immutable timestamp |

**Seed Data:**

```sql
INSERT INTO roles (slug, name, description) VALUES
  ('admin', 'Administrator', 'System administrator with full access'),
  ('doctor', 'Doctor', 'Medical practitioner who can manage appointments and consultations'),
  ('patient', 'Patient', 'Patient user who can book appointments and view medical records'),
  ('receptionist', 'Receptionist', 'Front desk staff who manages appointments'),
  ('lab-tech', 'Lab Technician', 'Laboratory staff who process and upload lab reports');
```

#### departments

Immutable lookup for medical departments.

| Column | Type | Constraints | Notes |
| -------- | ------ | ------------- | ------- |
| id | INTEGER | PRIMARY KEY, GENERATED ALWAYS AS IDENTITY | Internal ID |
| slug | VARCHAR(50) | NOT NULL, UNIQUE | URL-friendly identifier |
| name | VARCHAR(100) | NOT NULL | Display name |
| description | VARCHAR(500) | | Department details |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Immutable timestamp |

**Seed Data:**

```sql
INSERT INTO departments (slug, name, description) VALUES
  ('general', 'General Practice', 'Primary care and general health services'),
  ('cardiology', 'Cardiology', 'Heart and cardiovascular health'),
  ('pediatrics', 'Pediatrics', 'Children and adolescent healthcare'),
  ('orthopedics', 'Orthopedics', 'Bone, joint, and muscle conditions'),
  ('dermatology', 'Dermatology', 'Skin conditions and treatments'),
  ('neurology', 'Neurology', 'Brain and nervous system disorders');
```

#### appointment_statuses

Immutable lookup for appointment lifecycle states.

| Column | Type | Constraints | Notes |
| -------- | ------ | ------------- | ------- |
| id | INTEGER | PRIMARY KEY, GENERATED ALWAYS AS IDENTITY | Internal ID |
| slug | VARCHAR(50) | NOT NULL, UNIQUE | 'booked', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show' |
| name | VARCHAR(100) | NOT NULL | Display name |
| color_code | CHAR(7) | | Hex color for UI, e.g. '#3B82F6' |
| is_terminal | BOOLEAN | NOT NULL, DEFAULT FALSE | Final states prevent further updates |
| description | VARCHAR(255) | | Status meaning |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Immutable timestamp |

**Seed Data:**

```sql
INSERT INTO appointment_statuses (slug, name, color_code, is_terminal, description) VALUES
  ('booked', 'Booked', '#3B82F6', FALSE, 'Appointment confirmed and scheduled'),
  ('checked-in', 'Checked In', '#10B981', FALSE, 'Patient has arrived at clinic'),
  ('in-progress', 'In Progress', '#F59E0B', FALSE, 'Consultation is currently ongoing'),
  ('completed', 'Completed', '#059669', TRUE, 'Appointment finished successfully'),
  ('cancelled', 'Cancelled', '#EF4444', TRUE, 'Appointment was cancelled'),
  ('no-show', 'No Show', '#6B7280', TRUE, 'Patient did not attend the appointment');
```

#### schedule_statuses

Immutable lookup for doctor schedule slot availability.

| Column | Type | Constraints | Notes |
| -------- | ------ | ------------- | ------- |
| id | INTEGER | PRIMARY KEY, GENERATED ALWAYS AS IDENTITY | Internal ID |
| slug | VARCHAR(50) | NOT NULL, UNIQUE | 'available', 'booked', 'blocked' |
| name | VARCHAR(100) | NOT NULL | Display name |
| color_code | CHAR(7) | | Hex color for UI |
| description | VARCHAR(255) | | Status meaning |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Immutable timestamp |

**Seed Data:**

```sql
INSERT INTO schedule_statuses (slug, name, color_code, description) VALUES
  ('available', 'Available', '#10B981', 'Slot is open for booking'),
  ('booked', 'Booked', '#3B82F6', 'Slot has been reserved by a patient'),
  ('blocked', 'Blocked', '#EF4444', 'Slot is blocked by doctor or admin');
```

#### lab_report_statuses

Immutable lookup for lab report processing workflow.

| Column | Type | Constraints | Notes |
| -------- | ------ | ------------- | ------- |
| id | INTEGER | PRIMARY KEY, GENERATED ALWAYS AS IDENTITY | Internal ID |
| slug | VARCHAR(50) | NOT NULL, UNIQUE | 'pending', 'processing', 'completed', 'rejected' |
| name | VARCHAR(100) | NOT NULL | Display name |
| color_code | CHAR(7) | | Hex color for UI |
| description | VARCHAR(255) | | Status meaning |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Immutable timestamp |

**Seed Data:**

```sql
INSERT INTO lab_report_statuses (slug, name, color_code, description) VALUES
  ('pending', 'Pending Upload', '#6B7280', 'Waiting for lab technician to upload PDF'),
  ('processing', 'Processing', '#F59E0B', 'Lambda function is extracting biomarkers'),
  ('completed', 'Completed', '#10B981', 'Lab report successfully processed and ready'),
  ('rejected', 'Rejected', '#EF4444', 'Failed to process or invalid lab report file');
```

---

### 2. Authentication & RBAC Tables

#### users

Core user identity table with dual ID strategy.

| Column | Type | Constraints | Notes |
| -------- | ------ | ----------- | ------- |
| id | BIGINT | PRIMARY KEY, GENERATED ALWAYS AS IDENTITY | Internal ID for joins |
| public_id | UUID | NOT NULL, UNIQUE, DEFAULT uuidv7() | API-exposed ID (UUIDv7) |
| slug | VARCHAR(100) | NOT NULL, UNIQUE | URL-friendly identifier |
| username | VARCHAR(50) | NOT NULL | Login username |
| email | VARCHAR(255) | NOT NULL | Email address |
| password_hash | VARCHAR(255) | NOT NULL | ASP.NET Core Identity hash |
| first_name | VARCHAR(100) | NOT NULL | For UI greetings: "Hello, John" |
| last_name | VARCHAR(100) | NOT NULL | Family name |
| avatar_url | TEXT | | S3 URL: `https://s3.amazonaws.com/avatars/user-uuid.jpg` |
| gender | CHAR(1) | NOT NULL | 'M'=Male, 'F'=Female, 'O'=Other, 'N'=Not specified |
| date_of_birth | DATE | | Birth date (not future) |
| phone | VARCHAR(20) | | E.164 format: '+60123456789' |
| ic_number | VARCHAR(12) | NOT NULL | Malaysian NRIC or passport |
| address | JSONB | | Structured address: street, city, state, postal_code, country |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Account creation |
| updated_at | TIMESTAMPTZ | | Last update (trigger-managed) |
| deleted_at | TIMESTAMPTZ | | Soft delete timestamp |

**Constraints:**

- `chk_users_gender`: CHECK (gender IN ('M', 'F', 'O', 'N'))
- `chk_users_dob_not_future`: CHECK (date_of_birth <= CURRENT_DATE)
- `uq_users_email_active`: UNIQUE (email) WHERE deleted_at IS NULL
- `uq_users_username_active`: UNIQUE (username) WHERE deleted_at IS NULL
- `uq_users_ic_active`: UNIQUE (ic_number) WHERE deleted_at IS NULL

**Sample Fake Data (Bogus):**

```sql
INSERT INTO users (slug, username, email, password_hash, first_name, last_name, gender, date_of_birth, phone, ic_number, address, avatar_url) VALUES
  ('admin-user', 'admin', 'admin@telehealth.test', '$2a$11$...', 'Admin', 'User', 'N', '1980-01-15', '+60123456789', '800101-01-1234', '{"street": "123 Admin Lane", "city": "Kuala Lumpur", "state": "Wilayah Persekutuan", "postal_code": "50000", "country": "MY"}', 'https://s3.amazonaws.com/avatars/admin-uuid.jpg'),
  ('dr-sarah-chen', 'dr.sarah.chen', 'sarah.chen@telehealth.test', '$2a$11$...', 'Sarah', 'Chen', 'F', '1985-03-22', '+60198765432', '850322-03-5678', '{"street": "456 Medical Center Dr", "city": "Petaling Jaya", "state": "Selangor", "postal_code": "47301", "country": "MY"}', 'https://s3.amazonaws.com/avatars/sarah-chen-uuid.jpg'),
  ('patient-ahmad', 'ahmad.razak', 'ahmad.razak@email.com', '$2a$11$...', 'Ahmad', 'Razak', 'M', '1992-07-10', '+60122334455', '920710-10-9012', '{"street": "78 Jalan Bukit Bintang", "city": "Kuala Lumpur", "state": "Wilayah Persekutuan", "postal_code": "55100", "country": "MY"}', 'https://s3.amazonaws.com/avatars/ahmad-uuid.jpg'),
  ('patient-siti', 'siti.nurhaliza', 'siti.nurhaliza@email.com', '$2a$11$...', 'Siti', 'Nurhaliza', 'F', '1988-12-05', '+60111223344', '881205-12-3456', '{"street": "22 Taman Melawati", "city": "Kuala Lumpur", "state": "Wilayah Persekutuan", "postal_code": "53100", "country": "MY"}', 'https://s3.amazonaws.com/avatars/siti-uuid.jpg');
```

#### user_roles

Junction table for many-to-many user-role relationships.

| Column | Type | Constraints | Notes |
| -------- | ------ | ------------- | ------- |
| user_id | BIGINT | NOT NULL, REFERENCES users(id), ON DELETE CASCADE | User FK (part of PK) |
| role_id | INTEGER | NOT NULL, REFERENCES roles(id), ON DELETE CASCADE | Role FK (part of PK) |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Assignment timestamp |

**Constraints:**

- `pk_user_roles`: PRIMARY KEY (user_id, role_id)

**Sample Fake Data (Bogus):**

```sql
INSERT INTO user_roles (user_id, role_id) VALUES
  (1, 1),  -- admin-user gets admin role
  (2, 2),  -- dr.sarah.chen gets doctor role
  (3, 3),  -- ahmad.razak gets patient role
  (4, 3);  -- siti.nurhaliza gets patient role
```

---

### 3. Identity Profile Tables

#### doctors

Doctor profile extension with qualifications and bio.

| Column | Type | Constraints | Notes |
| -------- | ------ | ------------- | ------- |
| id | BIGINT | PRIMARY KEY, GENERATED ALWAYS AS IDENTITY | Internal ID |
| public_id | UUID | NOT NULL, UNIQUE, DEFAULT uuidv7() | API-exposed ID |
| slug | VARCHAR(100) | NOT NULL, UNIQUE | URL-friendly identifier |
| user_id | BIGINT | NOT NULL, REFERENCES users(id), ON DELETE CASCADE | User FK (one-to-one) |
| department_id | INTEGER | NOT NULL, REFERENCES departments(id) | Primary department |
| license_number | VARCHAR(50) | NOT NULL | Medical council registration |
| specialization | VARCHAR(255) | NOT NULL | Medical specialty |
| consultation_fee | DECIMAL(10,2) | | Fee per consultation in MYR |
| qualifications | JSONB | | Degrees and certifications array |
| bio | TEXT | | Professional biography for booking screen |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMPTZ | | Last update (trigger-managed) |
| deleted_at | TIMESTAMPTZ | | Soft delete timestamp |

**Constraints:**

- `chk_doctors_fee_nonnegative`: CHECK (consultation_fee IS NULL OR consultation_fee >= 0)
- `uq_doctors_user_active`: UNIQUE (user_id) WHERE deleted_at IS NULL
- `uq_doctors_license_active`: UNIQUE (license_number) WHERE deleted_at IS NULL

**Sample Fake Data (Bogus):**

```sql
INSERT INTO doctors (slug, user_id, department_id, license_number, specialization, consultation_fee, qualifications, bio) VALUES
  ('dr-sarah-chen-cardio', 2, 2, 'MMC-12345', 'Cardiology', 150.00, '[{"degree": "MD", "institution": "University Malaya", "year": 2010}, {"degree": "Fellowship in Cardiology", "institution": "National Heart Institute", "year": 2015}]', 'Dr. Sarah Chen is a board-certified cardiologist with over 10 years of experience in treating heart conditions. She specializes in preventive cardiology and heart failure management. Fluent in English, Malay, and Mandarin.');
```

#### patients

Patient profile extension with medical information.

| Column | Type | Constraints | Notes |
| -------- | ------ | ------------- | ------- |
| id | BIGINT | PRIMARY KEY, GENERATED ALWAYS AS IDENTITY | Internal ID |
| public_id | UUID | NOT NULL, UNIQUE, DEFAULT uuidv7() | API-exposed ID |
| slug | VARCHAR(100) | NOT NULL, UNIQUE | URL-friendly identifier |
| user_id | BIGINT | NOT NULL, REFERENCES users(id), ON DELETE CASCADE | User FK (one-to-one) |
| blood_group | VARCHAR(3) | | Blood type: 'O+', 'A-', etc. |
| allergies | JSONB | | Known allergies array with allergen, severity, reaction |
| emergency_contact | JSONB | | Single emergency contact: name, relationship, phone |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMPTZ | | Last update (trigger-managed) |
| deleted_at | TIMESTAMPTZ | | Soft delete timestamp |

**Constraints:**

- `uq_patients_user_active`: UNIQUE (user_id) WHERE deleted_at IS NULL

**Sample Fake Data (Bogus):**

```sql
INSERT INTO patients (slug, user_id, blood_group, allergies, emergency_contact) VALUES
  ('ahmad-razak-patient', 3, 'O+', '[{"allergen": "Penicillin", "severity": "severe", "reaction": "Anaphylaxis"}]', '{"name": "Noraini Razak", "relationship": "Spouse", "phone": "+60129876543"}'),
  ('siti-nurhaliza-patient', 4, 'A+', '[{"allergen": "Shellfish", "severity": "moderate", "reaction": "Hives"}, {"allergen": "Dust Mites", "severity": "mild", "reaction": "Sneezing"}]', '{"name": "Ahmad Jafri", "relationship": "Father", "phone": "+60135566778"}');
```

---

### 4. Clinic Operations Tables

#### doctor_schedules

Doctor availability time slots.

| Column | Type | Constraints | Notes |
| -------- | ------ | ------------- | ------- |
| id | BIGINT | PRIMARY KEY, GENERATED ALWAYS AS IDENTITY | Internal ID |
| public_id | UUID | NOT NULL, UNIQUE, DEFAULT uuidv7() | API-exposed ID |
| doctor_id | BIGINT | NOT NULL, REFERENCES doctors(id), ON DELETE CASCADE | Doctor FK |
| status_id | INTEGER | NOT NULL, REFERENCES schedule_statuses(id) | Current availability status |
| date | DATE | NOT NULL | Schedule date |
| start_time | TIME | NOT NULL | Slot start time |
| end_time | TIME | NOT NULL | Slot end time |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMPTZ | | Last update (trigger-managed) |
| deleted_at | TIMESTAMPTZ | | Soft delete timestamp |

**Constraints:**

- `chk_schedules_time_range`: CHECK (end_time > start_time)

**Sample Fake Data (Bogus):**

```sql
INSERT INTO doctor_schedules (public_id, doctor_id, status_id, date, start_time, end_time) VALUES
  (uuidv7(), 1, 1, '2026-03-20', '09:00', '10:00'),  -- Dr. Sarah - available 9-10am
  (uuidv7(), 1, 1, '2026-03-20', '10:00', '11:00'),  -- Dr. Sarah - available 10-11am
  (uuidv7(), 1, 2, '2026-03-20', '11:00', '12:00'),  -- Dr. Sarah - booked 11-12pm
  (uuidv7(), 1, 1, '2026-03-20', '14:00', '15:00'),  -- Dr. Sarah - available 2-3pm
  (uuidv7(), 1, 3, '2026-03-21', '09:00', '10:00');  -- Dr. Sarah - blocked (emergency leave)
```

#### appointments

Patient appointment bookings linking doctors, patients, and schedules.

| Column | Type | Constraints | Notes |
| -------- | ------ | ------------- | ------- |
| id | BIGINT | PRIMARY KEY, GENERATED ALWAYS AS IDENTITY | Internal ID |
| public_id | UUID | NOT NULL, UNIQUE, DEFAULT uuidv7() | API-exposed ID |
| slug | VARCHAR(100) | NOT NULL, UNIQUE | URL-friendly identifier |
| patient_id | BIGINT | NOT NULL, REFERENCES patients(id) | Patient FK |
| doctor_id | BIGINT | NOT NULL, REFERENCES doctors(id) | Doctor FK |
| schedule_id | BIGINT | NOT NULL, REFERENCES doctor_schedules(id), ON DELETE RESTRICT | Schedule slot (enforces no double-booking) |
| status_id | INTEGER | NOT NULL, REFERENCES appointment_statuses(id) | Current status |
| created_by_user_id | BIGINT | NOT NULL, REFERENCES users(id) | Who booked (receptionist or patient) |
| visit_reason | VARCHAR(500) | NOT NULL | Reason for visit |
| symptoms | JSONB | | Patient-reported symptoms at booking time |
| check_in_datetime | TIMESTAMPTZ | | When patient arrived |
| cancellation_reason | VARCHAR(500) | | Why cancelled (if status=cancelled) |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMPTZ | | Last update (trigger-managed) |
| deleted_at | TIMESTAMPTZ | | Soft delete timestamp |

**Constraints:**

- `uq_appointments_schedule_active`: UNIQUE (schedule_id) WHERE deleted_at IS NULL

**Sample Fake Data (Bogus):**

```sql
INSERT INTO appointments (slug, patient_id, doctor_id, schedule_id, status_id, created_by_user_id, visit_reason, symptoms, check_in_datetime) VALUES
  ('apt-ahmad-mar20-1100', 1, 1, 3, 4, 3, 'Chest pain and shortness of breath', '[{"symptom": "Chest pain", "severity": "high", "duration": "2 hours"}, {"symptom": "Shortness of breath", "severity": "moderate", "duration": "2 hours"}]', '2026-03-20 10:55:00+08'),
  ('apt-siti-mar20-1400', 2, 1, 4, 1, 2, 'Annual health checkup', '[]', NULL);  -- Booked by receptionist
```

#### consultations

Medical consultation records created after appointment completion.

| Column | Type | Constraints | Notes |
| -------- | ------ | ------------- | ------- |
| id | BIGINT | PRIMARY KEY, GENERATED ALWAYS AS IDENTITY | Internal ID |
| public_id | UUID | NOT NULL, UNIQUE, DEFAULT uuidv7() | API-exposed ID |
| slug | VARCHAR(100) | NOT NULL, UNIQUE | URL-friendly identifier |
| appointment_id | BIGINT | NOT NULL, REFERENCES appointments(id), ON DELETE RESTRICT | One-to-one with appointment |
| consultation_notes | JSONB | NOT NULL | SOAP format: subjective, objective, assessment, plan |
| follow_up_date | DATE | | Optional scheduled follow-up |
| consultation_datetime | TIMESTAMPTZ | NOT NULL | When consultation occurred |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMPTZ | | Last update (trigger-managed) |
| deleted_at | TIMESTAMPTZ | | Soft delete timestamp |

**Constraints:**

- `uq_consultations_appointment_active`: UNIQUE (appointment_id) WHERE deleted_at IS NULL

**Sample Fake Data (Bogus):**

```sql
INSERT INTO consultations (slug, appointment_id, consultation_notes, follow_up_date, consultation_datetime) VALUES
  ('cons-ahmad-mar20', 1, '{"subjective": "Patient reports sudden onset chest pain radiating to left arm, associated with shortness of breath. No history of similar episodes.", "objective": "BP: 140/90, HR: 95, SpO2: 96%, Lungs clear, no peripheral edema. ECG shows ST elevation in leads V1-V4.", "assessment": "Acute anterior STEMI (ST-elevation myocardial infarction).", "plan": "Immediate transfer to Emergency Department for PCI. Load with aspirin 300mg, clopidogrel 600mg. Notify cardiologist on call."}', '2026-03-27', '2026-03-20 11:30:00+08');
```

#### prescriptions

Medication prescriptions from consultations.

| Column | Type | Constraints | Notes |
| -------- | ------ | ------------- | ------- |
| id | BIGINT | PRIMARY KEY, GENERATED ALWAYS AS IDENTITY | Internal ID |
| public_id | UUID | NOT NULL, UNIQUE, DEFAULT uuidv7() | API-exposed ID |
| consultation_id | BIGINT | NOT NULL, REFERENCES consultations(id), ON DELETE CASCADE | Consultation FK |
| medication_name | VARCHAR(255) | NOT NULL | Brand or generic drug name |
| dosage | VARCHAR(100) | NOT NULL | Amount per dose: '500mg', '10ml' |
| frequency | VARCHAR(100) | NOT NULL | How often: 'TDS', 'BD', 'OD', 'PRN' |
| duration_days | SMALLINT | NOT NULL | Days prescription is valid |
| instructions | JSONB | NOT NULL | Structured dosage instructions |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMPTZ | | Last update (trigger-managed) |
| deleted_at | TIMESTAMPTZ | | Soft delete timestamp |

**Constraints:**

- `chk_prescriptions_duration_positive`: CHECK (duration_days > 0)

**Sample Fake Data (Bogus):**

```sql
INSERT INTO prescriptions (consultation_id, medication_name, dosage, frequency, duration_days, instructions) VALUES
  (1, 'Aspirin', '300mg', 'OD', 30, '{"take_with": "food and water", "warnings": ["May cause stomach irritation", "Avoid alcohol"], "storage": "Room temperature", "missed_dose": "Take as soon as remembered unless close to next dose"}'),
  (1, 'Clopidogrel', '75mg', 'OD', 30, '{"take_with": "food", "warnings": ["Increased bleeding risk", "Inform dentist before procedures"], "storage": "Room temperature, keep dry", "missed_dose": "Take as soon as remembered"}'),
  (1, 'Atorvastatin', '40mg', 'ON', 90, '{"take_with": "evening meal", "warnings": ["Report muscle pain immediately", "Avoid grapefruit juice"], "storage": "Room temperature", "missed_dose": "Take next day at usual time - do not double"}');
```

#### lab_reports

Laboratory test reports with AWS S3/SQS integration.

| Column | Type | Constraints | Notes |
| -------- | ------ | ------------- | ------- |
| id | BIGINT | PRIMARY KEY, GENERATED ALWAYS AS IDENTITY | Internal ID |
| public_id | UUID | NOT NULL, UNIQUE, DEFAULT uuidv7() | API-exposed ID |
| slug | VARCHAR(100) | NOT NULL, UNIQUE | URL-friendly identifier |
| consultation_id | BIGINT | REFERENCES consultations(id) | Optional link to consultation |
| patient_id | BIGINT | NOT NULL, REFERENCES patients(id) | Patient FK |
| status_id | INTEGER | NOT NULL, REFERENCES lab_report_statuses(id) | Processing status |
| report_type | VARCHAR(100) | NOT NULL | Test type: 'Full Blood Count', 'Liver Function' |
| s3_object_key | VARCHAR(500) | | S3 key: 'lab-reports/2026/03/report-uuid.pdf' |
| file_name | VARCHAR(255) | | Original filename for UI display |
| file_size_bytes | BIGINT | | File size (S3 ETags handle integrity) |
| biomarkers | JSONB | | Extracted test results (populated by Lambda) |
| uploaded_at | TIMESTAMPTZ | | When uploaded to S3 |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMPTZ | | Last update (trigger-managed) |
| deleted_at | TIMESTAMPTZ | | Soft delete timestamp |

**Sample Fake Data (Bogus):**

```sql
INSERT INTO lab_reports (slug, consultation_id, patient_id, status_id, report_type, s3_object_key, file_name, file_size_bytes, biomarkers, uploaded_at) VALUES
  ('lab-siti-mar18-fbc', NULL, 2, 3, 'Full Blood Count', 'lab-reports/2026/03/siti-nurhaliza-fbc-uuid.pdf', 'Full_Blood_Count_18Mar2026.pdf', 2457600, '[{"name": "Hemoglobin", "value": 13.8, "unit": "g/dL", "reference_range": "12.0-16.0", "flag": "normal"}, {"name": "White Blood Cells", "value": 7.5, "unit": "x10^9/L", "reference_range": "4.0-11.0", "flag": "normal"}, {"name": "Platelets", "value": 250, "unit": "x10^9/L", "reference_range": "150-400", "flag": "normal"}]', '2026-03-18 09:30:00+08'),
  ('lab-ahmad-mar21-lft', 1, 1, 3, 'Liver Function Test', 'lab-reports/2026/03/ahmad-razak-lft-uuid.pdf', 'Liver_Function_Test_21Mar2026.pdf', 1896448, '[{"name": "ALT", "value": 45, "unit": "U/L", "reference_range": "7-56", "flag": "normal"}, {"name": "AST", "value": 38, "unit": "U/L", "reference_range": "15-46", "flag": "normal"}, {"name": "Bilirubin", "value": 12, "unit": "umol/L", "reference_range": "3-21", "flag": "normal"}]', '2026-03-21 08:15:00+08');
```

---

### 5. System & Audit Tables

#### notifications

Immutable log of all outbound SNS notifications.

| Column | Type | Constraints | Notes |
| -------- | ------ | ------------- | ------- |
| id | BIGINT | PRIMARY KEY, GENERATED ALWAYS AS IDENTITY | Internal ID |
| public_id | UUID | NOT NULL, UNIQUE, DEFAULT uuidv7() | API-exposed ID |
| recipient_user_id | BIGINT | NOT NULL, REFERENCES users(id) | Target user |
| type | VARCHAR(50) | NOT NULL | 'appointment_reminder', 'appointment_confirmation', 'lab_report_ready' |
| channel | VARCHAR(20) | NOT NULL | 'email' or 'sms' |
| subject | VARCHAR(255) | | Email subject (null for SMS) |
| body | TEXT | NOT NULL | Full message content |
| related_entity_type | VARCHAR(50) | | 'appointment' or 'lab_report' |
| related_entity_id | BIGINT | | ID of related record |
| sns_message_id | VARCHAR(100) | | AWS SNS message ID for tracing |
| status | VARCHAR(20) | NOT NULL | 'queued', 'sent', 'failed' |
| sent_at | TIMESTAMPTZ | | When sent to SNS |
| error_message | TEXT | | Error if failed |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMPTZ | | Last update (trigger-managed) |

**Constraints:**

- `chk_notification_status`: CHECK (status IN ('queued', 'sent', 'failed'))

**Sample Fake Data (Bogus):**

```sql
INSERT INTO notifications (recipient_user_id, type, channel, subject, body, related_entity_type, related_entity_id, sns_message_id, status, sent_at) VALUES
  (4, 'lab_report_ready', 'email', 'Your Lab Report is Ready', 'Dear Siti, your Full Blood Count lab report is now available in your TeleHealth portal. Please log in to view the results.', 'lab_report', 1, 'sns-msg-uuid-001', 'sent', '2026-03-18 09:35:00+08'),
  (3, 'appointment_confirmation', 'sms', NULL, 'Hi Ahmad, your appointment with Dr. Sarah Chen on 20 Mar 2026 at 11:00 AM is confirmed. Location: Cardiology Center, Level 3.', 'appointment', 1, 'sns-msg-uuid-002', 'sent', '2026-03-15 14:22:00+08');
```

#### audit_logs

Immutable audit trail for all data changes via triggers.

| Column | Type | Constraints | Notes |
| -------- | ------ | ------------- | ------- |
| id | BIGINT | PRIMARY KEY, GENERATED ALWAYS AS IDENTITY | Internal ID |
| public_id | UUID | NOT NULL, UNIQUE, DEFAULT uuidv7() | API-exposed ID |
| table_name | VARCHAR(100) | NOT NULL | Which table changed |
| record_id | BIGINT | NOT NULL | Affected row ID |
| action | VARCHAR(20) | NOT NULL | 'INSERT', 'UPDATE', 'DELETE' |
| old_values | JSONB | | Full row snapshot before change |
| new_values | JSONB | | Full row snapshot after change |
| changed_columns | JSONB | | Array of changed column names (UPDATE only) |
| performed_by_user_id | BIGINT | REFERENCES users(id) | Who made the change |
| performed_by_system | BOOLEAN | NOT NULL, DEFAULT FALSE | True if Lambda/background job |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Event timestamp |

**Constraints:**

- `chk_audit_action`: CHECK (action IN ('INSERT', 'UPDATE', 'DELETE'))

---

## Database Functions & Triggers

### Updated At Trigger Function

Automatically sets `updated_at = NOW()` on every UPDATE.

```sql
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all domain tables
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_doctors_updated_at
    BEFORE UPDATE ON doctors
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_patients_updated_at
    BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_doctor_schedules_updated_at
    BEFORE UPDATE ON doctor_schedules
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_appointments_updated_at
    BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_consultations_updated_at
    BEFORE UPDATE ON consultations
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_prescriptions_updated_at
    BEFORE UPDATE ON prescriptions
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_lab_reports_updated_at
    BEFORE UPDATE ON lab_reports
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
```

### Audit Log Trigger Function

Captures all INSERT/UPDATE/DELETE operations on sensitive tables.

```sql
CREATE OR REPLACE FUNCTION fn_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    v_old_values   JSONB;
    v_new_values   JSONB;
    v_changed_cols JSONB;
    v_user_id      BIGINT;
    v_is_system    BOOLEAN;
BEGIN
    -- Safely read session variables set by EF Core
    BEGIN
        v_user_id   := current_setting('app.current_user_id')::BIGINT;
        v_is_system := current_setting('app.is_system')::BOOLEAN;
    EXCEPTION WHEN OTHERS THEN
        v_user_id   := NULL;
        v_is_system := TRUE;
    END;

    IF (TG_OP = 'INSERT') THEN
        v_old_values   := NULL;
        v_new_values   := to_jsonb(NEW);
        v_changed_cols := NULL;

    ELSIF (TG_OP = 'UPDATE') THEN
        v_old_values := to_jsonb(OLD);
        v_new_values := to_jsonb(NEW);
        -- Collect only changed columns
        SELECT jsonb_agg(key)
        INTO   v_changed_cols
        FROM   jsonb_each(v_old_values) AS o(key, value)
        WHERE  v_old_values->key IS DISTINCT FROM v_new_values->key;

    ELSIF (TG_OP = 'DELETE') THEN
        v_old_values   := to_jsonb(OLD);
        v_new_values   := NULL;
        v_changed_cols := NULL;
    END IF;

    INSERT INTO audit_logs (
        table_name,
        record_id,
        action,
        old_values,
        new_values,
        changed_columns,
        performed_by_user_id,
        performed_by_system
    ) VALUES (
        TG_TABLE_NAME,
        CASE
            WHEN TG_OP = 'DELETE' THEN OLD.id
            ELSE NEW.id
        END,
        TG_OP,
        v_old_values,
        v_new_values,
        v_changed_cols,
        v_user_id,
        v_is_system
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply audit triggers to sensitive tables
CREATE TRIGGER trg_users_audit
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

CREATE TRIGGER trg_appointments_audit
    AFTER INSERT OR UPDATE OR DELETE ON appointments
    FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

CREATE TRIGGER trg_consultations_audit
    AFTER INSERT OR UPDATE OR DELETE ON consultations
    FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

CREATE TRIGGER trg_prescriptions_audit
    AFTER INSERT OR UPDATE OR DELETE ON prescriptions
    FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

CREATE TRIGGER trg_lab_reports_audit
    AFTER INSERT OR UPDATE OR DELETE ON lab_reports
    FOR EACH ROW EXECUTE FUNCTION fn_audit_log();
```

### EF Core Transaction Usage

Set session variables before performing audited operations:

```csharp
using var transaction = await db.Database.BeginTransactionAsync();

try
{
    // Set audit context
    await db.Database.ExecuteSqlInterpolatedAsync(
        $"SET LOCAL app.current_user_id = {currentUserId}; SET LOCAL app.is_system = 'false';"
    );

    // Perform your audited operations
    var appointment = new Appointment { /* ... */ };
    await db.Appointments.AddAsync(appointment);
    await db.SaveChangesAsync();

    await transaction.CommitAsync();
}
catch
{
    await transaction.RollbackAsync();
    throw;
}
```

---

## Migration Order

Execute migrations in this order to respect foreign key dependencies:

1. **Lookup tables** (no dependencies): `roles`, `departments`, `appointment_statuses`, `schedule_statuses`, `lab_report_statuses`
2. **Identity base**: `users`
3. **Junction table**: `user_roles` (depends on users, roles)
4. **Profile tables**: `doctors` (depends on users, departments), `patients` (depends on users)
5. **Scheduling**: `doctor_schedules` (depends on doctors, schedule_statuses)
6. **Appointments**: `appointments` (depends on patients, doctors, doctor_schedules, appointment_statuses, users)
7. **Medical records**: `consultations` (depends on appointments)
8. **Prescriptions & Lab**: `prescriptions` (depends on consultations), `lab_reports` (depends on consultations, patients, lab_report_statuses)
9. **System tables**: `notifications` (depends on users), `audit_logs` (depends on users)
10. **Seed data**: Insert lookup values
11. **Triggers**: Create `fn_set_updated_at`, `fn_audit_log` and all triggers

---

_Last Updated: March 2026_  
_Schema Version: 1.0_
