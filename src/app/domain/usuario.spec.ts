import { CHAVE_NOME, nomeDoUsuario, saudacao } from './usuario';

describe('nomeDoUsuario', () => {
  it('quando há display_name, devolve o nome sem espaços nas pontas', () => {
    const usuario = { email: 'ana@exemplo.com', user_metadata: { [CHAVE_NOME]: '  Ana  ' } };
    expect(nomeDoUsuario(usuario)).toBe('Ana');
  });
  it('quando o display_name está vazio, usa a parte do e-mail antes do @', () => {
    const usuario = { email: 'ana.souza@exemplo.com', user_metadata: { [CHAVE_NOME]: '   ' } };
    expect(nomeDoUsuario(usuario)).toBe('ana.souza');
  });
  it('quando o display_name não é texto, usa o e-mail', () => {
    const usuario = { email: 'ana@exemplo.com', user_metadata: { [CHAVE_NOME]: 42 } };
    expect(nomeDoUsuario(usuario)).toBe('ana');
  });
  it('quando não há metadados nem e-mail, devolve null', () => {
    expect(nomeDoUsuario({})).toBeNull();
  });
  it('quando não há usuário, devolve null', () => {
    expect(nomeDoUsuario(null)).toBeNull();
  });
});

describe('saudacao', () => {
  it('com nome, cumprimenta pelo nome', () => {
    expect(saudacao('Ana')).toBe('Olá, Ana');
  });
  it('sem nome, só cumprimenta', () => {
    expect(saudacao(null)).toBe('Olá');
  });
});
