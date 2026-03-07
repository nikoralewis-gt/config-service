/**
 * Base Web Component class providing common functionality
 */
export abstract class BaseComponent extends HTMLElement {
  protected shadow: ShadowRoot;
  protected _isConnected = false;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
  }

  connectedCallback(): void {
    this._isConnected = true;
    this.render();
  }

  disconnectedCallback(): void {
    this._isConnected = false;
  }

  protected abstract render(): void;

  /**
   * Template literal tag for HTML strings
   */
  protected html(strings: TemplateStringsArray, ...values: any[]): string {
    return strings.reduce((result, string, i) => {
      const value = values[i] ?? '';
      // Escape HTML to prevent XSS
      const escapedValue = typeof value === 'string' 
        ? this.escapeHtml(value)
        : value;
      return result + string + escapedValue;
    }, '');
  }

  /**
   * Template literal tag for CSS strings
   */
  protected css(strings: TemplateStringsArray, ...values: any[]): string {
    return strings.reduce((result, string, i) => {
      const value = values[i] ?? '';
      return result + string + value;
    }, '');
  }

  /**
   * Set the shadow DOM HTML content
   */
  protected setHTML(html: string): void {
    this.shadow.innerHTML = html;
  }

  /**
   * Update shadow DOM HTML if component is connected
   */
  protected updateHTML(html: string): void {
    if (this._isConnected) {
      this.setHTML(html);
    }
  }

  /**
   * Escape HTML to prevent XSS attacks
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Query selector within shadow DOM
   */
  public querySelector<T extends Element>(selector: string): T | null {
    return this.shadow.querySelector<T>(selector);
  }

  /**
   * Query selector all within shadow DOM
   */
  public querySelectorAll<T extends Element>(selector: string): NodeListOf<T> {
    return this.shadow.querySelectorAll<T>(selector);
  }

  /**
   * Emit a custom event
   */
  protected emit<T = any>(eventName: string, detail?: T): void {
    this.dispatchEvent(new CustomEvent(eventName, { 
      detail, 
      bubbles: true, 
      composed: true 
    }));
  }

  /**
   * Get attribute as string
   */
  protected getAttr(name: string): string | null {
    return this.getAttribute(name);
  }

  /**
   * Set attribute
   */
  protected setAttr(name: string, value: string): void {
    this.setAttribute(name, value);
  }
}
