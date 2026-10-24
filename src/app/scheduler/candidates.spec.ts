import { ATOS_ADMINISTRATIVOS, REMEDIOS_CONSTITUCIONAIS } from '../domain/examples';
import { Assunto, Resumo } from '../domain/types';
import { scheduledTrechos } from './candidates';
import { Agendador } from './fsrs';

const agora = new Date(2026, 9, 23, 10);
const assuntos: Assunto[] = [
  { id: 'a-atos', materiaId: 'm-adm', nome: 'Atos', ordem: 0 },
  { id: 'a-df', materiaId: 'm-const', nome: 'Direitos fundamentais', ordem: 0 },
];
const resumos: Resumo[] = [
  { id: 'r-atos', assuntoId: 'a-atos', titulo: 'Atos', ordem: 0, blocos: ATOS_ADMINISTRATIVOS },
  {
    id: 'r-rem',
    assuntoId: 'a-df',
    titulo: 'Remédios',
    ordem: 0,
    blocos: REMEDIOS_CONSTITUCIONAIS,
  },
];

describe('scheduledTrechos', () => {
  const ag = new Agendador(0.9);

  it('um candidato por trecho, com matéria, assunto e resumo', () => {
    const lista = scheduledTrechos(resumos, assuntos, [], ag, agora);
    expect(lista.map((t) => t.key)).toEqual([
      'r-atos:b1',
      'r-atos:b5',
      'r-atos:b8',
      'r-atos:b16',
      'r-rem:c1',
    ]);
    expect(lista[4]).toMatchObject({
      materiaId: 'm-const',
      assuntoId: 'a-df',
      resumoId: 'r-rem',
      itens: 5,
    });
  });

  it('trecho sem estado salvo é novo e vence hoje', () => {
    const [t] = scheduledTrechos(resumos, assuntos, [], ag, agora);
    expect(t.estado).toEqual(Agendador.novo('r-atos:b1', agora));
    expect(t.due).toBe(agora);
    expect(t.r).toBeNull();
  });

  it('usa o estado salvo e calcula a retrievability', () => {
    const salvo = ag.revisar(Agendador.novo('r-atos:b5', agora), 'Good', new Date(2026, 9, 20));
    const t = scheduledTrechos(resumos, assuntos, [salvo], ag, agora).find(
      (x) => x.key === 'r-atos:b5',
    );
    expect(t?.estado).toBe(salvo);
    expect(t?.lastReview).toEqual(new Date(2026, 9, 20));
    expect(t?.r).toBeGreaterThan(0);
    expect(t?.r).toBeLessThan(1);
  });

  it('ignora resumos de assuntos desconhecidos', () => {
    const orfao = { ...resumos[0], id: 'orfao', assuntoId: 'sumiu' };
    expect(scheduledTrechos([orfao], assuntos, [], ag, agora)).toEqual([]);
  });
});
