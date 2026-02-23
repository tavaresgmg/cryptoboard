import { SUPPORTED_LANGUAGES, type SupportedLanguage } from "@crypto/shared";
import { createI18n } from "vue-i18n";

const LOCALE_STORAGE_KEY = "crypto-dashboard-locale";

const messages = {
  es: {
    common: {
      email: "Correo",
      password: "Contrasena",
      loading: "Cargando..."
    },
    auth: {
      loginTitle: "Iniciar sesion",
      loginSubtitle: "Usa tu correo y contrasena para acceder al panel.",
      loginAction: "Entrar",
      createAccount: "Crear cuenta",
      forgotPassword: "Olvide mi contrasena",
      registerTitle: "Crear cuenta",
      registerSubtitle: "Registra un usuario para iniciar el flujo autenticado.",
      registerAction: "Registrar",
      forgotTitle: "Olvide mi contrasena",
      forgotSubtitle: "Ingresa tu correo para recibir instrucciones.",
      forgotAction: "Enviar instrucciones",
      resetTitle: "Restablecer contrasena",
      resetSubtitle: "Ingresa el token y tu nueva contrasena.",
      resetAction: "Restablecer contrasena"
    },
    dashboard: {
      title: "Panel",
      signOut: "Salir"
    }
  },
  en: {
    common: {
      email: "Email",
      password: "Password",
      loading: "Loading..."
    },
    auth: {
      loginTitle: "Sign in",
      loginSubtitle: "Use your email and password to access the dashboard.",
      loginAction: "Sign in",
      createAccount: "Create account",
      forgotPassword: "Forgot my password",
      registerTitle: "Create account",
      registerSubtitle: "Register a user to start the authenticated flow.",
      registerAction: "Register",
      forgotTitle: "Forgot my password",
      forgotSubtitle: "Enter your email to receive instructions.",
      forgotAction: "Send instructions",
      resetTitle: "Reset password",
      resetSubtitle: "Enter the token and your new password.",
      resetAction: "Reset password"
    },
    dashboard: {
      title: "Dashboard",
      signOut: "Sign out"
    }
  },
  "pt-BR": {
    common: {
      email: "Email",
      password: "Senha",
      loading: "Carregando..."
    },
    auth: {
      loginTitle: "Entrar",
      loginSubtitle: "Use seu email e senha para acessar o dashboard.",
      loginAction: "Entrar",
      createAccount: "Criar nova conta",
      forgotPassword: "Esqueci minha senha",
      registerTitle: "Criar conta",
      registerSubtitle: "Cadastre um usuario para iniciar o fluxo autenticado.",
      registerAction: "Registrar",
      forgotTitle: "Esqueci minha senha",
      forgotSubtitle: "Informe seu email para receber instrucoes.",
      forgotAction: "Enviar instrucoes",
      resetTitle: "Redefinir senha",
      resetSubtitle: "Informe o token recebido e a nova senha.",
      resetAction: "Redefinir senha"
    },
    dashboard: {
      title: "Dashboard",
      signOut: "Sair"
    }
  }
} as const;

function normalizeLocale(locale: string): SupportedLanguage {
  if (SUPPORTED_LANGUAGES.includes(locale as SupportedLanguage)) {
    return locale as SupportedLanguage;
  }

  if (locale.startsWith("pt")) {
    return "pt-BR";
  }

  if (locale.startsWith("es")) {
    return "es";
  }

  return "en";
}

export function getInitialLocale(): SupportedLanguage {
  const storedLocale = localStorage.getItem(LOCALE_STORAGE_KEY);
  if (storedLocale) {
    return normalizeLocale(storedLocale);
  }

  return "es";
}

export function persistLocale(locale: SupportedLanguage): void {
  localStorage.setItem(LOCALE_STORAGE_KEY, locale);
}

export const i18n = createI18n({
  legacy: false,
  locale: getInitialLocale(),
  fallbackLocale: "en",
  messages
});
