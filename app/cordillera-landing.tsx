import type { MouseEvent, ReactNode } from "react";
import Image from "next/image";
import styles from "./landing-previews/landing-previews.module.css";

const requestDetails = ["Productos y cantidades", "Archivos técnicos", "Rubros convocados", "Fecha límite"];
const quoteDetails = ["Precio por ítem", "Moneda e impuestos", "Entrega y pago", "PDF comercial"];

type CordilleraLandingProps = {
  onLogin: () => void;
  onRegister: () => void;
  supplementaryContent?: ReactNode;
};

function Brand({ light = false }: { light?: boolean }) {
  return (
    <span className={styles.brand}>
      <Image src="/miconect-symbol.png" width={34} height={34} style={{ width: 34, height: 34 }} alt="" />
      <Image
        src={light ? "/miconect-wordmark-white.png" : "/miconect-wordmark.png"}
        width={132}
        height={31}
        style={{ width: 132, height: 31 }}
        alt="Miconect"
      />
    </span>
  );
}

export default function CordilleraLanding({ onLogin, onRegister, supplementaryContent }: CordilleraLandingProps) {
  const openLogin = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    onLogin();
  };
  const openRegister = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    onRegister();
  };

  return (
    <div className={`${styles.preview} ${styles.cordillera}`}>
      <header className={styles.cordilleraNav}>
        <Brand />
        <nav aria-label="Navegación principal">
          <a href="#red">La red</a>
          <a href="#operacion">Cómo opera</a>
          <a href="#confianza">Confianza</a>
        </nav>
        <div><a href="#ingresar" onClick={openLogin}>Ingresar</a><a className={styles.cordilleraButton} href="#registro" onClick={openRegister}>Sumar mi empresa <span>↗</span></a></div>
      </header>

      <main>
        <section className={styles.cordilleraHero} id="red">
          <div className={styles.cordilleraCopy}>
            <div className={styles.cordilleraKicker}><span>31°32′S · 68°31′O</span><span>RED B2B · SAN JUAN</span></div>
            <h1>La minería<br />avanza cuando<br /><em>lo local conecta.</em></h1>
            <p>La red donde una necesidad minera se convierte en una oportunidad concreta para empresas verificadas de San Juan.</p>
            <div className={styles.cordilleraActions}>
              <a href="#registro" onClick={openRegister}>Conectar mi empresa <span>↗</span></a>
              <a href="#operacion">Explorar una operación <b>↓</b></a>
            </div>
          </div>
          <div className={styles.terrainStage} aria-label="Ruta de una operación minera en Miconect">
            <span className={styles.terrainNorth}>N</span>
            <span className={styles.terrainAltitude}>ALT. 2.430 M</span>
            <svg className={styles.contourMap} viewBox="0 0 720 720" aria-hidden="true">
              <path d="M-40 120C90 12 177 54 278 138s203 81 306 1 173-35 210 28" /><path d="M-52 176C67 71 170 95 258 170s210 97 322 19 174-40 224 5" /><path d="M-60 239C60 129 177 151 268 224s207 96 323 20 174-32 225 22" /><path d="M-38 314C76 204 177 222 268 288s215 91 329 22 168-18 212 35" /><path d="M-29 390C88 284 191 292 282 352s208 84 318 29 156-7 210 52" /><path d="M-16 466C102 372 205 366 295 417s203 80 309 42 147 7 195 67" /><path d="M3 548C116 465 220 451 310 492s193 71 296 50 137 25 180 84" />
            </svg>
            <div className={styles.terrainSun} />
            <div className={styles.operationRoute}><i /><i /><i /></div>
            <article className={`${styles.terrainStop} ${styles.stopRequest}`}><small>01 · DEMANDA</small><b>Solicitud publicada</b><span>SJ—0248 · EPP</span></article>
            <article className={`${styles.terrainStop} ${styles.stopQuote}`}><small>02 · OFERTA</small><b>8 proveedores</b><span>Cotización protegida</span></article>
            <article className={`${styles.terrainStop} ${styles.stopAward}`}><small>03 · DECISIÓN</small><b>Adjudicación</b><span>Registro trazable</span></article>
            <div className={styles.liveOperation}><span><i /> OPERACIÓN EN CURSO</span><b>18:42:16</b></div>
          </div>
        </section>

        <section className={styles.cordilleraProof} aria-label="Principios de la red">
          <span><b>01</b><strong>Empresas verificadas</strong><small>Identidad y documentación revisadas</small></span>
          <span><b>02</b><strong>Ofertas protegidas</strong><small>Precios visibles sólo donde corresponde</small></span>
          <span><b>03</b><strong>Decisiones trazables</strong><small>Historial completo de cada operación</small></span>
        </section>

        {supplementaryContent}

        <section className={styles.cordilleraManifesto}>
          <span>CAPACIDAD PRODUCTIVA · MÁS CERCA</span><h2>No es otro directorio de empresas.</h2><p>Es infraestructura comercial para que compras encuentre respuestas comparables y ventas acceda a demanda real.</p>
        </section>

        <section className={styles.cordilleraRoles}>
          <div className={styles.cordilleraSectionTitle}><span>DOS LADOS · UNA MISMA RED</span><h2>Una necesidad.<br />La empresa indicada.</h2></div>
          <article><span className={styles.roleIndex}>01</span><small>SI TU EMPRESA COMPRA</small><h3>Pedí con precisión. Decidí con contexto.</h3><p>Publicá una necesidad estructurada, convocá los rubros correctos y compará propuestas bajo las mismas condiciones.</p><ul>{["Pedido estructurado", "Comparación de propuestas", "Adjudicación total o parcial", "Historial y notificaciones"].map(item => <li key={item}>{item}</li>)}</ul><a href="#operacion">Ver flujo comprador <span>→</span></a></article>
          <article className={styles.providerRole}><span className={styles.roleIndex}>02</span><small>SI TU EMPRESA VENDE</small><h3>Cotizá demanda real. Crecé más cerca.</h3><p>Recibí oportunidades según tus rubros y presentá precios, condiciones y respaldo comercial sin exponer tu oferta.</p><ul>{["Oportunidades por categoría", "Cotización por ítem", "Condiciones comerciales", "Seguimiento de adjudicaciones"].map(item => <li key={item}>{item}</li>)}</ul><a href="#operacion">Ver flujo proveedor <span>→</span></a></article>
        </section>

        <section className={styles.cordilleraFlow} id="operacion">
          <header><div><span>UNA OPERACIÓN · DE PUNTA A PUNTA</span><p>Cada etapa conserva el contexto que necesita la siguiente.</p></div><h2>De la necesidad<br />a la adjudicación.</h2></header>
          <div className={styles.flowTrack}>
            <article><b>PUBLICAR</b><h3>01</h3><p>Compras define qué necesita, cómo debe entregarse y hasta cuándo recibe propuestas.</p><div>{requestDetails.map(item => <span key={item}>{item}</span>)}</div></article>
            <article><b>COTIZAR</b><h3>02</h3><p>Los proveedores del rubro reciben el pedido y presentan una oferta comercial completa.</p><div>{quoteDetails.map(item => <span key={item}>{item}</span>)}</div></article>
            <article><b>ADJUDICAR</b><h3>03</h3><p>Compras abre, compara y registra su decisión total o por cada renglón.</p><div>{["Por pedido o ítem", "Cantidades adjudicadas", "Avisos automáticos", "Registro histórico"].map(item => <span key={item}>{item}</span>)}</div></article>
          </div>
          <div className={styles.flowFoot}><span>PUBLICACIÓN</span><i /><span>APERTURA CONTROLADA</span><i /><span>DECISIÓN REGISTRADA</span></div>
        </section>

        <section className={styles.cordilleraTrust} id="confianza">
          <div><span>CONFIANZA OPERATIVA</span><h2>Reglas claras para información sensible.</h2><p>La plataforma ordena quién accede, qué puede ver y cuándo puede hacerlo.</p></div>
          <div className={styles.trustGrid}>
            <article><span>VERIFICACIÓN</span><b>Empresas reales</b><p>CUIT y documentación se revisan antes de habilitar la operación.</p></article><article><span>PRIVACIDAD</span><b>Ofertas protegidas</b><p>Precios y archivos quedan limitados a las partes y al momento definido.</p></article><article><span>CONTROL</span><b>Equipos con roles</b><p>Cada persona usa su acceso y las acciones relevantes quedan identificadas.</p></article><article><span>TRAZABILIDAD</span><b>Historia completa</b><p>Solicitudes, ofertas, comunicaciones y decisiones permanecen registradas.</p></article>
          </div>
        </section>

        <section className={styles.cordilleraCta} id="registro">
          <div className={styles.ctaContour} aria-hidden="true" /><span>LA PRÓXIMA CONEXIÓN EMPIEZA ACÁ</span><h2>Tu empresa puede mover<br />la próxima operación.</h2><p>Registrala como compradora, proveedora o ambas. El equipo de Miconect revisará la información para activar su acceso.</p><a href="#registro" onClick={openRegister}>Sumar mi empresa <b>↗</b></a>
        </section>
      </main>
      <footer className={styles.cordilleraFooter}><Brand light /><p>Infraestructura comercial para la minería de San Juan.</p><span>Operada por MINPA S.A.S. · info@miconect.com</span></footer>
    </div>
  );
}
