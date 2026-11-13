/** A tiny round-robin pool of DOM nodes inside one layer – FX nodes are reused, never re-created. */
export class NodePool {
  private nodes: HTMLDivElement[] = [];
  private next = 0;

  constructor(
    private layer: HTMLElement,
    private className: string,
    private size: number,
  ) {}

  get(): HTMLDivElement {
    if (this.nodes.length < this.size) {
      const el = document.createElement('div');
      el.className = this.className;
      this.layer.appendChild(el);
      this.nodes.push(el);
      return el;
    }
    const el = this.nodes[this.next];
    this.next = (this.next + 1) % this.size;
    return el;
  }

  destroy() {
    for (const n of this.nodes) n.remove();
    this.nodes = [];
  }
}
