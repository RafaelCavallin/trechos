import {
  Injectable,
  WritableSignal,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { StudyRepository } from '../data/study-repository';
import { EXEMPLOS } from '../domain/examples';
import { blocosIniciais } from '../domain/ids';
import {
  Assunto,
  Bloco,
  CONFIG_PADRAO,
  Configuracoes,
  EstadoTrecho,
  ID,
  Materia,
  RegistroRevisao,
  Resumo,
} from '../domain/types';
import { TrechoAgendado, scheduledTrechos } from '../scheduler/candidates';
import { Agendador } from '../scheduler/fsrs';
import { AuthService } from './auth.service';
import { ToastService } from './toast.service';

export type Nivel = 'materia' | 'assunto' | 'resumo';

const NOME_PADRAO: Record<Nivel, string> = {
  materia: 'Nova matéria',
  assunto: 'Novo assunto',
  resumo: 'Novo resumo',
};

/**
 * Dados de estudo do usuário logado, carregados do banco e compartilhados entre
 * as telas. Toda alteração passa por aqui: grava no banco e atualiza os sinais,
 * e o que depende deles (fila, árvore de matérias) se recalcula sozinho.
 */
@Injectable({ providedIn: 'root' })
export class StudyStore {
  private readonly repo = inject(StudyRepository);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  private readonly _materias = signal<Materia[]>([]);
  private readonly _assuntos = signal<Assunto[]>([]);
  private readonly _resumos = signal<Resumo[]>([]);
  private readonly _estados = signal<EstadoTrecho[]>([]);
  private readonly _registros = signal<RegistroRevisao[]>([]);
  private readonly _config = signal<Configuracoes>(CONFIG_PADRAO);
  private readonly _status = signal<'vazio' | 'carregando' | 'pronto' | 'erro'>('vazio');
  private readonly _agora = signal(new Date());

  readonly materias = computed(() => porOrdem(this._materias()));
  readonly assuntos = computed(() => porOrdem(this._assuntos()));
  readonly resumos = computed(() => porOrdem(this._resumos()));
  readonly estados = this._estados.asReadonly();
  /** Revisões feitas, da mais recente para a mais antiga. */
  readonly registros = this._registros.asReadonly();
  readonly config = this._config.asReadonly();
  readonly status = this._status.asReadonly();
  /** Momento de referência dos cálculos ("hoje"); atualizado a cada carga. */
  readonly agora = this._agora.asReadonly();

  readonly agendador = computed(() => new Agendador(this._config().retencao));

  /** Todos os trechos de todos os resumos, com estado FSRS e retrievability. */
  readonly trechos = computed<TrechoAgendado[]>(() =>
    scheduledTrechos(
      this.resumos(),
      this.assuntos(),
      this._estados(),
      this.agendador(),
      this._agora(),
    ),
  );

  private readonly userId = computed(() => this.auth.user()?.id ?? null);

  constructor() {
    effect(() => {
      const id = this.userId();
      untracked(() => (id ? void this.load() : this.clear()));
    });
  }

  async load(): Promise<void> {
    this._status.set('carregando');
    try {
      const [config, materias, assuntos, resumos, estados, registros] = await Promise.all([
        this.repo.getConfiguracoes(),
        this.repo.listMaterias(),
        this.repo.listAssuntos(),
        this.repo.listResumos(),
        this.repo.listEstados(),
        this.repo.listRegistros(),
      ]);
      this._config.set(config);
      this._materias.set(materias);
      this._assuntos.set(assuntos);
      this._resumos.set(resumos);
      this._estados.set(estados);
      this._registros.set(registros);
      this._agora.set(new Date());
      this._status.set('pronto');
    } catch (erro) {
      console.error(erro);
      this._status.set('erro');
      this.toast.show('Não foi possível carregar seus dados.');
    }
  }

  private clear(): void {
    this._materias.set([]);
    this._assuntos.set([]);
    this._resumos.set([]);
    this._estados.set([]);
    this._registros.set([]);
    this._config.set(CONFIG_PADRAO);
    this._status.set('vazio');
  }

  // ── Criar (R1.2) ────────────────────────────────────────────────────────

  createMateria(): Promise<Materia | undefined> {
    return this.tentar(async () => {
      const m = await this.repo.createMateria(NOME_PADRAO.materia, proximaOrdem(this._materias()));
      this._materias.update((l) => [...l, m]);
      return m;
    });
  }

  createAssunto(materiaId: ID): Promise<Assunto | undefined> {
    return this.tentar(async () => {
      const irmaos = this._assuntos().filter((a) => a.materiaId === materiaId);
      const a = await this.repo.createAssunto(materiaId, NOME_PADRAO.assunto, proximaOrdem(irmaos));
      this._assuntos.update((l) => [...l, a]);
      return a;
    });
  }

  createResumo(assuntoId: ID): Promise<Resumo | undefined> {
    return this.tentar(async () => {
      const irmaos = this._resumos().filter((r) => r.assuntoId === assuntoId);
      const r = await this.repo.createResumo(
        assuntoId,
        NOME_PADRAO.resumo,
        proximaOrdem(irmaos),
        blocosIniciais(),
      );
      this._resumos.update((l) => [...l, r]);
      return r;
    });
  }

  // ── Renomear (R1.3): nome vazio mantém o anterior ──────────────────────

  async rename(nivel: Nivel, id: ID, nome: string): Promise<void> {
    const novo = nome.trim();
    if (!novo) return;
    if (nivel === 'materia') {
      await this.otimista(
        this._materias,
        (l) => mudar(l, id, { nome: novo }),
        () => this.repo.renameMateria(id, novo),
      );
    } else if (nivel === 'assunto') {
      await this.otimista(
        this._assuntos,
        (l) => mudar(l, id, { nome: novo }),
        () => this.repo.renameAssunto(id, novo),
      );
    } else {
      await this.otimista(
        this._resumos,
        (l) => mudar(l, id, { titulo: novo }),
        () => this.repo.renameResumo(id, novo),
      );
    }
  }

  // ── Excluir (R1.4): leva junto tudo o que está dentro ──────────────────

  async remove(nivel: Nivel, id: ID): Promise<boolean> {
    const ok = await this.tentar(async () => {
      if (nivel === 'materia') await this.repo.deleteMateria(id);
      else if (nivel === 'assunto') await this.repo.deleteAssunto(id);
      else await this.repo.deleteResumo(id);
      return true;
    });
    if (!ok) return false;

    const materiasFora = new Set(nivel === 'materia' ? [id] : []);
    const assuntosFora = new Set(
      this._assuntos()
        .filter((a) => (nivel === 'assunto' && a.id === id) || materiasFora.has(a.materiaId))
        .map((a) => a.id),
    );
    const resumosFora = new Set(
      this._resumos()
        .filter((r) => (nivel === 'resumo' && r.id === id) || assuntosFora.has(r.assuntoId))
        .map((r) => r.id),
    );
    const anexos = this._resumos()
      .filter((r) => resumosFora.has(r.id))
      .flatMap((r) => r.blocos)
      .flatMap((b) => (b.type === 'attach' && b.url ? [b.url] : []));
    void this.removeAnexos(anexos);
    this._materias.update((l) => l.filter((m) => !materiasFora.has(m.id)));
    this._assuntos.update((l) => l.filter((a) => !assuntosFora.has(a.id)));
    this._resumos.update((l) => l.filter((r) => !resumosFora.has(r.id)));
    this._estados.update((l) => l.filter((e) => !resumosFora.has(e.key.split(':')[0])));
    this._registros.update((l) => l.filter((r) => !resumosFora.has(r.trechoKey.split(':')[0])));
    return true;
  }

  // ── Reordenar (R1.5): só entre irmãos; grava a nova ordem ──────────────

  async reorder(nivel: Nivel, idsEmOrdem: ID[]): Promise<void> {
    const ordem = new Map(idsEmOrdem.map((id, i) => [id, i]));
    const aplicar = <T extends { id: ID; ordem: number }>(l: T[]) =>
      l.map((x) => (ordem.has(x.id) ? { ...x, ordem: ordem.get(x.id) as number } : x));
    const tabela = { materia: 'materias', assunto: 'assuntos', resumo: 'resumos' } as const;
    const salvar = () => this.repo.reorder(tabela[nivel], idsEmOrdem);
    if (nivel === 'materia') await this.otimista(this._materias, aplicar, salvar);
    else if (nivel === 'assunto') await this.otimista(this._assuntos, aplicar, salvar);
    else await this.otimista(this._resumos, aplicar, salvar);
  }

  // ── Conteúdo do resumo e estado dos trechos (editor) ────────────────────

  /** Troca os blocos do resumo só na memória (o editor salva depois, com `saveBlocos`). */
  setBlocos(resumoId: ID, blocos: Bloco[]): void {
    this._resumos.update((l) => mudar(l, resumoId, { blocos }));
  }

  /** Grava no banco os blocos atuais do resumo. Devolve false se falhar. */
  async saveBlocos(resumoId: ID): Promise<boolean> {
    const resumo = this._resumos().find((r) => r.id === resumoId);
    if (!resumo) return false;
    const ok = await this.tentar(async () => {
      await this.repo.saveBlocos(resumoId, resumo.blocos);
      return true;
    });
    return !!ok;
  }

  /** Grava estados FSRS (divisão de trecho, edição de trecho revisado). */
  async saveEstados(estados: EstadoTrecho[]): Promise<void> {
    const keys = new Set(estados.map((e) => e.key));
    await this.otimista(
      this._estados,
      (l) => [...l.filter((e) => !keys.has(e.key)), ...estados],
      () => this.repo.saveEstados(estados),
    );
  }

  /**
   * Grava o resultado de uma revisão: o novo estado FSRS do trecho e o registro
   * com a marca de cada item (R11.3, R12.2). Devolve false se falhar.
   */
  async recordReview(
    estado: EstadoTrecho,
    registro: Omit<RegistroRevisao, 'id'>,
  ): Promise<boolean> {
    const ok = await this.tentar(async () => {
      const [salvo] = await Promise.all([
        this.repo.addRegistro(registro),
        this.repo.saveEstados([estado]),
      ]);
      return salvo;
    });
    if (!ok) return false;
    this._estados.update((l) => [...l.filter((e) => e.key !== estado.key), estado]);
    this._registros.update((l) => [ok, ...l]);
    return true;
  }

  /** Envia um anexo para a pasta do resumo; devolve o caminho ou undefined. */
  uploadAnexo(resumoId: ID, arquivo: File): Promise<string | undefined> {
    const userId = this.userId();
    if (!userId) return Promise.resolve(undefined);
    return this.tentar(() => this.repo.uploadAnexo(userId, resumoId, arquivo));
  }

  anexoUrl(caminho: string): Promise<string> {
    return this.repo.anexoUrl(caminho);
  }

  /** Remove arquivos do armazenamento sem incomodar o usuário se falhar. */
  async removeAnexos(caminhos: string[]): Promise<void> {
    try {
      await this.repo.removeAnexos(caminhos);
    } catch (erro) {
      console.error(erro);
    }
  }

  // ── Configurações (R14): valem na hora em todas as telas ───────────────

  /**
   * Aplica a configuração na hora e grava no banco. Se o banco recusar, volta
   * ao valor anterior (a menos que outra alteração já tenha vindo depois).
   */
  async saveConfig(config: Configuracoes): Promise<boolean> {
    const antes = this._config();
    this._config.set(config);
    const ok = await this.tentar(async () => {
      await this.repo.saveConfiguracoes(config);
      return true;
    });
    if (!ok && this._config() === config) this._config.set(antes);
    return !!ok;
  }

  // ── Exemplos do protótipo ──────────────────────────────────────────────

  async loadExamples(): Promise<boolean> {
    const ok = await this.tentar(async () => {
      let ordemMateria = proximaOrdem(this._materias());
      for (const exemplo of EXEMPLOS) {
        const m = await this.repo.createMateria(exemplo.nome, ordemMateria++);
        for (const [ia, assunto] of exemplo.assuntos.entries()) {
          const a = await this.repo.createAssunto(m.id, assunto.nome, ia);
          for (const [ir, resumo] of assunto.resumos.entries()) {
            await this.repo.createResumo(a.id, resumo.titulo, ir, resumo.blocos);
          }
        }
      }
      return true;
    });
    await this.load();
    return !!ok;
  }

  // ──────────────────────────────────────────────────────────────────────

  private async tentar<T>(acao: () => Promise<T>): Promise<T | undefined> {
    try {
      return await acao();
    } catch (erro) {
      console.error(erro);
      this.toast.show('Não foi possível salvar. Tente de novo.');
      return undefined;
    }
  }

  /** Atualiza a tela na hora e desfaz se o banco recusar. */
  private async otimista<T>(
    alvo: WritableSignal<T[]>,
    mudanca: (l: T[]) => T[],
    salvar: () => Promise<void>,
  ): Promise<void> {
    const antes = alvo();
    alvo.set(mudanca(antes));
    const ok = await this.tentar(async () => {
      await salvar();
      return true;
    });
    if (!ok) alvo.set(antes);
  }
}

function porOrdem<T extends { ordem: number }>(lista: readonly T[]): T[] {
  return [...lista].sort((a, b) => a.ordem - b.ordem);
}

function proximaOrdem(lista: readonly { ordem: number }[]): number {
  return lista.reduce((max, x) => Math.max(max, x.ordem + 1), 0);
}

function mudar<T extends { id: ID }>(lista: T[], id: ID, campos: Partial<T>): T[] {
  return lista.map((x) => (x.id === id ? { ...x, ...campos } : x));
}
