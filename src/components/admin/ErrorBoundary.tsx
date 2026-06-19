import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  /** Rendu de repli si les enfants plantent. Par défaut : rien (null). */
  fallback?: ReactNode;
  /** Libellé pour identifier la zone dans les logs console. */
  label?: string;
}

interface State {
  hasError: boolean;
}

/**
 * Error boundary générique : isole une sous-partie de l'UI. Si ses enfants
 * lèvent une erreur au rendu, on affiche `fallback` (rien par défaut) au lieu
 * de faire planter toute la page parente. Utile pour qu'une carte secondaire
 * (ex. « Messages » sur la fiche lead) ne casse jamais l'écran entier.
 */
class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Non bloquant : on trace pour le debug, on n'interrompt pas l'utilisateur.
    console.error(
      `[ErrorBoundary${this.props.label ? ` ${this.props.label}` : ""}]`,
      error,
      info.componentStack,
    );
  }

  render() {
    if (this.state.hasError) return this.props.fallback ?? null;
    return this.props.children;
  }
}

export default ErrorBoundary;
