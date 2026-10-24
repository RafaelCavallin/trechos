import { blocosIniciais, newId } from './ids';
import { splitTrechos } from './trechos';

describe('ids', () => {
  it('gera ids com prefixo e sem repetir', () => {
    const ids = new Set(Array.from({ length: 200 }, () => newId('b')));
    expect(ids.size).toBe(200);
    expect([...ids].every((id) => /^b-[0-9a-f]{8}$/.test(id))).toBe(true);
  });

  it('resumo novo: um trecho sem itens, com ids distintos', () => {
    const blocos = blocosIniciais();
    expect(blocos[0].id).not.toBe(blocos[1].id);
    const [trecho, ...resto] = splitTrechos(blocos);
    expect(resto).toEqual([]);
    expect(trecho.titulo).toBe('Primeiro trecho');
    expect(trecho.itens).toBe(0);
  });
});
