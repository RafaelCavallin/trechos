import { ATOS_ADMINISTRATIVOS, REMEDIOS_CONSTITUCIONAIS } from '../../domain/examples';
import { Assunto, Materia, Resumo } from '../../domain/types';
import { scheduledTrechos } from '../../scheduler/candidates';
import { Agendador } from '../../scheduler/fsrs';
import { buildSubjectTree } from './subject-tree';

const agora = new Date(2026, 9, 23, 10);
const materias: Materia[] = [
  { id: 'adm', nome: 'Direito Administrativo', ordem: 0 },
  { id: 'vazia', nome: 'Português', ordem: 1 },
];
const assuntos: Assunto[] = [
  { id: 'atos', materiaId: 'adm', nome: 'Atos', ordem: 0 },
  { id: 'lic', materiaId: 'adm', nome: 'Licitações', ordem: 1 },
];
const resumos: Resumo[] = [
  { id: 'r-atos', assuntoId: 'atos', titulo: 'Atos', ordem: 0, blocos: ATOS_ADMINISTRATIVOS },
  { id: 'r-rem', assuntoId: 'lic', titulo: 'Outro', ordem: 0, blocos: REMEDIOS_CONSTITUCIONAIS },
];
const ag = new Agendador(0.9);

describe('buildSubjectTree', () => {
  it('monta a hierarquia com contagens de trechos e itens', () => {
    const arvore = buildSubjectTree(
      materias,
      assuntos,
      resumos,
      scheduledTrechos(resumos, assuntos, [], ag, agora),
    );
    expect(arvore.map((m) => [m.materia.id, m.assuntos.map((a) => a.assunto.id)])).toEqual([
      ['adm', ['atos', 'lic']],
      ['vazia', []],
    ]);
    expect(arvore[0].assuntos[0].resumos[0]).toMatchObject({ trechos: 4, itens: 21 });
  });

  it('sem revisões: retenção vazia e próxima revisão hoje (trechos novos)', () => {
    const [adm] = buildSubjectTree(
      materias,
      assuntos,
      resumos,
      scheduledTrechos(resumos, assuntos, [], ag, agora),
    );
    expect(adm.retencao).toBeNull();
    expect(adm.assuntos[0].retencao).toBeNull();
    expect(adm.assuntos[0].proxima).toEqual(agora);
  });

  it('com revisões: retenção em % e a revisão mais próxima', () => {
    const revisoes = ['r-atos:b1', 'r-atos:b5', 'r-atos:b8', 'r-rem:c1'].map((key) =>
      ag.revisar(Agendador.novo(key, agora), 'Good', new Date(2026, 9, 20)),
    );
    const trechos = scheduledTrechos(resumos, assuntos, revisoes, ag, agora);
    const [adm] = buildSubjectTree(materias, assuntos, resumos, trechos);
    const atos = adm.assuntos[0];
    expect(atos.retencao).toBeGreaterThan(0);
    expect(atos.retencao).toBeLessThanOrEqual(100);
    // b16 (Convalidação) não tem itens, então não conta para a próxima revisão.
    expect(atos.proxima).toEqual(revisoes[0].due);
    expect(adm.retencao).toBe(Math.round((atos.retencao! + adm.assuntos[1].retencao!) / 2));
  });
});
