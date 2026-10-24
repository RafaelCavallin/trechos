import { configError, parseNumero } from './settings';
import { CONFIG_PADRAO, Configuracoes } from './types';

const com = (mudanca: Partial<Configuracoes>): Configuracoes => ({ ...CONFIG_PADRAO, ...mudanca });

describe('configError', () => {
  it('aceita os valores padrão', () => {
    expect(configError(CONFIG_PADRAO)).toBeNull();
  });

  it('limite do trecho: inteiro maior que zero', () => {
    expect(configError(com({ limitePalavras: 0 }))).toContain('limite do trecho');
    expect(configError(com({ limiteLacunas: 2.5 }))).toContain('limite do trecho');
    expect(configError(com({ limitePalavras: NaN }))).toContain('limite do trecho');
    expect(configError(com({ limiteLacunas: 1 }))).toBeNull();
  });

  it('faixas: de 0 a 100 e em ordem', () => {
    expect(configError(com({ faixas: { easy: 101, good: 90, hard: 60 } }))).toContain('0 a 100');
    expect(configError(com({ faixas: { easy: 100, good: 90, hard: -1 } }))).toContain('0 a 100');
    expect(configError(com({ faixas: { easy: 100, good: 50, hard: 60 } }))).toContain('ordem');
    expect(configError(com({ faixas: { easy: 80, good: 90, hard: 60 } }))).toContain('ordem');
    expect(configError(com({ faixas: { easy: 70, good: 70, hard: 70 } }))).toBeNull();
  });

  it('limite de edição: de 1 a 100', () => {
    expect(configError(com({ limiteEdicao: 0 }))).toContain('edição');
    expect(configError(com({ limiteEdicao: 101 }))).toContain('edição');
    expect(configError(com({ limiteEdicao: 100 }))).toBeNull();
  });

  it('limite diário: inteiro maior que zero', () => {
    expect(configError(com({ limiteDiario: 0 }))).toContain('diário');
    expect(configError(com({ limiteDiario: 1 }))).toBeNull();
  });
});

describe('parseNumero', () => {
  it('lê números e recusa vazio ou texto', () => {
    expect(parseNumero(' 42 ')).toBe(42);
    expect(parseNumero('2,5')).toBe(2.5);
    expect(parseNumero('')).toBeNaN();
    expect(parseNumero('abc')).toBeNaN();
  });
});
