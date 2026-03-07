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

  protected html(strings: TemplateStringsArray, ...values: any[]): string {
    return strings.reduce((result, string, i) => {
      const value = values[i] ?? '';
      return result + string + value;
    }, '');
  }

  protected css(strings: TemplateStringsArray, ...values: any[]): string {
    return this.html(strings, ...values);
  }

  protected setHTML(html: string): void {
    this.shadow.innerHTML = html;
  }

  protected updateHTML(html: string): void {
    if (this._isConnected) {
      this.setHTML(html);
    }
  }

  // Keep querySelector methods public to maintain HTMLElement interface
  public querySelector<T extends Element>(selector: string): T | null {
    return this.shadow.querySelector<T>(selector);
  }

  public querySelectorAll<T extends Element>(selector: string): NodeListOf<T> {
    return this.shadow.querySelectorAll<T>(selector);
  }

  // Keep addEventListener public to maintain HTMLElement interface
  public addEventListener<K extends keyof HTMLElementEventMap>(
    type: K,
    listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions
  ): void;
  public addEventListener(
    type: string,
    listener: (this: HTMLElement, ev: Event) => any,
    options?: boolean | AddEventListenerOptions
  ): void;
  public addEventListener(
    type: string,
    listener: (this: HTMLElement, ev: any) => any,
    options?: boolean | AddEventListenerOptions
  ): void {
    super.addEventListener(type, listener, options);
  }

  protected emit<T = any>(eventName: string, detail?: T): void {
    this.dispatchEvent(new CustomEvent(eventName, { 
      detail, 
      bubbles: true, 
      composed: true 
    }));
  }
}