import { SUPPORTED_LANGUAGES, type SupportedLanguage } from "@crypto/shared";
import { createI18n } from "vue-i18n";
import { watch } from "vue";

const LOCALE_STORAGE_KEY = "cryptoboard-locale";

const messages = {
  es: {
    common: {
      email: "Correo",
      password: "Contraseña",
      name: "Nombre",
      loading: "Cargando...",
      backToLogin: "Volver al inicio de sesión",
      unexpectedError: "Error inesperado",
      switchToLight: "Cambiar a modo claro",
      switchToDark: "Cambiar a modo oscuro",
      close: "Cerrar",
    },
    auth: {
      loginTitle: "Iniciar sesión",
      loginSubtitle: "Usa tu correo y contraseña para acceder al panel.",
      loginAction: "Entrar",
      createAccount: "Crear cuenta",
      forgotPassword: "Olvidé mi contraseña",
      registerTitle: "Crear cuenta",
      registerSubtitle: "Crea tu cuenta para comenzar el flujo autenticado.",
      registerAction: "Registrar",
      forgotTitle: "Olvidé mi contraseña",
      forgotSubtitle: "Ingresa tu correo para recibir instrucciones.",
      forgotAction: "Enviar instrucciones",
      resetTitle: "Restablecer contraseña",
      resetSubtitle: "Ingresa el token y tu nueva contraseña.",
      resetAction: "Restablecer contraseña",
      tokenLabel: "Token",
    },
    nav: {
      appName: "CryptoBoard",
      toggleSidebar: "Alternar barra lateral",
      cryptos: "Criptomonedas",
      favorites: "Favoritos",
      profile: "Perfil",
      logout: "Salir",
    },
    crypto: {
      title: "Criptomonedas",
      searchPlaceholder: "Buscar por nombre o símbolo...",
      filterAll: "Todos",
      filterCoin: "Coin",
      filterToken: "Token",
      sortLabel: "Ordenar por",
      sortRank: "Ranking",
      sortPriceDesc: "Precio (mayor primero)",
      sortPriceAsc: "Precio (menor primero)",
      sortChangeDesc: "Variación 24h (mayor)",
      sortChangeAsc: "Variación 24h (menor)",
      sortNameAsc: "Nombre (A-Z)",
      sortNameDesc: "Nombre (Z-A)",
      perPage: "por página",
      rank: "Rank",
      price: "Precio",
      change1h: "1h",
      change24h: "24h",
      change7d: "7d",
      marketCap: "Cap. de mercado",
      volume: "Volumen 24h",
      supply: "Circulante",
      maxSupply: "Suministro máximo",
      description: "Descripción",
      noResults: "No se encontraron resultados.",
    },
    favorites: {
      title: "Favoritos",
      emptyTitle: "Sin favoritos",
      emptyDescription: "Agrega criptomonedas a tus favoritos para verlas aquí.",
      goToCryptos: "Ver criptomonedas",
      removed: "Eliminado de favoritos",
      addToFavorites: "Agregar a favoritos",
      removeFromFavorites: "Eliminar de favoritos",
    },
    profile: {
      title: "Perfil",
      name: "Nombre",
      email: "Correo",
      description: "Descripción",
      preferredCurrency: "Moneda preferida",
      avatar: "Avatar",
      uploadAvatar: "Subir avatar",
      saveProfile: "Guardar perfil",
      saving: "Guardando...",
      uploading: "Subiendo...",
      profileUpdated: "Perfil actualizado",
      avatarUpdated: "Avatar actualizado",
    },
    onboarding: {
      title: "Completa tu perfil",
      subtitle: "Antes de continuar, cuéntanos un poco más sobre ti.",
      avatarLabel: "Foto de perfil",
      avatarHint: "Puedes subir JPG, PNG, WEBP o GIF.",
      descriptionLabel: "Descripción",
      descriptionPlaceholder: "Escribe una breve descripción sobre ti.",
      currencyLabel: "Moneda preferida",
      submit: "Guardar y continuar",
      skip: "Omitir por ahora",
      saving: "Guardando...",
      completed: "Perfil completado",
    },
    pagination: {
      page: "Página",
      of: "de",
      total: "Total",
      first: "Primera",
      previous: "Anterior",
      next: "Siguiente",
      last: "Última",
      morePages: "Más páginas",
    },
    notFound: {
      title: "Página no encontrada",
      description: "La página que buscas no existe.",
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
      appName: "CryptoBoard",
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
      sortLabel: "Sort by",
      sortRank: "Rank",
      sortPriceDesc: "Price (high to low)",
      sortPriceAsc: "Price (low to high)",
      sortChangeDesc: "24h change (high)",
      sortChangeAsc: "24h change (low)",
      sortNameAsc: "Name (A-Z)",
      sortNameDesc: "Name (Z-A)",
      perPage: "per page",
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
    onboarding: {
      title: "Complete your profile",
      subtitle: "Before continuing, tell us a little more about you.",
      avatarLabel: "Profile photo",
      avatarHint: "You can upload JPG, PNG, WEBP, or GIF.",
      descriptionLabel: "Description",
      descriptionPlaceholder: "Write a short description about yourself.",
      currencyLabel: "Preferred currency",
      submit: "Save and continue",
      skip: "Skip for now",
      saving: "Saving...",
      completed: "Profile completed",
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
      email: "E-mail",
      password: "Senha",
      name: "Nome",
      loading: "Carregando...",
      backToLogin: "Voltar para o login",
      unexpectedError: "Erro inesperado",
      switchToLight: "Mudar para modo claro",
      switchToDark: "Mudar para modo escuro",
      close: "Fechar",
    },
    auth: {
      loginTitle: "Entrar",
      loginSubtitle: "Use seu e-mail e senha para acessar o dashboard.",
      loginAction: "Entrar",
      createAccount: "Criar nova conta",
      forgotPassword: "Esqueci minha senha",
      registerTitle: "Criar conta",
      registerSubtitle: "Cadastre um usuário para iniciar o fluxo autenticado.",
      registerAction: "Registrar",
      forgotTitle: "Esqueci minha senha",
      forgotSubtitle: "Informe seu e-mail para receber instruções.",
      forgotAction: "Enviar instruções",
      resetTitle: "Redefinir senha",
      resetSubtitle: "Informe o token recebido e a nova senha.",
      resetAction: "Redefinir senha",
      tokenLabel: "Token",
    },
    nav: {
      appName: "CryptoBoard",
      toggleSidebar: "Alternar barra lateral",
      cryptos: "Criptomoedas",
      favorites: "Favoritos",
      profile: "Perfil",
      logout: "Sair",
    },
    crypto: {
      title: "Criptomoedas",
      searchPlaceholder: "Buscar por nome ou símbolo...",
      filterAll: "Todos",
      filterCoin: "Coin",
      filterToken: "Token",
      sortLabel: "Ordenar por",
      sortRank: "Ranking",
      sortPriceDesc: "Preço (maior primeiro)",
      sortPriceAsc: "Preço (menor primeiro)",
      sortChangeDesc: "Variação 24h (maior)",
      sortChangeAsc: "Variação 24h (menor)",
      sortNameAsc: "Nome (A-Z)",
      sortNameDesc: "Nome (Z-A)",
      perPage: "por página",
      rank: "Rank",
      price: "Preço",
      change1h: "1h",
      change24h: "24h",
      change7d: "7d",
      marketCap: "Cap. de mercado",
      volume: "Volume 24h",
      supply: "Circulante",
      maxSupply: "Fornecimento máximo",
      description: "Descrição",
      noResults: "Nenhum resultado encontrado.",
    },
    favorites: {
      title: "Favoritos",
      emptyTitle: "Nenhum favorito",
      emptyDescription: "Adicione criptomoedas aos favoritos para vê-las aqui.",
      goToCryptos: "Ver criptomoedas",
      removed: "Removido dos favoritos",
      addToFavorites: "Adicionar aos favoritos",
      removeFromFavorites: "Remover dos favoritos",
    },
    profile: {
      title: "Perfil",
      name: "Nome",
      email: "E-mail",
      description: "Descrição",
      preferredCurrency: "Moeda preferida",
      avatar: "Avatar",
      uploadAvatar: "Enviar avatar",
      saveProfile: "Salvar perfil",
      saving: "Salvando...",
      uploading: "Enviando...",
      profileUpdated: "Perfil atualizado",
      avatarUpdated: "Avatar atualizado",
    },
    onboarding: {
      title: "Complete seu perfil",
      subtitle: "Antes de continuar, informe sua foto, moeda preferida e descrição.",
      avatarLabel: "Foto de perfil",
      avatarHint: "Você pode enviar JPG, PNG, WEBP ou GIF.",
      descriptionLabel: "Descrição",
      descriptionPlaceholder: "Escreva uma breve descrição sobre você.",
      currencyLabel: "Moeda preferida",
      submit: "Salvar e continuar",
      skip: "Pular por agora",
      saving: "Salvando...",
      completed: "Perfil concluído",
    },
    pagination: {
      page: "Página",
      of: "de",
      total: "Total",
      first: "Primeira",
      previous: "Anterior",
      next: "Próxima",
      last: "Última",
      morePages: "Mais páginas",
    },
    notFound: {
      title: "Página não encontrada",
      description: "A página que você procura não existe.",
      goHome: "Ir para o início",
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

  return "es";
}

export function getInitialLocale(): SupportedLanguage {
  if (typeof localStorage === "undefined") return "es";

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
  fallbackLocale: "es",
  messages,
});

if (typeof document !== "undefined") {
  document.documentElement.lang = i18n.global.locale.value;

  watch(i18n.global.locale, (newLocale) => {
    document.documentElement.lang = newLocale;
  });
}
