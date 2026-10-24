import { Agendador, aplicarEdicao, herdarEstado } from './fsrs';
import { daysBetween } from './dates';

const agora = new Date(2026, 9, 23, 15, 0);
const em = (dias: number, hora = 9) => new Date(2026, 9, 23 + dias, hora, 0);

describe('Agendador', () => {
  const ag = new Agendador(0.9);

  it('trecho novo entra na revisão hoje', () => {
    const e = Agendador.novo('r1:b1', agora);
    expect(e).toEqual({ key: 'r1:b1', S: 0, D: 0, due: agora, reps: 0, lapses: 0 });
  });

  it('"Não lembrei" volta amanhã, tanto num trecho novo quanto num já revisado', () => {
    const novo = ag.revisar(Agendador.novo('k', agora), 'Again', agora);
    expect(daysBetween(agora, novo.due)).toBe(1);

    const revisado = ag.revisar(Agendador.novo('k', agora), 'Good', agora);
    const lapso = ag.revisar(revisado, 'Again', em(4));
    expect(daysBetween(em(4), lapso.due)).toBe(1);
    expect(lapso.lapses).toBe(1);
  });

  it('notas melhores dão intervalos e estabilidades maiores', () => {
    const base = Agendador.novo('k', agora);
    const [hard, good, easy] = (['Hard', 'Good', 'Easy'] as const).map((n) =>
      ag.revisar(base, n, agora),
    );
    expect(hard.S).toBeLessThan(good.S);
    expect(good.S).toBeLessThan(easy.S);
    expect(hard.due.getTime()).toBeLessThan(good.due.getTime());
    expect(good.due.getTime()).toBeLessThan(easy.due.getTime());
  });

  it('registra a revisão no estado', () => {
    const e = ag.revisar(Agendador.novo('k', agora), 'Good', agora);
    expect(e.key).toBe('k');
    expect(e.reps).toBe(1);
    expect(e.lastReview).toEqual(agora);
    expect(e.D).toBeGreaterThan(0);
  });

  it('revisões sucessivas com acerto aumentam o intervalo', () => {
    let e = ag.revisar(Agendador.novo('k', agora), 'Good', agora);
    const primeiro = daysBetween(agora, e.due);
    const quando = e.due;
    e = ag.revisar(e, 'Good', quando);
    expect(daysBetween(quando, e.due)).toBeGreaterThan(primeiro);
  });

  it('retenção desejada menor espaça mais as revisões', () => {
    const base = Agendador.novo('k', agora);
    const d90 = new Agendador(0.9).revisar(base, 'Good', agora).due;
    const d80 = new Agendador(0.8).revisar(base, 'Good', agora).due;
    expect(d80.getTime()).toBeGreaterThan(d90.getTime());
    expect(new Agendador(0.8).intervaloPara(10)).toBeGreaterThan(ag.intervaloPara(10));
  });

  it('retrievability cai com o tempo e é null para trecho nunca revisado', () => {
    expect(ag.retrievability(Agendador.novo('k', agora), agora)).toBeNull();
    const e = ag.revisar(Agendador.novo('k', agora), 'Good', agora);
    const r1 = ag.retrievability(e, em(1)) as number;
    const r10 = ag.retrievability(e, em(10)) as number;
    expect(r1).toBeGreaterThan(r10);
    expect(r1).toBeLessThanOrEqual(1);
    expect(r10).toBeGreaterThan(0);
  });
});

describe('edição e divisão', () => {
  it('edição grande reduz a estabilidade e agenda para hoje', () => {
    const e = { key: 'k', S: 10, D: 5, due: em(10), reps: 3, lapses: 0, lastReview: em(-5) };
    expect(aplicarEdicao(e, 4, agora)).toEqual({ ...e, S: 4, due: agora });
  });

  it('novos trechos herdam o estado com a própria chave', () => {
    const e = { key: 'r:b8', S: 22, D: 4, due: em(3), reps: 5, lapses: 1 };
    expect(herdarEstado(e, 'r:b9')).toEqual({ ...e, key: 'r:b9' });
  });
});
