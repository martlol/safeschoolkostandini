import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowLeft, ArrowRight, Check, LockKeyhole, Send, ShieldCheck } from 'lucide-react'
import { additionalCategories, categories } from './content'
import { blankReport, identityFields, reportDetails, today } from '../functions/packages/api/reports/report'
import type { ReportDraft } from '../functions/packages/api/reports/report'

const allCategories = [...categories, ...additionalCategories]
const steps = ['Kategoria', 'Ngjarja', 'Identiteti', 'Rishikimi']
const configuredEndpoint = import.meta.env.VITE_REPORTS_ENDPOINT
const reportEndpoint = /^\/[\w-]+(?:\/[\w-]+)*$/.test(configuredEndpoint ?? '') ? configuredEndpoint : '/api/reports'
type Field = keyof ReportDraft
type Errors = Partial<Record<Field, string>>

const deliveryErrors: Record<string, string> = {
  unavailable: 'Dërgimi nga formulari nuk është aktiv për momentin. Kontakto shërbimin psikosocial në shkollë.',
  failed: 'Raporti nuk u dërgua. Kontrollo lidhjen dhe provo përsëri.',
  pending: 'Dërgimi ende nuk është konfirmuar. Prit pak dhe provo përsëri nga i njëjti formular.',
  invalid: 'Kontrollo të gjitha fushat e raportit dhe provo përsëri.',
  limited: 'Shërbimi ka arritur kufirin e dërgimeve. Provo përsëri më vonë ose fol me shërbimin psikosocial në shkollë.',
}

function validate(step: number, draft: ReportDraft): Errors {
  const errors: Errors = {}
  if (step === 0 && !draft.category) errors.category = 'Zgjidh një kategori për të vazhduar.'
  if (step === 1) {
    if (!draft.description.trim()) errors.description = 'Shkruaj një përshkrim të ngjarjes.'
    if (draft.date > today()) errors.date = 'Zgjidh datën e sotme ose një datë më të hershme.'
    if (!draft.place.trim()) errors.place = 'Shkruaj ku ndodhi ngjarja.'
    if (!draft.repeated) errors.repeated = 'Zgjidh Po ose Jo.'
  }
  if (step === 2) {
    for (const { key } of identityFields) {
      if (!draft[key].trim()) errors[key] = 'Plotëso këtë fushë.'
    }
  }
  return errors
}

export default function ReportForm({ selection, notify }: { selection?: { id: string }; notify: (message: string) => void }) {
  const [draft, setDraft] = useState<ReportDraft>(blankReport)
  const [step, setStep] = useState(0)
  const [errors, setErrors] = useState<Errors>({})
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [deliveryError, setDeliveryError] = useState('')
  const form = useRef<HTMLFormElement>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  const requestId = useRef<string>(undefined)
  const inFlight = useRef(false)

  useEffect(() => {
    if (!selection || inFlight.current) return
    setDraft((current) => ({ ...current, category: selection.id }))
    setErrors({})
    setStep(0)
    setSent(false)
    setDeliveryError('')
    requestId.current = undefined
    window.requestAnimationFrame(() => heading.current?.focus({ preventScroll: true }))
  }, [selection])

  function focusHeading() {
    window.requestAnimationFrame(() => {
      heading.current?.focus({ preventScroll: true })
      heading.current?.scrollIntoView({ block: 'nearest' })
    })
  }

  function update(field: Field, value: string) {
    setDraft((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
    setDeliveryError('')
    requestId.current = undefined
  }

  function goTo(next: number) {
    setErrors({})
    setStep(next)
    focusHeading()
  }

  async function advance(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (inFlight.current) return
    const issues = validate(step, draft)
    const firstIssue = Object.keys(issues)[0]
    if (firstIssue) {
      setErrors(issues)
      window.requestAnimationFrame(() => form.current?.querySelector<HTMLElement>(`[name="${firstIssue}"]`)?.focus())
      return
    }
    if (step < steps.length - 1) {
      goTo(step + 1)
      return
    }
    inFlight.current = true
    setSending(true)
    setDeliveryError('')
    try {
      requestId.current ??= crypto.randomUUID()
      const response = await fetch(reportEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: requestId.current, report: draft }),
        signal: AbortSignal.timeout(30_000),
      })
      const isJson = response.headers.get('content-type')?.toLowerCase().startsWith('application/json')
      if (response.status === 404 || response.status === 405 || (!isJson && response.status < 500)) {
        setDeliveryError(deliveryErrors.unavailable)
        return
      }
      const result = await response.json()
      if (response.ok && result.status === 'sent') {
        setDraft(blankReport)
        requestId.current = undefined
        setSent(true)
        notify('Raporti u dërgua.')
        focusHeading()
        return
      }
      setDeliveryError(Object.hasOwn(deliveryErrors, result.status) ? deliveryErrors[result.status] : deliveryErrors.pending)
    } catch {
      setDeliveryError(deliveryErrors.pending)
    } finally {
      inFlight.current = false
      setSending(false)
    }
  }

  function error(field: Field) {
    return errors[field] && <span className="field-error" id={`error-${field}`}>{errors[field]}</span>
  }

  function fieldState(field: Field) {
    return { 'aria-invalid': !!errors[field], 'aria-describedby': errors[field] ? `error-${field}` : undefined }
  }

  if (sent) {
    return (
      <div className="report-card sent-card">
        <span className="tile-icon green"><Check size={29} /></span>
        <h3 ref={heading} tabIndex={-1}>Raporti u dërgua.</h3>
        <p>SafeSchool e dërgoi raportin me email te shërbimi psikosocial i shkollës.</p>
        <button type="button" className="text-action" onClick={() => { setSent(false); goTo(0) }}>Raport i ri <ArrowRight size={17} /></button>
      </div>
    )
  }

  return (
    <form ref={form} className="report-card" aria-labelledby="form-heading" onSubmit={advance} autoComplete="off" noValidate>
      <ol className="step-list" aria-label="Hapat e raportimit">
        {steps.map((label, index) => (
          <li key={label} className={index <= step ? 'step-reached' : ''} aria-current={index === step ? 'step' : undefined}>
            <span className="step-marker" aria-hidden="true" /><span>{label}</span>
          </li>
        ))}
      </ol>

      <div className="form-heading">
        <p>Hapi {step + 1} nga {steps.length}</p>
        <h3 id="form-heading" ref={heading} tabIndex={-1}>{['Zgjidh llojin e raportit', 'Përshkruaj situatën', 'Plotëso të dhënat e tua', 'Rishiko raportin'][step]}</h3>
      </div>

      {step === 0 && (
        <fieldset className="form-group" aria-describedby={errors.category ? 'error-category' : undefined}>
          <legend className="visually-hidden">Lloji i raportit</legend>
          <div className="form-options">
            {allCategories.map(({ id, title, icon: Icon }) => (
              <label className="form-option" key={id}>
                <input type="radio" name="category" value={id} checked={draft.category === id} onChange={() => update('category', id)} required {...fieldState('category')} />
                <span><Icon size={18} /> {title}</span>
              </label>
            ))}
          </div>
          {error('category')}
        </fieldset>
      )}

      {step === 1 && (
        <div className="form-fields">
          <label className="form-field">Përshkrimi i ngjarjes
            <textarea name="description" placeholder="Çfarë ndodhi?" rows={4} maxLength={4000} value={draft.description} onChange={(event) => update('description', event.target.value)} required {...fieldState('description')} />
            {error('description')}
          </label>
          <div className="form-two">
            <label className="form-field">Data e ngjarjes <span className="optional">(opsionale)</span>
              <input type="date" name="date" max={today()} value={draft.date} onChange={(event) => update('date', event.target.value)} {...fieldState('date')} />
              {error('date')}
            </label>
            <label className="form-field">Vendi ku ndodhi
              <input name="place" placeholder="P.sh. në oborr" maxLength={180} value={draft.place} onChange={(event) => update('place', event.target.value)} required {...fieldState('place')} />
              {error('place')}
            </label>
          </div>
          <fieldset className="form-group" aria-describedby={errors.repeated ? 'error-repeated' : undefined}>
            <legend>A është përsëritur?</legend>
            <div className="form-options compact-options">
              {['Po', 'Jo'].map((value) => <label className="form-option" key={value}><input type="radio" value={value} name="repeated" checked={draft.repeated === value} onChange={() => update('repeated', value)} required {...fieldState('repeated')} /><span>{value}</span></label>)}
            </div>
            {error('repeated')}
          </fieldset>
        </div>
      )}

      {step === 2 && (
        <div className="form-fields">
          <p className="form-note"><LockKeyhole size={17} /> Të katër fushat janë të detyrueshme. Këto të dhëna dërgohen bashkë me raportin te shërbimi psikosocial.</p>
          <div className="form-two">
            {identityFields.map(({ key, label, length }) => (
              <div className="form-field" key={key}>
                <label htmlFor={`report-${key}`}>{label}</label>
                <input id={`report-${key}`} name={key} maxLength={length} value={draft[key]} onChange={(event) => update(key, event.target.value)} required {...fieldState(key)} />
                {error(key)}
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="form-fields">
          <dl className="review-details">{reportDetails(draft).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
          <p className="form-note"><ShieldCheck size={17} /> Kur klikon «Dërgo raportin», SafeSchool ia dërgon me email raportin dhe të dhënat e tua shërbimit psikosocial të shkollës.</p>
          {deliveryError && <p className="delivery-error" role="alert">{deliveryError}</p>}
        </div>
      )}

      <div className="form-actions">
        {step > 0 && <button type="button" className="button button-outline" disabled={sending} onClick={() => goTo(step - 1)}><ArrowLeft size={17} /> Kthehu</button>}
        <button className="button button-primary next-button" type="submit" disabled={sending}>
          {step === 3 ? <>{sending ? 'Duke dërguar…' : 'Dërgo raportin'} <Send size={17} /></> : <>Vazhdo <ArrowRight size={17} /></>}
        </button>
      </div>
    </form>
  )
}
