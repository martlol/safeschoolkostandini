import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowLeft, ArrowRight, Check, ClipboardCopy, Download, LockKeyhole, Mail, ShieldCheck, UserRound } from 'lucide-react'
import { additionalCategories, categories, school } from './content'

const allCategories = [...categories, ...additionalCategories]
const steps = ['Kategoria', 'Ngjarja', 'Identiteti', 'Rishikimi']
const identityFields = [
  { key: 'firstName', label: 'Emri', required: true, length: 80 },
  { key: 'lastName', label: 'Mbiemri', required: true, length: 80 },
  { key: 'className', label: 'Klasa', required: true, length: 40 },
  { key: 'teacher', label: 'Mësuesi/ja kujdestar/e', required: false, length: 120 },
  { key: 'idNumber', label: 'Nr. i kartës së identitetit', required: false, length: 32 },
] as const

const blank = {
  category: '', description: '', date: '', place: '', repeated: '', identity: 'anonymous',
  firstName: '', lastName: '', className: '', teacher: '', idNumber: '',
}
type Draft = typeof blank
type Field = keyof Draft
type Errors = Partial<Record<Field, string>>

function today() {
  const now = new Date()
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
  return now.toISOString().slice(0, 10)
}

function validate(step: number, draft: Draft): Errors {
  const errors: Errors = {}
  if (step === 0 && !draft.category) errors.category = 'Zgjidh një kategori për të vazhduar.'
  if (step === 1) {
    if (!draft.description.trim()) errors.description = 'Shkruaj një përshkrim të ngjarjes.'
    if (draft.date > today()) errors.date = 'Zgjidh datën e sotme ose një datë më të hershme.'
    if (!draft.place.trim()) errors.place = 'Shkruaj ku ndodhi ngjarja.'
    if (!draft.repeated) errors.repeated = 'Zgjidh Po ose Jo.'
  }
  if (step === 2 && draft.identity === 'named') {
    for (const { key, required } of identityFields) {
      if (required && !draft[key].trim()) errors[key] = 'Plotëso këtë fushë.'
    }
  }
  return errors
}

function getDetails(draft: Draft) {
  return [
    ['Kategoria', allCategories.find(({ id }) => id === draft.category)?.title ?? ''],
    ['Përshkrimi i ngjarjes', draft.description.trim()],
    ['Data e ngjarjes', draft.date ? draft.date.split('-').reverse().join('.') : 'E papërcaktuar'],
    ['Vendi ku ndodhi', draft.place.trim()],
    ['A është përsëritur?', draft.repeated],
    ['Identiteti', draft.identity === 'anonymous' ? 'Pa emër' : 'Me emër'],
    ...identityFields.filter(({ key }) => draft.identity === 'named' && draft[key].trim()).map(({ key, label }) => [label, draft[key].trim()]),
  ]
}

export default function ReportForm({ selection, notify }: { selection?: { id: string }; notify: (message: string) => void }) {
  const [draft, setDraft] = useState<Draft>(blank)
  const [step, setStep] = useState(0)
  const [errors, setErrors] = useState<Errors>({})
  const [prepared, setPrepared] = useState(false)
  const [showText, setShowText] = useState(false)
  const form = useRef<HTMLFormElement>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  const preview = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!selection) return
    setDraft((current) => ({ ...current, category: selection.id }))
    setErrors({})
    setStep(0)
    setPrepared(false)
    setShowText(false)
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
  }

  function goTo(next: number) {
    setErrors({})
    setStep(next)
    focusHeading()
  }

  function advance(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
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
    setPrepared(true)
    focusHeading()
  }

  const reportText = () => `Raportim për SafeSchool\n\n${getDetails(draft).map(([label, value]) => `${label}: ${value}`).join('\n\n')}`

  async function copy() {
    try {
      await navigator.clipboard.writeText(reportText())
      notify('Teksti i raportit u kopjua.')
    } catch {
      setShowText(true)
      window.requestAnimationFrame(() => { preview.current?.focus(); preview.current?.select() })
    }
  }

  function download() {
    const url = URL.createObjectURL(new Blob([reportText()], { type: 'text/plain;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'raporti-safeschool.txt'
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  function error(field: Field) {
    return errors[field] && <span className="field-error" id={`error-${field}`}>{errors[field]}</span>
  }

  function fieldState(field: Field) {
    return { 'aria-invalid': !!errors[field], 'aria-describedby': errors[field] ? `error-${field}` : undefined }
  }

  if (prepared) {
    return (
      <div className="report-card prepared-card">
        <span className="tile-icon green"><Check size={29} /></span>
        <h3 ref={heading} tabIndex={-1}>Raporti është gati.</h3>
        <p>Deri tani vetëm e ke përgatitur raportin. Kopjoje, hape emailin dhe ngjite tekstin në mesazh para se ta dërgosh.</p>
        {draft.identity === 'anonymous' && <p className="form-note"><LockKeyhole size={17} /> Llogaria e emailit ia tregon adresën tënde marrësit. Për ta ndarë pa emër, mund ta shkarkosh dhe t’ia dorëzosh shkollës personalisht.</p>}
        <div className="prepared-actions">
          <button type="button" className="button button-primary" onClick={copy}><ClipboardCopy size={17} /> Kopjo raportin</button>
          <a className="button button-outline" href={`mailto:${school.reportEmail}?subject=${encodeURIComponent('Raportim për SafeSchool')}`}><Mail size={17} /> Hap emailin</a>
          <button type="button" className="button button-outline" onClick={download}><Download size={17} /> Shkarko tekstin</button>
        </div>
        {showText && <label className="form-field">Kopjoje tekstin e përzgjedhur me tastierë.<textarea ref={preview} value={reportText()} readOnly rows={6} /></label>}
        <div className="prepared-footer">
          <button type="button" className="text-action" onClick={() => { setPrepared(false); goTo(3) }}><ArrowLeft size={17} /> Rishiko</button>
          <button type="button" className="text-action" onClick={() => { setDraft(blank); setPrepared(false); setShowText(false); goTo(0) }}>Raport i ri <ArrowRight size={17} /></button>
        </div>
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
        <h3 id="form-heading" ref={heading} tabIndex={-1}>{['Zgjidh llojin e raportit', 'Përshkruaj situatën', 'Si dëshiron të identifikohesh?', 'Rishiko raportin'][step]}</h3>
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
          <fieldset className="form-group">
            <legend className="visually-hidden">Zgjedhja e identitetit</legend>
            <div className="form-options">
              <label className="form-option"><input type="radio" name="identity" value="anonymous" checked={draft.identity === 'anonymous'} onChange={() => {
                setDraft((current) => ({ ...current, identity: 'anonymous', firstName: '', lastName: '', className: '', teacher: '', idNumber: '' }))
                setErrors({})
              }} /><span><LockKeyhole size={18} /> Pa emër</span></label>
              <label className="form-option"><input type="radio" name="identity" value="named" checked={draft.identity === 'named'} onChange={() => update('identity', 'named')} /><span><UserRound size={18} /> Me emër</span></label>
            </div>
          </fieldset>
          {draft.identity === 'anonymous' ? (
            <p className="form-note"><LockKeyhole size={17} /> Nëse dëshiron të mbetesh pa emër, lër jashtë hollësitë që mund të të identifikojnë. Adresa jote shihet nëse dërgon raportin me email.</p>
          ) : (
            <div className="form-two">
              {identityFields.map(({ key, label, required, length }) => (
                <label className={`form-field ${key === 'idNumber' ? 'full-field' : ''}`} key={key}>{label} {!required && <span className="optional">(opsionale)</span>}
                  <input name={key} maxLength={length} value={draft[key]} onChange={(event) => update(key, event.target.value)} required={required} {...fieldState(key)} aria-describedby={key === 'idNumber' ? 'id-help' : fieldState(key)['aria-describedby']} />
                  {key === 'idNumber' && <span id="id-help" className="field-hint">Plotësoje vetëm nëse shkolla ta ka kërkuar.</span>}
                  {error(key)}
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {step === 3 && (
        <div className="form-fields">
          <dl className="review-details">{getDetails(draft).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
          <p className="form-note"><ShieldCheck size={17} /> Kontrollo hollësitë para se të përgatitësh raportin për dërgim. Faqja nuk i ruan të dhënat.</p>
        </div>
      )}

      <div className="form-actions">
        {step > 0 && <button type="button" className="button button-outline" onClick={() => goTo(step - 1)}><ArrowLeft size={17} /> Kthehu</button>}
        <button className="button button-primary next-button" type="submit">{step === 3 ? 'Përgatit raportin' : 'Vazhdo'} <ArrowRight size={17} /></button>
      </div>
    </form>
  )
}
