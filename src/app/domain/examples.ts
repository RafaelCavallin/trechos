import { Bloco, SegmentoLacuna, SegmentoTexto } from './types';

/**
 * Resumos de exemplo do protótipo (design §9): usados nos testes e no botão
 * "Carregar exemplos" da tela de Matérias.
 */
const T = (t: string, b?: boolean): SegmentoTexto => (b ? { k: 't', t, b } : { k: 't', t });
const G = (id: string, t: string): SegmentoLacuna => ({ k: 'g', id, t });

/** "Atos administrativos": 4 trechos, tabela, Súmula 473, anexos. */
export const ATOS_ADMINISTRATIVOS: Bloco[] = [
  { id: 'b1', type: 'h2', segs: [T('Conceito e requisitos')] },
  {
    id: 'b2',
    type: 'p',
    segs: [
      T('Ato administrativo é a '),
      G('g1', 'manifestação unilateral de vontade'),
      T(' da Administração que, agindo nessa qualidade, produz '),
      G('g2', 'efeitos jurídicos imediatos'),
      T('.'),
    ],
  },
  {
    id: 'b3',
    type: 'list',
    items: [
      [T('Competência', true), T(' — sempre '), G('g3', 'vinculada')],
      [T('Finalidade', true), T(' — sempre vinculada ao '), G('g4', 'interesse público')],
      [T('Forma', true), T(' — em regra vinculada')],
      [
        T('Motivo', true),
        T(' e '),
        T('objeto', true),
        T(' — podem ser '),
        G('g5', 'discricionários'),
      ],
    ],
    qs: [
      {
        id: 'q1',
        q: 'Quais são os cinco requisitos do ato administrativo?',
        a: 'Competência, finalidade, forma, motivo e objeto',
      },
    ],
  },
  {
    id: 'b4',
    type: 'special',
    kind: 'pegadinha',
    segs: [
      T(
        'A banca troca “motivo” por “motivação”. Motivo é o pressuposto de fato e de direito; motivação é a ',
      ),
      G('g6', 'exposição escrita'),
      T(' desse motivo.'),
    ],
  },
  { id: 'b5', type: 'h2', segs: [T('Atributos')] },
  {
    id: 'b6',
    type: 'table',
    rows: [
      [[T('Atributo')], [T('O que significa')]],
      [
        [G('g7', 'Presunção de legitimidade')],
        [T('Presume-se conforme a lei até '), G('g8', 'prova em contrário')],
      ],
      [
        [G('g9', 'Imperatividade')],
        [T('Impõe obrigações a terceiros independentemente de concordância')],
      ],
      [
        [G('g10', 'Autoexecutoriedade')],
        [T('Executa-se sem necessidade de '), G('g11', 'ordem judicial')],
      ],
      [
        [T('Tipicidade')],
        [T('Corresponde a uma figura '), G('g12', 'previamente definida em lei')],
      ],
    ],
    qs: [{ id: 'q2', q: 'Qual atributo dispensa ordem judicial?', a: 'Autoexecutoriedade' }],
  },
  {
    id: 'b7',
    type: 'special',
    kind: 'excecao',
    segs: [
      T('Nem todo ato tem imperatividade: os atos '),
      G('g13', 'enunciativos'),
      T(' — certidões, atestados, pareceres — não a possuem.'),
    ],
  },
  { id: 'b8', type: 'h2', segs: [T('Extinção do ato')] },
  { id: 'b9', type: 'h3', segs: [T('Anulação')] },
  {
    id: 'b10',
    type: 'p',
    segs: [
      T('A anulação recai sobre ato '),
      G('g14', 'ilegal'),
      T(' e pode ser feita pela Administração ou pelo Judiciário. Seus efeitos são '),
      G('g15', 'ex tunc'),
      T(
        ', retroagindo à data do ato. O direito de anular atos favoráveis ao destinatário decai em ',
      ),
      G('g16', 'cinco anos'),
      T(', salvo comprovada má-fé (Lei 9.784/99, art. 54).'),
    ],
  },
  {
    id: 'b11',
    type: 'quote',
    segs: [
      T(
        'A administração pode anular seus próprios atos, quando eivados de vícios que os tornam ilegais, porque deles não se originam direitos; ou revogá-los, por motivo de conveniência ou oportunidade. — Súmula ',
      ),
      G('g17', '473'),
      T(' do STF'),
    ],
  },
  { id: 'b12', type: 'h3', segs: [T('Revogação')] },
  {
    id: 'b13',
    type: 'p',
    segs: [
      T('A revogação recai sobre ato '),
      G('g18', 'válido'),
      T(
        ', por razões de conveniência e oportunidade, e só pode ser feita pela própria Administração. Seus efeitos são ',
      ),
      G('g19', 'ex nunc'),
      T(
        ': o que já foi produzido permanece. Atos vinculados, atos que já exauriram seus efeitos e atos que geraram direito adquirido não podem ser revogados.',
      ),
    ],
  },
  {
    id: 'b14',
    type: 'special',
    kind: 'analogia',
    segs: [
      T(
        'Anular é apagar o que nunca deveria ter sido escrito; revogar é virar a página daqui em diante.',
      ),
    ],
  },
  { id: 'b15', type: 'attach', kind: 'image', name: 'quadro-anulacao-revogacao.png', url: '' },
  { id: 'b16', type: 'h2', segs: [T('Convalidação')] },
  {
    id: 'b17',
    type: 'p',
    segs: [
      T(
        'Convalidação é o suprimento do vício de um ato ilegal, com efeitos retroativos. Só é possível para vícios sanáveis — em regra, de competência (quando não exclusiva) e de forma (quando não essencial) — e desde que não haja lesão ao interesse público nem prejuízo a terceiros.',
      ),
    ],
  },
  {
    id: 'b18',
    type: 'special',
    kind: 'exemplo',
    segs: [
      T(
        'Uma portaria assinada por servidor sem competência delegada pode ser ratificada pela autoridade competente.',
      ),
    ],
  },
  { id: 'b19', type: 'attach', kind: 'file', name: 'Lei 9.784-99 — arts. 53 a 55.pdf', url: '' },
];

/** "Remédios constitucionais": 1 trecho com 2 lacunas e 3 perguntas. */
export const REMEDIOS_CONSTITUCIONAIS: Bloco[] = [
  { id: 'c1', type: 'h2', segs: [T('Remédios constitucionais')] },
  {
    id: 'c2',
    type: 'list',
    items: [
      [T('Habeas corpus', true), T(' — liberdade de locomoção; gratuito e sem advogado')],
      [
        T('Mandado de segurança', true),
        T(' — direito líquido e certo não amparado por HC ou HD; prazo de '),
        G('c-g1', '120 dias'),
      ],
      [T('Habeas data', true), T(' — acesso e retificação de informações pessoais')],
      [
        T('Ação popular', true),
        T(' — proposta por '),
        G('c-g2', 'qualquer cidadão'),
        T(' contra ato lesivo ao patrimônio público'),
      ],
    ],
    qs: [
      { id: 'cq1', q: 'Qual remédio protege a liberdade de locomoção?', a: 'Habeas corpus' },
      {
        id: 'cq2',
        q: 'Qual o prazo para impetrar mandado de segurança?',
        a: '120 dias da ciência do ato',
      },
      { id: 'cq3', q: 'Quem tem legitimidade para propor ação popular?', a: 'Qualquer cidadão' },
    ],
  },
];

/** "Conceito analítico de crime": 1 trecho com 6 lacunas. */
export const TEORIA_DO_CRIME: Bloco[] = [
  { id: 'p1', type: 'h2', segs: [T('Conceito analítico de crime')] },
  {
    id: 'p2',
    type: 'p',
    segs: [
      T('Pelo conceito tripartido, crime é fato '),
      G('p-g1', 'típico'),
      T(', '),
      G('p-g2', 'ilícito'),
      T(' e '),
      G('p-g3', 'culpável'),
      T('. O fato típico é composto por conduta, '),
      G('p-g4', 'resultado'),
      T(', '),
      G('p-g5', 'nexo causal'),
      T(' e tipicidade.'),
    ],
  },
  {
    id: 'p3',
    type: 'special',
    kind: 'pegadinha',
    segs: [
      T('Para a teoria bipartida, a culpabilidade é '),
      G('p-g6', 'pressuposto de aplicação da pena'),
      T(', e não elemento do crime.'),
    ],
  },
];

export interface ExemploMateria {
  nome: string;
  assuntos: { nome: string; resumos: { titulo: string; blocos: Bloco[] }[] }[];
}

/** Hierarquia de exemplo carregada pelo botão "Carregar exemplos". */
export const EXEMPLOS: ExemploMateria[] = [
  {
    nome: 'Direito Administrativo',
    assuntos: [
      {
        nome: 'Atos administrativos',
        resumos: [{ titulo: 'Atos administrativos', blocos: ATOS_ADMINISTRATIVOS }],
      },
    ],
  },
  {
    nome: 'Direito Constitucional',
    assuntos: [
      {
        nome: 'Direitos fundamentais',
        resumos: [{ titulo: 'Remédios constitucionais', blocos: REMEDIOS_CONSTITUCIONAIS }],
      },
    ],
  },
  {
    nome: 'Direito Penal',
    assuntos: [
      {
        nome: 'Teoria do crime',
        resumos: [{ titulo: 'Conceito analítico de crime', blocos: TEORIA_DO_CRIME }],
      },
    ],
  },
];
