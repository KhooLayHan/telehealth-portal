import { createFileRoute } from '@tanstack/react-router'

import { PatientDetailsPage } from '@/features/patients/PatientDetailsPage'

export const Route = createFileRoute('/_protected/patients/$id')({
  component: PatientDetailsPage,
})
