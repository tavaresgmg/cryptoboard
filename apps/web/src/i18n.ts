import { SUPPORTED_LANGUAGES, type SupportedLanguage } from "@crypto/shared";
import { createI18n } from "vue-i18n";
import { watch } from "vue";

const LOCALE_STORAGE_KEY = "crypto-dashboard-locale";

const messages = {
  es: {
    common: {
      email: "Correo",
      password: "Contrasena",
      name: "Nombre",
      loading: "Cargando...",
      backToLogin: "Volver al login",
      unexpectedError: "Error inesperado",
      switchToLight: "Cambiar a modo claro",
      switchToDark: "Cambiar a modo oscuro",
      close: "Cerrar",
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
      resetAction: "Restablecer contrasena",
      tokenLabel: "Token",
    },
    nav: {
      appName: "Crypto Dashboard",
      toggleSidebar: "Alternar barra lateral",
      cryptos: "Criptomonedas",
      favorites: "Favoritos",
      profile: "Perfil",
      logout: "Salir",
    },
    crypto: {
      title: "Criptomonedas",
      searchPlaceholder: "Buscar por nombre o simbolo...",
      filterAll: "Todos",
      filterCoin: "Coin",
      filterToken: "Token",
      rank: "Rank",
      price: "Precio",
      change1h: "1h",
      change24h: "24h",
      change7d: "7d",
      marketCap: "Cap. de mercado",
      volume: "Volumen 24h",
      supply: "Circulante",
      maxSupply: "Suministro maximo",
      description: "Descripcion",
      noResults: "No se encontraron resultados.",
    },
    favorites: {
      title: "Favoritos",
      emptyTitle: "Sin favoritos",
      emptyDescription: "Agrega criptomonedas a tus favoritos para verlas aqui.",
      goToCryptos: "Ver criptomonedas",
      removed: "Eliminado de favoritos",
      addToFavorites: "Agregar a favoritos",
      removeFromFavorites: "Eliminar de favoritos",
    },
    profile: {
      title: "Perfil",
      name: "Nombre",
      email: "Correo",
      description: "Descripcion",
      preferredCurrency: "Moneda preferida",
      avatar: "Avatar",
      uploadAvatar: "Subir avatar",
      saveProfile: "Guardar perfil",
      saving: "Guardando...",
      uploading: "Subiendo...",
      profileUpdated: "Perfil actualizado",
      avatarUpdated: "Avatar actualizado",
    },
    pagination: {
      page: "Pagina",
      of: "de",
      total: "Total",
      first: "Primera",
      previous: "Anterior",
      next: "Siguiente",
      last: "Ultima",
      morePages: "Mas paginas",
    },
    notFound: {
      title: "Pagina no encontrada",
      description: "La pagina que buscas no existe.",
      goHome: "Ir al inicio",
    },
  },
  en: {
    common: {
      email: "Email",
      password: "Password",
      name: "Name",
      loading: "Loading...",
      backToLogin: "Back to login",
      unexpectedError: "Unexpected error",
      switchToLight: "Switch to light mode",
      switchToDark: "Switch to dark mode",
      close: "Close",
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
      resetAction: "Reset password",
      tokenLabel: "Token",
    },
    nav: {
      appName: "Crypto Dashboard",
      toggleSidebar: "Toggle Sidebar",
      cryptos: "Cryptos",
      favorites: "Favorites",
      profile: "Profile",
      logout: "Sign out",
    },
    crypto: {
      title: "Cryptocurrencies",
      searchPlaceholder: "Search by name or symbol...",
      filterAll: "All",
      filterCoin: "Coin",
      filterToken: "Token",
      rank: "Rank",
      price: "Price",
      change1h: "1h",
      change24h: "24h",
      change7d: "7d",
      marketCap: "Market Cap",
      volume: "Volume 24h",
      supply: "Circulating",
      maxSupply: "Max Supply",
      description: "Description",
      noResults: "No results found.",
    },
    favorites: {
      title: "Favorites",
      emptyTitle: "No favorites yet",
      emptyDescription: "Add cryptocurrencies to your favorites to see them here.",
      goToCryptos: "Browse cryptos",
      removed: "Removed from favorites",
      addToFavorites: "Add to favorites",
      removeFromFavorites: "Remove from favorites",
    },
    profile: {
      title: "Profile",
      name: "Name",
      email: "Email",
      description: "Description",
      preferredCurrency: "Preferred currency",
      avatar: "Avatar",
      uploadAvatar: "Upload avatar",
      saveProfile: "Save profile",
      saving: "Saving...",
      uploading: "Uploading...",
      profileUpdated: "Profile updated",
      avatarUpdated: "Avatar updated",
    },
    pagination: {
      page: "Page",
      of: "of",
      total: "Total",
      first: "First",
      previous: "Previous",
      next: "Next",
      last: "Last",
      morePages: "More pages",
    },
    notFound: {
      title: "Page not found",
      description: "The page you are looking for does not exist.",
      goHome: "Go home",
    },
  },
  "pt-BR": {
    common: {
      email: "Email",
      password: "Senha",
      name: "Nome",
      loading: "Carregando...",
      backToLogin: "Voltar para login",
      unexpectedError: "Erro inesperado",
      switchToLight: "Mudar para modo claro",
      switchToDark: "Mudar para modo escuro",
      close: "Fechar",
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
      resetAction: "Redefinir senha",
      tokenLabel: "Token",
    },
    nav: {
      appName: "Crypto Dashboard",
      toggleSidebar: "Alternar barra lateral",
      cryptos: "Criptomoedas",
      favorites: "Favoritos",
      profile: "Perfil",
      logout: "Sair",
    },
    crypto: {
      title: "Criptomoedas",
      searchPlaceholder: "Buscar por nome ou simbolo...",
      filterAll: "Todos",
      filterCoin: "Coin",
      filterToken: "Token",
      rank: "Rank",
      price: "Preco",
      change1h: "1h",
      change24h: "24h",
      change7d: "7d",
      marketCap: "Cap. de mercado",
      volume: "Volume 24h",
      supply: "Circulante",
      maxSupply: "Fornecimento maximo",
      description: "Descricao",
      noResults: "Nenhum resultado encontrado.",
    },
    favorites: {
      title: "Favoritos",
      emptyTitle: "Nenhum favorito",
      emptyDescription: "Adicione criptomoedas aos favoritos para ve-las aqui.",
      goToCryptos: "Ver criptomoedas",
      removed: "Removido dos favoritos",
      addToFavorites: "Adicionar aos favoritos",
      removeFromFavorites: "Remover dos favoritos",
    },
    profile: {
      title: "Perfil",
      name: "Nome",
      email: "Email",
      description: "Descricao",
      preferredCurrency: "Moeda preferida",
      avatar: "Avatar",
      uploadAvatar: "Enviar avatar",
      saveProfile: "Salvar perfil",
      saving: "Salvando...",
      uploading: "Enviando...",
      profileUpdated: "Perfil atualizado",
      avatarUpdated: "Avatar atualizado",
    },
    pagination: {
      page: "Pagina",
      of: "de",
      total: "Total",
      first: "Primeira",
      previous: "Anterior",
      next: "Proxima",
      last: "Ultima",
      morePages: "Mais paginas",
    },
    notFound: {
      title: "Pagina nao encontrada",
      description: "A pagina que voce procura nao existe.",
      goHome: "Ir para inicio",
    },
  },
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
  if (typeof localStorage === "undefined") return "en";
  const storedLocale = localStorage.getItem(LOCALE_STORAGE_KEY);
  if (storedLocale) {
    return normalizeLocale(storedLocale);
  }

  if (typeof navigator !== "undefined" && navigator.language) {
    return normalizeLocale(navigator.language);
  }

  return "en";
}

export function persistLocale(locale: SupportedLanguage): void {
  localStorage.setItem(LOCALE_STORAGE_KEY, locale);
}

export const i18n = createI18n({
  legacy: false,
  locale: getInitialLocale(),
  fallbackLocale: "en",
  messages,
});

if (typeof document !== "undefined") {
  document.documentElement.lang = i18n.global.locale.value;

  watch(i18n.global.locale, (newLocale) => {
    document.documentElement.lang = newLocale;
  });
}
