import { Injectable, computed, inject, signal } from '@angular/core';
import { Session } from '@supabase/supabase-js';
import { SUPABASE } from './supabase';

/** Sessão do usuário (login por e-mail e senha no Supabase). */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly supabase = inject(SUPABASE);
  private readonly _session = signal<Session | null>(null);

  readonly session = this._session.asReadonly();
  readonly user = computed(() => this._session()?.user ?? null);

  /** Resolve quando a sessão salva no navegador já foi lida. */
  readonly ready: Promise<void>;

  constructor() {
    this.ready = this.supabase.auth.getSession().then(({ data }) => {
      this._session.set(data.session);
    });
    this.supabase.auth.onAuthStateChange((_evento, session) => this._session.set(session));
  }

  async signIn(email: string, senha: string): Promise<void> {
    const { error } = await this.supabase.auth.signInWithPassword({ email, password: senha });
    if (error) throw new Error(mensagemDeErro(error.message));
  }

  async signUp(email: string, senha: string): Promise<void> {
    const { data, error } = await this.supabase.auth.signUp({ email, password: senha });
    if (error) throw new Error(mensagemDeErro(error.message));
    if (!data.session) throw new Error('Conta criada. Confirme o e-mail para entrar.');
  }

  async signOut(): Promise<void> {
    await this.supabase.auth.signOut();
  }
}

function mensagemDeErro(original: string): string {
  if (/invalid login credentials/i.test(original)) return 'E-mail ou senha incorretos.';
  if (/already registered/i.test(original)) return 'Já existe uma conta com este e-mail.';
  if (/password should be at least/i.test(original))
    return 'A senha precisa ter pelo menos 6 caracteres.';
  if (/valid email|invalid format/i.test(original)) return 'Informe um e-mail válido.';
  return 'Não foi possível entrar agora. Tente de novo.';
}
