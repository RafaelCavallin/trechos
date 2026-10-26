import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { SUPABASE } from './supabase';

const CADASTRO = { nome: '  Ana  ', email: 'ana@exemplo.com', senha: 'segredo1' };

function fakeSupabase() {
  return {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn(),
      signUp: vi.fn().mockResolvedValue({ data: { session: {} }, error: null }),
    },
  };
}

describe('AuthService.signUp', () => {
  let supabase: ReturnType<typeof fakeSupabase>;
  let auth: AuthService;

  beforeEach(() => {
    supabase = fakeSupabase();
    TestBed.configureTestingModule({ providers: [{ provide: SUPABASE, useValue: supabase }] });
    auth = TestBed.inject(AuthService);
  });

  it('grava o nome sem espaços nas pontas como display_name', async () => {
    await auth.signUp(CADASTRO);
    expect(supabase.auth.signUp).toHaveBeenCalledWith({
      email: 'ana@exemplo.com',
      password: 'segredo1',
      options: { data: { display_name: 'Ana' } },
    });
  });

  it('sem nome, avisa e não chama o Supabase', async () => {
    await expect(auth.signUp({ ...CADASTRO, nome: '   ' })).rejects.toThrow('Informe seu nome.');
    expect(supabase.auth.signUp).not.toHaveBeenCalled();
  });

  it('expõe o nome do usuário logado', () => {
    const [aoMudar] = supabase.auth.onAuthStateChange.mock.calls[0];
    aoMudar('SIGNED_IN', {
      user: { email: 'ana@exemplo.com', user_metadata: { display_name: 'Ana' } },
    });
    expect(auth.nome()).toBe('Ana');
  });
});
