export const CHAVE_NOME = 'display_name';

const SAUDACAO = 'Olá';
const SEPARADOR_EMAIL = '@';

export interface UsuarioComNome {
  email?: string;
  user_metadata?: Record<string, unknown>;
}

export function nomeDoUsuario(usuario: UsuarioComNome | null): string | null {
  if (!usuario) return null;
  const nome = usuario.user_metadata?.[CHAVE_NOME];
  if (typeof nome === 'string' && nome.trim()) return nome.trim();
  return usuario.email?.split(SEPARADOR_EMAIL)[0] || null;
}

export function saudacao(nome: string | null): string {
  return nome ? `${SAUDACAO}, ${nome}` : SAUDACAO;
}
