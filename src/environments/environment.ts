/**
 * Configuração do ambiente. Por enquanto só o Supabase local (npx supabase start);
 * a chave abaixo é a chave pública padrão do ambiente local, não é segredo.
 * Ao publicar, troque por um arquivo de produção (fileReplacements no angular.json).
 */
export const environment = {
  supabaseUrl: 'http://127.0.0.1:54321',
  supabaseKey: 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH',
};
