import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { StudyStore } from '../../core/study-store';
import { ToastService } from '../../core/toast.service';
import { configError, parseNumero } from '../../domain/settings';
import { CONFIG_PADRAO, Configuracoes, Densidade, FaixasNota } from '../../domain/types';

type CampoNumero = 'limite' | 'limiteEdicao' | 'limiteDiario' | keyof FaixasNota;

/** Estabilidade usada no exemplo da retenção desejada (R14.1). */
const S_EXEMPLO = 10;

/** Tela Configurações (design §5.6, R14). Cada alteração vale na hora e é gravada. */
@Component({
  selector: 'app-settings',
  templateUrl: './settings.html',
  styleUrl: './settings.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Settings {
  protected readonly store = inject(StudyStore);
  private readonly toast = inject(ToastService);

  protected readonly config = this.store.config;

  protected readonly retencoes: { valor: Configuracoes['retencao']; rotulo: string }[] = [
    { valor: 0.8, rotulo: '80%' },
    { valor: 0.85, rotulo: '85%' },
    { valor: 0.9, rotulo: '90%' },
    { valor: 0.95, rotulo: '95%' },
  ];
  protected readonly tipos: { valor: Configuracoes['limiteTipo']; rotulo: string }[] = [
    { valor: 'palavras', rotulo: 'Palavras' },
    { valor: 'lacunas', rotulo: 'Lacunas' },
  ];
  protected readonly densidades: { valor: Densidade; rotulo: string }[] = [
    { valor: 'baixa', rotulo: 'Baixa' },
    { valor: 'média', rotulo: 'Média' },
    { valor: 'alta', rotulo: 'Alta' },
  ];

  /** "Com 90%, um trecho com estabilidade de 10 dias volta em N dias." */
  protected readonly exemploRetencao = computed(() => {
    const pct = Math.round(this.config().retencao * 100);
    const dias = this.store.agendador().intervaloPara(S_EXEMPLO);
    return `Com ${pct}%, um trecho com estabilidade de ${S_EXEMPLO} dias volta em ${dias} ${dias === 1 ? 'dia' : 'dias'}.`;
  });

  protected readonly limiteAtual = computed(() => {
    const c = this.config();
    return c.limiteTipo === 'palavras' ? c.limitePalavras : c.limiteLacunas;
  });

  protected readonly ehPadrao = computed(
    () => JSON.stringify(this.config()) === JSON.stringify(CONFIG_PADRAO),
  );

  protected escolherRetencao(retencao: Configuracoes['retencao']): void {
    void this.salvar({ retencao });
  }

  protected escolherTipo(limiteTipo: Configuracoes['limiteTipo']): void {
    void this.salvar({ limiteTipo });
  }

  protected escolherDensidade(densidade: Densidade): void {
    void this.salvar({ densidade });
  }

  /** Campo numérico confirmado (Enter ou sair do campo). Valor inválido volta ao anterior. */
  protected async mudarNumero(campo: CampoNumero, evento: Event): Promise<void> {
    const input = evento.target as HTMLInputElement;
    const n = parseNumero(input.value);
    const c = this.config();
    let mudanca: Partial<Configuracoes>;
    if (campo === 'limite') {
      mudanca = c.limiteTipo === 'palavras' ? { limitePalavras: n } : { limiteLacunas: n };
    } else if (campo === 'easy' || campo === 'good' || campo === 'hard') {
      mudanca = { faixas: { ...c.faixas, [campo]: n } };
    } else {
      mudanca = { [campo]: n };
    }
    const ok = await this.salvar(mudanca);
    if (!ok) input.value = String(this.valorDe(campo));
  }

  protected restaurarPadroes(): void {
    void this.salvar(CONFIG_PADRAO).then((ok) => {
      if (ok) this.toast.show('Configurações padrão restauradas.');
    });
  }

  private async salvar(mudanca: Partial<Configuracoes>): Promise<boolean> {
    const nova = { ...this.config(), ...mudanca };
    const erro = configError(nova);
    if (erro) {
      this.toast.show(erro);
      return false;
    }
    return this.store.saveConfig(nova);
  }

  private valorDe(campo: CampoNumero): number {
    const c = this.config();
    if (campo === 'limite') return this.limiteAtual();
    if (campo === 'easy' || campo === 'good' || campo === 'hard') return c.faixas[campo];
    return c[campo];
  }
}
