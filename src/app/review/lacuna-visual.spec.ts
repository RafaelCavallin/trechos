import { ItemVerificavel } from '../domain/review';
import { SegmentoDinamico, SegmentoLacuna } from '../domain/types';
import { sessaoNoTrecho } from './fila-preview';
import { Sessao, registrarResultado, revelar } from './session';
import { visualDaLacuna } from './lacuna-visual';

const manual: SegmentoLacuna = { k: 'g', id: 'g1', t: 'vontade' };
const dinamica: SegmentoDinamico = { k: 'd', id: 'd:1', t: 'pública' };
const itens: ItemVerificavel[] = [
  { tipo: 'lacuna', id: 'g1', num: 1, texto: 'vontade' },
  { tipo: 'dinamica', id: 'd:1', num: 2, texto: 'pública' },
];
const inicial = sessaoNoTrecho([], 0);
const revelada = (marcas: Sessao['marcas'] = {}): Sessao => ({ ...revelar(inicial), marcas });

describe('visualDaLacuna', () => {
  it('antes de revelar, mostra a lacuna oculta com o número do item', () => {
    const visual = visualDaLacuna({ sessao: inicial, itens, foco: 0 });
    expect(visual(manual)).toEqual({ estado: 'oculta', numero: 1 });
    expect(visual(dinamica)).toEqual({ estado: 'oculta-dinamica', numero: 2 });
  });

  it('sem sessão, trata como oculta', () => {
    expect(visualDaLacuna({ sessao: null, itens, foco: 0 })(manual).estado).toBe('oculta');
  });

  it('depois de revelar, a lacuna fica clicável e o item em foco é destacado', () => {
    const visual = visualDaLacuna({ sessao: revelada(), itens, foco: 1 });
    expect(visual(manual)).toEqual({
      estado: 'revelada',
      clicavel: true,
      titulo: 'Clique para marcar acerto ou erro',
      focado: false,
    });
    expect(visual(dinamica)).toMatchObject({ estado: 'revelada-dinamica', focado: true });
  });

  it('mostra acerto e erro conforme a marca', () => {
    const visual = visualDaLacuna({ sessao: revelada({ g1: true, 'd:1': false }), itens, foco: 0 });
    expect(visual(manual).estado).toBe('acertou');
    expect(visual(dinamica).estado).toBe('errou');
  });

  it('com a nota calculada, nada é clicável nem focado', () => {
    const resultado = {
      key: 'k',
      titulo: 't',
      materiaId: 'm',
      total: 1,
      acertos: 1,
      pct: 100,
      nota: 'Easy' as const,
      due: new Date(2026, 9, 24),
      erradas: [],
    };
    const sessao = registrarResultado(revelada({ g1: true }), resultado);
    expect(visualDaLacuna({ sessao, itens, foco: 0 })(manual)).toEqual({
      estado: 'acertou',
      clicavel: false,
      titulo: undefined,
      focado: false,
    });
  });
});
