import { useEffect, useRef, useState } from 'react'
import {
  ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Check, ClipboardCheck, FilePenLine,
  GraduationCap, HeartHandshake, Mail, MapPin, Menu, ShieldCheck, X,
} from 'lucide-react'
import { articles, categories, features, navigation, school } from './content'
import ReportForm from './ReportForm'

const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`
const process = [
  { title: 'Raporto', detail: 'Plotëso formularin, kontrollo të dhënat dhe dërgo raportin te shërbimi psikosocial.', icon: FilePenLine },
  { title: 'Shqyrtohet', detail: 'Pasi të marrë raportin, personeli përgjegjës mund të shqyrtojë situatën.', icon: ClipboardCheck },
  { title: 'Veprohet', detail: 'Shkolla mund të ndërmarrë hapa për të trajtuar problemin dhe për të ofruar mbështetje.', icon: HeartHandshake },
]

function Brand() {
  return (
    <a className="brand" href="#kryefaqja" aria-label="SafeSchool – Kryefaqja">
      <span className="school-mark"><img src={asset('shkolla.jpg')} alt="" width="42" height="42" /></span>
      <span className="brand-name">Safe<span>School</span></span>
    </a>
  )
}

function Header() {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState('kryefaqja')
  const menuButton = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const update = () => {
      const target = [...navigation].reverse().find(({ id }) => {
        const section = document.getElementById(id)
        return section && section.getBoundingClientRect().top < 140
      })
      setActive(target?.id ?? 'kryefaqja')
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  return (
    <header className="header" onKeyDown={(event) => {
      if (open && event.key === 'Escape') {
        setOpen(false)
        menuButton.current?.focus()
      }
    }}>
      <div className="container header-inner">
        <Brand />
        <button ref={menuButton} type="button" className="icon-button menu-toggle" aria-label={open ? 'Mbyll menunë' : 'Hap menunë'} aria-expanded={open} aria-controls="menuja" onClick={() => setOpen(!open)}>
          {open ? <X /> : <Menu />}
        </button>
        <nav id="menuja" className={open ? 'nav is-open' : 'nav'} aria-label="Navigimi kryesor">
          {navigation.map(({ label, id }) => (
            <a key={id} href={`#${id}`} aria-current={active === id ? 'location' : undefined} onClick={() => setOpen(false)}>{label}</a>
          ))}
          <a className="button button-primary mobile-cta" href="#raporto" onClick={() => setOpen(false)}>Raporto tani <ArrowRight size={16} /></a>
        </nav>
        <a className="button button-primary header-cta" href="#raporto">Raporto tani <ArrowRight size={16} /></a>
      </div>
    </header>
  )
}

function ArticleDialog({ article, onClose }: { article: (typeof articles)[number]; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const element = dialog.current!
    element.showModal()
    return () => element.close()
  }, [])

  return (
    <dialog ref={dialog} aria-labelledby="article-title" onCancel={(event) => { event.preventDefault(); onClose() }} onClick={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <div className="dialog-content">
        <button className="icon-button dialog-close" type="button" autoFocus aria-label="Mbyll artikullin" onClick={onClose}><X size={22} /></button>
        <span className={`tile-icon ${article.color}`}><article.icon /></span>
        <h2 id="article-title">{article.title}</h2>
        {article.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        <button className="button button-outline" type="button" onClick={onClose}><ArrowLeft size={17} /> Kthehu tek artikujt</button>
      </div>
    </dialog>
  )
}

export default function App() {
  const [selection, setSelection] = useState<{ id: string }>()
  const [article, setArticle] = useState<(typeof articles)[number]>()
  const [toast, setToast] = useState('')
  const [showTop, setShowTop] = useState(false)
  const articleTrigger = useRef<HTMLButtonElement>(null)
  const toastTimer = useRef<number>(undefined)

  useEffect(() => {
    const reveal = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed')
          observer.unobserve(entry.target)
        }
      })
    }, { threshold: 0.08 })
    document.querySelectorAll('[data-reveal]').forEach((item) => reveal.observe(item))
    const onScroll = () => setShowTop(window.scrollY > 620)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      reveal.disconnect()
      window.removeEventListener('scroll', onScroll)
      window.clearTimeout(toastTimer.current)
    }
  }, [])

  function notify(message: string) {
    window.clearTimeout(toastTimer.current)
    setToast(message)
    toastTimer.current = window.setTimeout(() => setToast(''), 3500)
  }

  function closeArticle() {
    setArticle(undefined)
    window.requestAnimationFrame(() => articleTrigger.current?.focus())
  }

  return (
    <>
      <a className="skip-link" href="#permbajtja">Kalo te përmbajtja</a>
      <Header />
      <main id="permbajtja" tabIndex={-1}>
        <section id="kryefaqja" className="hero" aria-labelledby="hero-title">
          <div className="container hero-inner">
            <div className="hero-copy">
              <div className="school-label"><GraduationCap size={19} /> {school.name}</div>
              <h1 id="hero-title">Zëri yt ka<br /><span>rëndësi.</span></h1>
              <p>Një shkollë më e sigurt fillon me ty. Raporto bullizimin, ndaje shqetësimin tënd dhe bëhu pjesë e ndryshimit.</p>
              <div className="hero-actions">
                <a className="button button-primary" href="#raporto">Raporto një problem <ArrowRight size={19} /></a>
                <a className="button button-outline" href="#rreth-nesh">Mëso më shumë <ArrowDown size={17} /></a>
              </div>
              <div className="hero-note"><ShieldCheck size={19} /> Një hap drejt një ambienti shkollor më të sigurt.</div>
            </div>
            <div className="hero-visual" aria-hidden="true">
              <span className="hero-orbit orbit-one" /><span className="hero-orbit orbit-two" />
              <img src={asset('safeschool-hero-illustration.png')} alt="" width="1448" height="1086" fetchPriority="high" />
            </div>
          </div>
        </section>

        <section id="rreth-nesh" className="section about" aria-labelledby="about-title">
          <div className="container">
            <div className="section-heading centered" data-reveal>
              <h2 id="about-title">Çfarë është <span>SafeSchool?</span></h2>
              <p>SafeSchool u krijua për nxënësit e gjimnazit. Ai nxit komunikimin, ndihmon në parandalimin e bullizimit dhe i ndihmon personat përgjegjës në shkollë të kuptojnë e të trajtojnë problemet.</p>
            </div>
            <div className="feature-grid" data-reveal>
              {features.map(({ title, description, icon: Icon, color }) => (
                <article className="feature-card" key={title}>
                  <span className={`tile-icon ${color}`}><Icon size={25} /></span>
                  <h3>{title}</h3><p>{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section categories-section" aria-labelledby="categories-title">
          <div className="container">
            <div className="section-heading" data-reveal>
              <h2 id="categories-title">Çfarë dëshiron të raportosh?</h2>
              <p>Zgjidh kategorinë që i përshtatet më mirë situatës tënde.</p>
            </div>
            <div className="category-grid" data-reveal>
              {categories.map(({ id, title, description, icon: Icon, color }) => (
                <a key={id} className={`category-card ${color}`} href="#raporto" onClick={() => setSelection({ id })}>
                  <span className="tile-icon"><Icon size={25} /></span>
                  <span className="category-copy"><strong>{title}</strong><span>{description}</span></span>
                  <ArrowRight className="card-arrow" size={20} />
                </a>
              ))}
            </div>
          </div>
        </section>

        <section id="raporto" className="section report-section" aria-labelledby="report-title">
          <div className="container report-layout">
            <div className="report-intro" data-reveal>
              <span className="tile-icon"><FilePenLine size={27} /></span>
              <h2 id="report-title">Raporto një<br /> problem.</h2>
              <p>Trego çfarë ndodhi me fjalët e tua. Mund të raportosh për veten ose për dikë që ka nevojë për ndihmë.</p>
              <ul className="report-promises">
                <li><Check size={17} /> Katër hapa të thjeshtë</li>
                <li><Check size={17} /> Rishikim para dërgimit</li>
                <li><Check size={17} /> Dërgim te shërbimi psikosocial</li>
              </ul>
            </div>
            <ReportForm selection={selection} notify={notify} />
          </div>
        </section>

        <section id="si-funksionon" className="section process-section" aria-labelledby="process-title">
          <div className="container">
            <div className="section-heading centered" data-reveal><h2 id="process-title">Si funksionon?</h2></div>
            <ol className="process-grid" data-reveal>
              {process.map(({ title, detail, icon: Icon }, index) => (
                <li key={title}>
                  <span className="process-icon"><Icon size={29} /><span>{index + 1}</span></span>
                  <h3>{title}</h3><p>{detail}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="informohu" className="section education-section" aria-labelledby="education-title">
          <div className="container">
            <div className="section-heading" data-reveal>
              <h2 id="education-title">Informohu. Kupto. Vepro.</h2>
              <p>Njih shenjat e bullizimit dhe mëso si të reagosh.</p>
            </div>
            <div className="education-grid" data-reveal>
              {articles.map((item) => (
                <article className="education-card" key={item.title}>
                  <span className={`tile-icon ${item.color}`}><item.icon size={24} /></span>
                  <h3>{item.title}</h3><p>{item.description}</p>
                  <button className="text-action" type="button" aria-label={`Lexo më shumë – ${item.title}`} onClick={(event) => { articleTrigger.current = event.currentTarget; setArticle(item) }}>Lexo më shumë <ArrowRight size={17} /></button>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="kontakti" className="section contact-section" aria-labelledby="contact-title">
          <div className="container">
            <div className="contact-panel" data-reveal>
              <div><span className="tile-icon blue"><HeartHandshake size={25} /></span><h2 id="contact-title">Nuk je vetëm.</h2><p>Mund të flasësh me psikologun e shkollës, një mësues që i beson ose drejtuesit e shkollës. Nëse ndihesh në rrezik tani, drejtohu menjëherë te një i rritur pranë teje.</p></div>
              <div className="contact-details">
                <h3>Shërbimi psikosocial</h3>
                <p><MapPin size={19} /> <span>{school.name}<br />{school.location}</span></p>
                <p>{school.office}</p>
                <a className="text-action" href={`mailto:${school.reportEmail}`}><Mail size={18} /> Hap emailin e shërbimit</a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container">
          <div className="footer-main"><div><Brand /><p>{school.name} · {school.location}</p></div><nav aria-label="Navigimi në fund të faqes">{navigation.map(({ label, id }) => <a key={id} href={`#${id}`}>{label}</a>)}</nav></div>
          <div className="footer-bottom"><span>© {new Date().getFullYear()} SafeSchool</span><span><ShieldCheck size={17} /> Thuaji jo bullizimit. Kërko mbështetje.</span></div>
        </div>
      </footer>
      {showTop && <a className="icon-button back-top" href="#kryefaqja" aria-label="Kthehu në krye"><ArrowUp size={21} /></a>}
      <div className="toast-region" role="status" aria-atomic="true">{toast && <span className="toast"><Check size={19} /> {toast}</span>}</div>
      {article && <ArticleDialog article={article} onClose={closeArticle} />}
    </>
  )
}
