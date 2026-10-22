// Reloj (components/Reloj.astro): agujas + digital + la hora en palabras.
// La hora se guarda en minutos desde las 00:00 (0..1439).

import { estaHecho, marcarHecho, pintarSello, actualizarResumen } from './progreso';
import { hablar } from './hablar';

const UNO = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve',
  'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const DECENAS = ['', '', 'twenty', 'thirty', 'forty', 'fifty'];
const enIngles = (n: number) => (n < 20 ? UNO[n] : DECENAS[Math.floor(n / 10)] + (n % 10 ? '-' + UNO[n % 10] : ''));

const hora12 = (h: number) => (h % 12 === 0 ? 12 : h % 12);

/** "seven fifteen", "seven o'clock", "seven oh five" */
export function dichoDigital(t: number): string {
  const h = Math.floor(t / 60);
  const m = t % 60;
  const hs = enIngles(hora12(h));
  if (m === 0) return `It's ${hs} o'clock.`;
  return `It's ${hs} ${m < 10 ? 'oh ' + UNO[m] : enIngles(m)}.`;
}

/** "quarter past seven", "half past seven", "ten to eight" */
export function dichoClasico(t: number): string {
  const h = Math.floor(t / 60);
  const m = t % 60;
  const esta = enIngles(hora12(h));
  const sig = enIngles(hora12(h + 1));
  if (m === 0) return `It's ${esta} o'clock.`;
  if (m === 15) return `It's quarter past ${esta}.`;
  if (m === 30) return `It's half past ${esta}.`;
  if (m === 45) return `It's quarter to ${sig}.`;
  const min = (n: number) => enIngles(n) + (n % 5 === 0 ? '' : n === 1 ? ' minute' : ' minutes');
  return m < 30 ? `It's ${min(m)} past ${esta}.` : `It's ${min(60 - m)} to ${sig}.`;
}

export function parteDelDia(t: number): string {
  const h = Math.floor(t / 60);
  if (h >= 5 && h < 12) return 'in the morning';
  if (h >= 12 && h < 17) return 'in the afternoon';
  if (h >= 17 && h < 21) return 'in the evening';
  return 'at night';
}

const dosCifras = (n: number) => String(n).padStart(2, '0');
const normalizarT = (t: number) => ((t % 1440) + 1440) % 1440;
const azar = () => (5 + Math.floor(Math.random() * 18)) * 60 + Math.floor(Math.random() * 12) * 5;

const CLAVE_VISTAS = 'reloj:vistas';
function leerVistas(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_VISTAS) || '{}');
  } catch {
    return {};
  }
}

function initReloj(el: HTMLElement): void {
  const practica = el.classList.contains('reloj--practica');
  let t = 7 * 60 + 15;

  const hora = el.querySelector<SVGLineElement>('[data-aguja-hora]')!;
  const min = el.querySelector<SVGLineElement>('[data-aguja-min]')!;
  const digital = el.querySelector<HTMLElement>('[data-digital]')!;
  const parte = el.querySelector<HTMLElement>('[data-parte]')!;

  const pintar = () => {
    const h = Math.floor(t / 60);
    const m = t % 60;
    hora.setAttribute('transform', `rotate(${(h % 12) * 30 + m / 2} 100 100)`);
    min.setAttribute('transform', `rotate(${m * 6} 100 100)`);
    digital.textContent = `${dosCifras(h)}:${dosCifras(m)}`;
    parte.textContent = parteDelDia(t);
    const dd = el.querySelector('[data-dicho-digital]');
    const dc = el.querySelector('[data-dicho-clasico]');
    if (dd) dd.textContent = `${dichoDigital(t).replace(/\.$/, '')} ${parteDelDia(t)}.`;
    if (dc) dc.textContent = `${dichoClasico(t).replace(/\.$/, '')} ${parteDelDia(t)}.`;
  };

  // --- vistas (agujas / digital / palabras) ---
  const vistas = leerVistas();
  const checks = Array.from(el.querySelectorAll<HTMLInputElement>('[data-vista]'));
  const aplicarVistas = () => {
    const ver = (v: string) => checks.find((c) => c.dataset.vista === v)?.checked ?? false;
    el.querySelector<SVGElement>('.reloj__agujas')!.style.display = ver('agujas') ? '' : 'none';
    el.querySelector<HTMLElement>('.reloj__digital')!.hidden = !ver('digital');
    const pal = el.querySelector<HTMLElement>('[data-palabras]');
    if (pal) pal.hidden = !ver('palabras');
    el.querySelector<HTMLElement>('.reloj__apagado')!.hidden = ver('agujas') || ver('digital');
  };
  checks.forEach((c) => {
    if (typeof vistas[c.dataset.vista!] === 'boolean') c.checked = vistas[c.dataset.vista!];
    c.addEventListener('change', () => {
      vistas[c.dataset.vista!] = c.checked;
      try {
        localStorage.setItem(CLAVE_VISTAS, JSON.stringify(vistas));
      } catch {
        /* sin persistencia */
      }
      aplicarVistas();
    });
  });
  aplicarVistas();
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('reloj--listo')));

  if (!practica) {
    el.querySelectorAll<HTMLButtonElement>('[data-mover]').forEach((b) =>
      b.addEventListener('click', () => {
        t = normalizarT(t + Number(b.dataset.mover));
        pintar();
      }),
    );
    el.querySelector('[data-azar]')?.addEventListener('click', () => {
      t = azar();
      pintar();
    });
    el.querySelectorAll<HTMLButtonElement>('[data-hablar]').forEach((b) =>
      b.addEventListener('click', () =>
        hablar(el.querySelector(b.dataset.hablar === 'digital' ? '[data-dicho-digital]' : '[data-dicho-clasico]')?.textContent || ''),
      ),
    );
    pintar();
    return;
  }

  // --- práctica: elegir cómo se dice ---
  const titulo = el.dataset.titulo || '';
  const meta = Number(el.dataset.meta) || 5;
  const opcionesEl = el.querySelector<HTMLElement>('[data-opciones]')!;
  const salida = el.querySelector<HTMLElement>('[data-salida]')!;
  const racha = el.querySelector<HTMLElement>('[data-racha]')!;
  const rep = el.dataset.repasar ? (JSON.parse(el.dataset.repasar) as { texto: string; href: string }) : null;
  let aciertos = 0;
  let falloEsta = false;
  pintarSello(el, estaHecho(titulo));

  const sinParte = (s: string) => s.replace(/^It's /, '').replace(/\.$/, '');

  /** Distractores: los errores típicos (past/to al revés, la hora de al lado). */
  const distractores = (x: number): number[] => {
    const h = Math.floor(x / 60);
    const m = x % 60;
    const cand =
      m === 0
        ? [normalizarT(x + 60), normalizarT(x - 60), h * 60 + 30]
        : m === 30
          ? [normalizarT(x + 60), normalizarT(x - 60), normalizarT(h * 60 + 15)]
          : [
              // Mismo número de minutos pero con past/to al revés.
              m < 30 ? normalizarT((h - 1) * 60 + (60 - m)) : normalizarT((h + 1) * 60 + (60 - m)),
              normalizarT(x + 60),
              normalizarT(x - 60),
            ];
    return [...new Set(cand.map(normalizarT))].filter((c) => sinParte(dichoClasico(c)) !== sinParte(dichoClasico(x))).slice(0, 2);
  };

  const pista = (elegida: number): string => {
    const hE = Math.floor(elegida / 60) % 12;
    const hC = Math.floor(t / 60) % 12;
    const mE = elegida % 60;
    const mC = t % 60;
    if (mE !== mC && mE === 60 - mC)
      return 'Ojo con <b>past</b> y <b>to</b>: <i>past</i> = "y pico" (pasadas de esta hora); <i>to</i> = "menos" (para la hora que viene). ¿La aguja larga está a la derecha o a la izquierda?';
    if (mE === mC && hE !== hC)
      return 'Los minutos están bien. Mirá la <b>aguja corta</b>: ¿qué número acaba de pasar? (Si dice <i>to</i>, se nombra la hora que <b>viene</b>.)';
    return 'Mirá primero la <b>aguja larga</b> (los minutos) y después la corta (la hora).';
  };

  const nueva = () => {
    t = azar();
    falloEsta = false;
    pintar();
    const ops = [t, ...distractores(t)].sort(() => Math.random() - 0.5);
    opcionesEl.innerHTML = '';
    ops.forEach((o) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'quiz__opcion';
      b.lang = 'en';
      b.textContent = dichoClasico(o);
      b.addEventListener('click', () => elegir(o, b));
      opcionesEl.appendChild(b);
    });
    salida.hidden = true;
  };

  const elegir = (o: number, b: HTMLButtonElement) => {
    salida.hidden = false;
    if (o === t) {
      b.classList.add('quiz-ok');
      opcionesEl.querySelectorAll('button').forEach((x) => (x.disabled = true));
      if (!falloEsta) aciertos++;
      salida.className = 'ejercicio__salida is-ok';
      salida.innerHTML = `✅ ¡Sí! También se puede decir: <i lang="en">${dichoDigital(t)}</i>`;
      hablar(dichoClasico(t));
      if (aciertos >= meta && !estaHecho(titulo)) {
        marcarHecho(titulo);
        pintarSello(el, true);
      }
    } else {
      falloEsta = true;
      b.classList.add('quiz-mal');
      b.disabled = true;
      salida.className = 'ejercicio__salida is-error';
      salida.innerHTML = `🔎 ${pista(o)}` + (rep ? `<br><br>📖 Repasá: <a href="${rep.href}">${rep.texto}</a>` : '');
    }
    racha.textContent = `Acertadas al primer intento: ${aciertos}${aciertos >= meta ? ' 🎉' : ` / ${meta}`}`;
  };

  el.querySelector('[data-otra]')?.addEventListener('click', nueva);
  racha.textContent = `Acertadas al primer intento: 0 / ${meta}`;
  nueva();
}

function boot(): void {
  document.querySelectorAll<HTMLElement>('.reloj').forEach((el) => {
    if (el.dataset.init) return;
    el.dataset.init = '1';
    initReloj(el);
  });
  actualizarResumen();
}

if (document.readyState !== 'loading') boot();
else document.addEventListener('DOMContentLoaded', boot);
