// Leer en voz alta con la voz del navegador (Web Speech API). Gratis, sin
// archivos de audio y anda sin conexión una vez cargada la página.
//
// El libro es británico, así que se prefiere una voz en-GB; si no hay, cualquier
// voz en inglés. Si el navegador no tiene ninguna, los botones 🔊 se esconden
// (clase `sin-voz` en <html>) en vez de quedar ahí sin hacer nada.

let voz: SpeechSynthesisVoice | null = null;

function elegirVoz(): void {
  if (!('speechSynthesis' in window)) return;
  const voces = speechSynthesis.getVoices();
  voz =
    voces.find((v) => v.lang === 'en-GB' && /natural|online|google/i.test(v.name)) ||
    voces.find((v) => v.lang === 'en-GB') ||
    voces.find((v) => v.lang === 'en-US') ||
    voces.find((v) => v.lang.startsWith('en')) ||
    null;
  // Algunas voces llegan tarde (Chrome las carga en segundo plano): si todavía
  // no hay ninguna no escondemos nada, puede aparecer en un rato.
  if (voces.length && !voz) document.documentElement.classList.add('sin-voz');
}

export function puedeHablar(): boolean {
  return 'speechSynthesis' in window;
}

// Cada clic alterna entre velocidad normal y lenta: la segunda vez que alguien
// toca el mismo botón casi siempre es porque no le entendió.
let ultimo = '';
let lento = false;

export function hablar(texto: string): void {
  if (!puedeHablar() || !texto.trim()) return;
  if (!voz) elegirVoz();
  lento = texto === ultimo ? !lento : false;
  ultimo = texto;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(texto);
  u.lang = voz?.lang || 'en-GB';
  if (voz) u.voice = voz;
  u.rate = lento ? 0.6 : 0.9;
  speechSynthesis.speak(u);
}

/** El texto de un elemento sin los botones que tenga adentro. */
export function textoSinBotones(el: Element): string {
  const copia = el.cloneNode(true) as Element;
  copia.querySelectorAll('button, .no-leer').forEach((b) => b.remove());
  return (copia.textContent || '').replace(/\s+/g, ' ').trim();
}

function boot(): void {
  if (!puedeHablar()) {
    document.documentElement.classList.add('sin-voz');
    return;
  }
  elegirVoz();
  speechSynthesis.addEventListener?.('voiceschanged', elegirVoz);
}

// Un solo listener para toda la página: cualquier botón con [data-say] habla.
// Si data-say viene vacío, lee el texto del contenedor más cercano marcado con
// [data-say-scope] (sin los botones).
if (!(window as unknown as { __hablar?: boolean }).__hablar) {
  (window as unknown as { __hablar?: boolean }).__hablar = true;
  document.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-say]');
    if (!btn) return;
    const scope = btn.closest('[data-say-scope]');
    const texto = btn.dataset.say || (scope ? textoSinBotones(scope) : '');
    hablar(texto);
  });
  if (document.readyState !== 'loading') boot();
  else document.addEventListener('DOMContentLoaded', boot);
}
