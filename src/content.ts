import {
  BookOpen, Eye, FilePenLine, HandHeart, HeartHandshake, Laptop, LockKeyhole,
  MessageCircle, MessagesSquare, ShieldAlert, ShieldCheck, UserRoundMinus, UsersRound,
} from 'lucide-react'
import { categoryLabels } from '../functions/packages/api/reports/report'

export const school = {
  name: 'Gjimnazi Kostandin Kristoforidhi',
  location: 'Elbasan, Shqipëri',
  reportEmail: 'sherbimipsikosocialkonstandink@gmail.com',
  office: 'Për zyrën dhe orarin e shërbimit psikosocial, pyet në sekretarinë e shkollës.',
}

export const navigation = [
  { label: 'Kryefaqja', id: 'kryefaqja' },
  { label: 'Raporto një problem', id: 'raporto' },
  { label: 'Si funksionon?', id: 'si-funksionon' },
  { label: 'Informohu', id: 'informohu' },
  { label: 'Kontakti', id: 'kontakti' },
]

export const features = [
  { title: 'Siguri', description: 'Shpreh shqetësimet e tua dhe kërko ndihmë kur të duhet.', icon: ShieldCheck, color: 'blue' },
  { title: 'Privatësi', description: 'Formulari i dërgon raportet te shërbimi psikosocial i shkollës.', icon: LockKeyhole, color: 'violet' },
  { title: 'Mbështetje', description: 'Personat përgjegjës në shkollë mund ta shqyrtojnë rastin dhe të të mbështesin.', icon: HeartHandshake, color: 'green' },
]

export const categories = [
  { id: 'verbal', title: categoryLabels.verbal, description: 'Fyerje, tallje, kërcënime ose komente poshtëruese.', icon: MessageCircle, color: 'blue' },
  { id: 'fizik', title: categoryLabels.fizik, description: 'Goditje, shtyrje ose dëmtim i sendeve personale.', icon: ShieldAlert, color: 'rose' },
  { id: 'online', title: categoryLabels.online, description: 'Ngacmime, kërcënime ose shpërndarje fotosh pa leje në internet.', icon: Laptop, color: 'violet' },
  { id: 'perjashtim', title: categoryLabels.perjashtim, description: 'Izolim i qëllimshëm nga grupet ose aktivitetet.', icon: UserRoundMinus, color: 'amber' },
  { id: 'konflikte', title: categoryLabels.konflikte, description: 'Mosmarrëveshje ose përplasje për të cilat nevojitet ndihmë.', icon: UsersRound, color: 'green' },
  { id: 'mesuesit', title: categoryLabels.mesuesit, description: 'Sjellje ose situata me stafin që të shqetësojnë.', icon: MessagesSquare, color: 'sky' },
]

export const additionalCategories = [
  { id: 'diskriminim', title: categoryLabels.diskriminim, icon: ShieldAlert },
  { id: 'tjeter', title: categoryLabels.tjeter, icon: FilePenLine },
]

export const articles = [
  {
    title: 'Çfarë është bullizimi?', description: 'Mëso çfarë e dallon bullizimin nga një mosmarrëveshje.', icon: BookOpen, color: 'blue',
    paragraphs: [
      'Bullizimi është një sjellje agresive dhe e padëshiruar që përfshin një pabarazi të fuqisë dhe që përsëritet ose mund të përsëritet. Kjo fuqi mund të vijë nga forca fizike, popullariteti ose qasja te informacioni privat.',
      'Talljet e përsëritura, kërcënimet, goditjet, përjashtimi i qëllimshëm dhe shpërndarja e fotove pa leje janë shembuj të mundshëm.',
      'Edhe një ngjarje e vetme meriton vëmendje kur të lëndon ose të bën të ndihesh i pasigurt. Mund të flasësh me një të rritur që i beson.',
    ],
  },
  {
    title: 'Si ta dallosh bullizimin?', description: 'Vëre shenjat që tregojnë se dikush mund të ketë nevojë për ndihmë.', icon: Eye, color: 'violet',
    paragraphs: [
      'Shiko nëse sjellja përsëritet, nëse i drejtohet vazhdimisht të njëjtit person dhe nëse ai e ka të vështirë ta ndalojë ose të mbrojë veten.',
      'Shmangia e pushimeve me të tjerët, humbja e sendeve ose ankthi para shkollës mund të tregojnë se diçka po e shqetëson dikë. Këto shenja mund të kenë shumë shkaqe.',
      'Pyet me qetësi dhe dëgjo përgjigjen. Nëse situata të shqetëson, kërko mbështetje nga një mësues ose psikologu i shkollës.',
    ],
  },
  {
    title: 'Si të ndihmosh një shok?', description: 'Dëgjoje, qëndro pranë dhe kërkoni ndihmë bashkë.', icon: HandHeart, color: 'green',
    paragraphs: [
      'Gjej një moment të qetë për ta pyetur si ndihet. Dëgjoje me vëmendje, thuaji se e merr seriozisht dhe pyete si do të donte ta ndihmoje.',
      'Ofrohu ta shoqërosh te një mësues i besuar ose te shërbimi psikosocial. Nëse ai rrezikon të lëndohet, njofto menjëherë një të rritur.',
      'Mbaje bisedën private, shmang përballjet që mund ta përkeqësojnë situatën dhe pyete përsëri si ndihet pas disa ditësh.',
    ],
  },
  {
    title: 'Si të mbrohemi nga cyberbullying?', description: 'Mëso si të veprosh kur një ngacmim ndodh në internet.', icon: Laptop, color: 'sky',
    paragraphs: [
      'Kur është e sigurt, ruaj pamje të ekranit me datën dhe emrin e llogarisë. Mbaji private dhe tregoja vetëm një të rrituri të besuar nëse nevojiten për të kuptuar situatën.',
      'Përdor mjetet e platformës për të bllokuar llogarinë dhe për të raportuar përmbajtjen. Kontrollo kush mund të të dërgojë mesazhe ose të shohë postimet e tua.',
      'Shmang përgjigjet hakmarrëse dhe fol me një të rritur nëse ndihesh i kërcënuar ose nëse ngacmimet vazhdojnë.',
    ],
  },
]
