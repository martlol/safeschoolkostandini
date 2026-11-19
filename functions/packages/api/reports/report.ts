export const categoryLabels = {
  verbal: 'Bullizëm verbal',
  fizik: 'Bullizëm fizik',
  online: 'Cyberbullying',
  perjashtim: 'Përjashtim nga grupi',
  konflikte: 'Konflikte mes nxënësve',
  mesuesit: 'Probleme me mësuesit',
  diskriminim: 'Diskriminim',
  tjeter: 'Problem tjetër',
} as const

export type Category = keyof typeof categoryLabels

export const identityFields = [
  { key: 'firstName', label: 'Emri', length: 80 },
  { key: 'lastName', label: 'Mbiemri', length: 80 },
  { key: 'className', label: 'Klasa', length: 40 },
  { key: 'teacher', label: 'Mësuesi/ja kujdestar/e', length: 120 },
] as const

export const blankReport = {
  category: '', description: '', date: '', place: '', repeated: '',
  firstName: '', lastName: '', className: '', teacher: '',
}

export type ReportDraft = typeof blankReport

export function today() {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Tirane', dateStyle: 'short' }).format(new Date())
}

export function parseReport(value: unknown): ReportDraft | null {
  if (!value || typeof value !== 'object') return null
  const input = value as Record<string, unknown>
  const report = { ...blankReport }
  for (const [key, maxLength] of [
    ['category', 32], ['description', 4000], ['date', 10], ['place', 180], ['repeated', 2],
    ...identityFields.map(({ key, length }) => [key, length] as const),
  ] as const) {
    const field = input[key]
    if (typeof field !== 'string' || field.length > maxLength || (key !== 'description' && /[\r\n]/.test(field))) return null
    report[key] = field.trim()
    if (key !== 'date' && !report[key]) return null
  }

  if (!Object.hasOwn(categoryLabels, report.category) || !['Po', 'Jo'].includes(report.repeated)) return null
  if (report.date) {
    const parsedDate = Date.parse(report.date)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(report.date) || !Number.isFinite(parsedDate)
      || new Date(parsedDate).toISOString().slice(0, 10) !== report.date || report.date > today()) return null
  }
  return report
}

export function reportDetails(report: ReportDraft) {
  return [
    ['Kategoria', categoryLabels[report.category as Category]],
    ['Përshkrimi i ngjarjes', report.description.trim()],
    ['Data e ngjarjes', report.date ? report.date.split('-').reverse().join('.') : 'E papërcaktuar'],
    ['Vendi ku ndodhi', report.place.trim()],
    ['A është përsëritur?', report.repeated],
    ...identityFields.map(({ key, label }) => [label, report[key].trim()]),
  ]
}
