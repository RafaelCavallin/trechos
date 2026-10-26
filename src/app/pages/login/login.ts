import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';

/** Entrar ou criar conta com e-mail e senha. */
@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly modo = signal<'entrar' | 'criar'>('entrar');
  protected readonly nome = signal('');
  protected readonly email = signal('');
  protected readonly senha = signal('');
  protected readonly erro = signal<string | null>(null);
  protected readonly enviando = signal(false);

  protected alternarModo(): void {
    this.modo.update((m) => (m === 'entrar' ? 'criar' : 'entrar'));
    this.erro.set(null);
  }

  protected async enviar(): Promise<void> {
    if (this.enviando()) return;
    this.enviando.set(true);
    this.erro.set(null);
    try {
      await this.autenticar(this.email().trim());
      await this.router.navigateByUrl('/');
    } catch (e) {
      this.erro.set(e instanceof Error ? e.message : 'Não foi possível entrar agora.');
    } finally {
      this.enviando.set(false);
    }
  }

  private async autenticar(email: string): Promise<void> {
    if (this.modo() === 'entrar') return this.auth.signIn(email, this.senha());
    return this.auth.signUp({ nome: this.nome(), email, senha: this.senha() });
  }
}
