"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import styles from "./landing-previews.module.css";

const versions = [
  { id: 0, name: "Cordillera activa", note: "Topográfica y editorial" },
  { id: 1, name: "Sala de control", note: "Operativa y tecnológica" },
  { id: 2, name: "Red San Juan", note: "Enérgica y comunitaria" },
];

const requestDetails = ["Productos y cantidades", "Archivos técnicos", "Rubros convocados", "Fecha límite"];
const quoteDetails = ["Precio por ítem", "Moneda e impuestos", "Entrega y pago", "PDF comercial"];

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

function PreviewSwitcher({ active, onChange }: { active: number; onChange: (version: number) => void }) {
  return (
    <aside className={styles.switcher} aria-label="Versiones de la landing">
      <div>
        <span>PREVIEWS</span>
        <b>Elegí una dirección</b>
      </div>
      <nav>
        {versions.map((version, index) => (
          <button
            key={version.name}
            className={active === index ? styles.switcherActive : ""}
            onClick={() => onChange(index)}
            aria-pressed={active === index}
          >
            <i>0{index + 1}</i>
            <span>{version.name}<small>{version.note}</small></span>
          </button>
        ))}
      </nav>
      <Link href="/">Volver a la landing actual</Link>
    </aside>
  );
}

function CordilleraLanding() {
  return (
    <div className={`${styles.preview} ${styles.cordillera}`}>
      <header className={styles.cordilleraNav}>
        <Brand />
        <nav aria-label="Navegación principal">
          <a href="#red-c1">La red</a>
          <a href="#operacion-c1">Cómo opera</a>
          <a href="#confianza-c1">Confianza</a>
        </nav>
        <div><Link href="/">Ingresar</Link><a className={styles.cordilleraButton} href="#registro-c1">Sumar mi empresa <span>↗</span></a></div>
      </header>

      <main>
        <section className={styles.cordilleraHero} id="red-c1">
          <div className={styles.cordilleraCopy}>
            <div className={styles.cordilleraKicker}><span>31°32′S · 68°31′O</span><span>RED B2B · SAN JUAN</span></div>
            <h1>La minería<br />avanza cuando<br /><em>lo local conecta.</em></h1>
            <p>La red donde una necesidad minera se convierte en una oportunidad concreta para empresas verificadas de San Juan.</p>
            <div className={styles.cordilleraActions}>
              <a href="#registro-c1">Conectar mi empresa <span>↗</span></a>
              <a href="#operacion-c1">Explorar una operación <b>↓</b></a>
            </div>
          </div>
          <div className={styles.terrainStage} aria-label="Ruta de una operación minera en Miconect">
            <span className={styles.terrainNorth}>N</span>
            <span className={styles.terrainAltitude}>ALT. 2.430 M</span>
            <svg className={styles.contourMap} viewBox="0 0 720 720" aria-hidden="true">
              <path d="M-40 120C90 12 177 54 278 138s203 81 306 1 173-35 210 28" />
              <path d="M-52 176C67 71 170 95 258 170s210 97 322 19 174-40 224 5" />
              <path d="M-60 239C60 129 177 151 268 224s207 96 323 20 174-32 225 22" />
              <path d="M-38 314C76 204 177 222 268 288s215 91 329 22 168-18 212 35" />
              <path d="M-29 390C88 284 191 292 282 352s208 84 318 29 156-7 210 52" />
              <path d="M-16 466C102 372 205 366 295 417s203 80 309 42 147 7 195 67" />
              <path d="M3 548C116 465 220 451 310 492s193 71 296 50 137 25 180 84" />
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

        <section className={styles.cordilleraManifesto}>
          <span>CAPACIDAD PRODUCTIVA · MÁS CERCA</span>
          <h2>No es otro directorio de empresas.</h2>
          <p>Es infraestructura comercial para que compras encuentre respuestas comparables y ventas acceda a demanda real.</p>
        </section>

        <section className={styles.cordilleraRoles}>
          <div className={styles.cordilleraSectionTitle}>
            <span>DOS LADOS · UNA MISMA RED</span>
            <h2>Una necesidad.<br />La empresa indicada.</h2>
          </div>
          <article>
            <span className={styles.roleIndex}>01</span>
            <small>SI TU EMPRESA COMPRA</small>
            <h3>Pedí con precisión. Decidí con contexto.</h3>
            <p>Publicá una necesidad estructurada, convocá los rubros correctos y compará propuestas bajo las mismas condiciones.</p>
            <ul>{["Pedido estructurado", "Comparación de propuestas", "Adjudicación total o parcial", "Historial y notificaciones"].map(item => <li key={item}>{item}</li>)}</ul>
            <a href="#operacion-c1">Ver flujo comprador <span>→</span></a>
          </article>
          <article className={styles.providerRole}>
            <span className={styles.roleIndex}>02</span>
            <small>SI TU EMPRESA VENDE</small>
            <h3>Cotizá demanda real. Crecé más cerca.</h3>
            <p>Recibí oportunidades según tus rubros y presentá precios, condiciones y respaldo comercial sin exponer tu oferta.</p>
            <ul>{["Oportunidades por categoría", "Cotización por ítem", "Condiciones comerciales", "Seguimiento de adjudicaciones"].map(item => <li key={item}>{item}</li>)}</ul>
            <a href="#operacion-c1">Ver flujo proveedor <span>→</span></a>
          </article>
        </section>

        <section className={styles.cordilleraFlow} id="operacion-c1">
          <header><div><span>UNA OPERACIÓN · DE PUNTA A PUNTA</span><p>Cada etapa conserva el contexto que necesita la siguiente.</p></div><h2>De la necesidad<br />a la adjudicación.</h2></header>
          <div className={styles.flowTrack}>
            <article><b>PUBLICAR</b><h3>01</h3><p>Compras define qué necesita, cómo debe entregarse y hasta cuándo recibe propuestas.</p><div>{requestDetails.map(item => <span key={item}>{item}</span>)}</div></article>
            <article><b>COTIZAR</b><h3>02</h3><p>Los proveedores del rubro reciben el pedido y presentan una oferta comercial completa.</p><div>{quoteDetails.map(item => <span key={item}>{item}</span>)}</div></article>
            <article><b>ADJUDICAR</b><h3>03</h3><p>Compras abre, compara y registra su decisión total o por cada renglón.</p><div>{["Por pedido o ítem", "Cantidades adjudicadas", "Avisos automáticos", "Registro histórico"].map(item => <span key={item}>{item}</span>)}</div></article>
          </div>
          <div className={styles.flowFoot}><span>PUBLICACIÓN</span><i /><span>APERTURA CONTROLADA</span><i /><span>DECISIÓN REGISTRADA</span></div>
        </section>

        <section className={styles.cordilleraTrust} id="confianza-c1">
          <div><span>CONFIANZA OPERATIVA</span><h2>Reglas claras para información sensible.</h2><p>La plataforma ordena quién accede, qué puede ver y cuándo puede hacerlo.</p></div>
          <div className={styles.trustGrid}>
            <article><span>VERIFICACIÓN</span><b>Empresas reales</b><p>CUIT y documentación se revisan antes de habilitar la operación.</p></article>
            <article><span>PRIVACIDAD</span><b>Ofertas protegidas</b><p>Precios y archivos quedan limitados a las partes y al momento definido.</p></article>
            <article><span>CONTROL</span><b>Equipos con roles</b><p>Cada persona usa su acceso y las acciones relevantes quedan identificadas.</p></article>
            <article><span>TRAZABILIDAD</span><b>Historia completa</b><p>Solicitudes, ofertas, comunicaciones y decisiones permanecen registradas.</p></article>
          </div>
        </section>

        <section className={styles.cordilleraCta} id="registro-c1">
          <div className={styles.ctaContour} aria-hidden="true" />
          <span>LA PRÓXIMA CONEXIÓN EMPIEZA ACÁ</span>
          <h2>Tu empresa puede mover<br />la próxima operación.</h2>
          <p>Registrala como compradora, proveedora o ambas. El equipo de Miconect revisará la información para activar su acceso.</p>
          <Link href="/">Sumar mi empresa <b>↗</b></Link>
        </section>
      </main>
      <footer className={styles.cordilleraFooter}><Brand light /><p>Infraestructura comercial para la minería de San Juan.</p><span>Operada por MINPA S.A.S. · info@miconect.com</span></footer>
    </div>
  );
}

function ControlRoomLanding() {
  return (
    <div className={`${styles.preview} ${styles.control}`}>
      <header className={styles.controlNav}>
        <Brand light />
        <span className={styles.systemStatus}><i /> RED OPERATIVA · SAN JUAN</span>
        <div><Link href="/">Acceder</Link><a href="#registro-c2">Alta de empresa</a></div>
      </header>
      <main>
        <section className={styles.controlHero}>
          <div className={styles.controlHeadline}>
            <span>ABASTECIMIENTO MINERO / COORDINADO</span>
            <h1>Del requerimiento<br />a la adjudicación.<br /><em>Sin puntos ciegos.</em></h1>
            <p>Una sala de operaciones digital para compradores y proveedores: pedidos estructurados, ofertas protegidas y decisiones registradas.</p>
            <div><a href="#registro-c2">Activar mi empresa</a><a href="#operacion-c2">Explorar la operación ↓</a></div>
          </div>
          <div className={styles.operationPanel} aria-label="Ejemplo de solicitud activa">
            <header><span><i /> SOLICITUD ACTIVA</span><b>SJ-0248</b></header>
            <h2>Elementos de protección personal</h2>
            <div className={styles.operationMeta}><span>CIERRE<b>18:00 hs</b></span><span>MONEDA<b>ARS / USD</b></span><span>APERTURA<b>AL VENCIMIENTO</b></span></div>
            <div className={styles.operationRows}>
              <span><i>01</i><b>Cascos de seguridad</b><small>120 unidades</small></span>
              <span><i>02</i><b>Guantes anticorte</b><small>240 pares</small></span>
              <span><i>03</i><b>Protección visual</b><small>120 unidades</small></span>
            </div>
            <footer><span>PROVEEDORES CONVOCADOS <b>12</b></span><span>OFERTAS RECIBIDAS <b>05</b></span></footer>
          </div>
        </section>

        <section className={styles.controlTicker} aria-label="Capacidades principales">
          <span>EMPRESAS VERIFICADAS</span><i>◆</i><span>OFERTAS PRIVADAS</span><i>◆</i><span>APERTURA CONTROLADA</span><i>◆</i><span>ADJUDICACIÓN TRAZABLE</span><i>◆</i><span>EQUIPOS CON ROLES</span>
        </section>

        <section className={styles.controlOperation} id="operacion-c2">
          <header><small>FLUJO / 01—03</small><h2>Una operación que se puede leer de principio a fin.</h2><p>Cada etapa reúne la información necesaria para decidir y deja el siguiente paso claro.</p></header>
          <div className={styles.controlStages}>
            <article><span>01 / DEMANDA</span><h3>Publicar solicitud</h3><p>Artículos, cantidades, unidades, especificaciones, adjuntos, rubros y fecha límite.</p><div className={styles.stageSignal}><i /><b>LISTA PARA CONVOCAR</b></div></article>
            <article><span>02 / OFERTA</span><h3>Presentar cotización</h3><p>Precio unitario, IVA, moneda, entrega, pago, observaciones y respaldo en PDF.</p><div className={styles.stageSignal}><i /><b>ACCESO PROTEGIDO</b></div></article>
            <article><span>03 / DECISIÓN</span><h3>Adjudicar</h3><p>Comparación al momento permitido, selección total o por ítem y avisos a las partes.</p><div className={styles.stageSignal}><i /><b>DECISIÓN REGISTRADA</b></div></article>
          </div>
        </section>

        <section className={styles.controlRoles}>
          <article>
            <header><span>COMPRAS</span><b>CONTROL DE DEMANDA</b></header>
            <h2>Pedí con precisión.<br />Compará con contexto.</h2>
            <ul>{["Solicitudes públicas o dirigidas", "Adjuntos técnicos", "Apertura inmediata o al vencimiento", "Comparación y adjudicación por renglón", "Notificaciones e historial"].map(item => <li key={item}><i>+</i>{item}</li>)}</ul>
          </article>
          <article>
            <header><span>VENTAS</span><b>RADAR DE OPORTUNIDADES</b></header>
            <h2>Cotizá lo que hacés.<br />Seguí cada resultado.</h2>
            <ul>{["Pedidos alineados con tus rubros", "Oferta económica estructurada", "Condiciones de pago y entrega", "PDF comercial protegido", "Seguimiento de adjudicaciones"].map(item => <li key={item}><i>+</i>{item}</li>)}</ul>
          </article>
        </section>

        <section className={styles.securityConsole}>
          <div><small>CAPA DE CONFIANZA</small><h2>Verificación, privacidad y control de acceso.</h2><p>La red valida empresas, protege documentos y separa la información según el rol y la operación.</p></div>
          <div className={styles.consoleList}>
            <span><i>AUTH_01</i><b>CUIT y documentación empresarial</b><em>REVISADOS</em></span>
            <span><i>AUTH_02</i><b>Usuarios personales y equipos con roles</b><em>ACTIVOS</em></span>
            <span><i>DATA_03</i><b>Precios visibles sólo para las partes</b><em>PROTEGIDOS</em></span>
            <span><i>TRACE_04</i><b>Eventos y decisiones con historial</b><em>REGISTRADOS</em></span>
          </div>
        </section>

        <section className={styles.controlCta} id="registro-c2"><span><i /> NUEVO ACCESO</span><h2>Conectá tu próxima operación minera.</h2><p>Registrá la empresa, elegí si compra, vende o ambas y completá la verificación.</p><Link href="/">Iniciar alta empresarial <b>→</b></Link></section>
      </main>
      <footer className={styles.controlFooter}><Brand light /><span>MICONect / MINPA S.A.S. / SAN JUAN / ARGENTINA</span><a href="mailto:info@miconect.com">info@miconect.com</a></footer>
    </div>
  );
}

function NetworkLanding() {
  return (
    <div className={`${styles.preview} ${styles.network}`}>
      <header className={styles.networkNav}>
        <Brand />
        <nav><a href="#quienes-c3">Qué podés hacer</a><a href="#recorrido-c3">Cómo funciona</a><a href="#confianza-c3">Por qué Miconect</a></nav>
        <Link href="/">Ingresar ↗</Link>
      </header>
      <main>
        <section className={styles.networkHero}>
          <div className={styles.networkTitle}>
            <span>LA RED B2B DE LA MINERÍA SANJUANINA</span>
            <h1><em>Pedí.</em><br /><strong>Cotizá.</strong><br /><i>Conectá.</i></h1>
            <p>Empresas que necesitan. Empresas que resuelven. Un entorno local para transformar necesidades en oportunidades comerciales trazables.</p>
            <a href="#registro-c3">Quiero ser parte <b>↗</b></a>
          </div>
          <div className={styles.networkMap} aria-label="Compradores y proveedores conectados">
            <div className={styles.sunDisk}>SAN<br />JUAN</div>
            <span className={styles.buyerNode}>COMPRADOR<i>Publica una necesidad</i></span>
            <span className={styles.providerNode}>PROVEEDOR<i>Presenta una solución</i></span>
            <div className={styles.networkRibbonOne}>SOLICITUD · SOLICITUD · SOLICITUD</div>
            <div className={styles.networkRibbonTwo}>OFERTA · OFERTA · OFERTA</div>
            <b className={styles.networkSeal}>EMPRESAS<br />VERIFICADAS</b>
          </div>
        </section>

        <section className={styles.networkStatement}><p>No es un catálogo.</p><h2>Es el lugar donde una necesidad concreta encuentra una respuesta concreta.</h2></section>

        <section className={styles.networkRoles} id="quienes-c3">
          <article className={styles.networkBuyer}>
            <span>SI TU EMPRESA COMPRA</span><h2>Publicá lo que necesitás.</h2><p>Armá pedidos claros para que cada propuesta llegue con la misma estructura y pueda compararse de verdad.</p>
            <div>{["Productos y servicios", "Cantidades y especificaciones", "Documentación técnica", "Fecha límite", "Proveedores por rubro", "Adjudicación total o parcial"].map(item => <b key={item}>{item}</b>)}</div>
          </article>
          <article className={styles.networkProvider}>
            <span>SI TU EMPRESA VENDE</span><h2>Encontrá pedidos relevantes.</h2><p>Elegí tus rubros, recibí oportunidades activas y presentá una oferta comercial completa y protegida.</p>
            <div>{["Oportunidades segmentadas", "Precio por renglón", "IVA y moneda", "Pago y entrega", "PDF de cotización", "Seguimiento del resultado"].map(item => <b key={item}>{item}</b>)}</div>
          </article>
        </section>

        <section className={styles.networkJourney} id="recorrido-c3">
          <header><span>UN RECORRIDO SIMPLE</span><h2>De “necesitamos esto”<br />a “adjudicado”.</h2></header>
          <div>
            <article><b>1</b><span>LA EMPRESA COMPRADORA</span><h3>Publica</h3><p>Carga el pedido, convoca rubros y fija el vencimiento.</p></article>
            <article><b>2</b><span>LOS PROVEEDORES</span><h3>Cotizan</h3><p>Presentan precios y condiciones sin exponer su oferta.</p></article>
            <article><b>3</b><span>LA EMPRESA COMPRADORA</span><h3>Compara</h3><p>Accede a las propuestas en el momento definido.</p></article>
            <article><b>4</b><span>LA OPERACIÓN</span><h3>Se adjudica</h3><p>La decisión y sus cantidades quedan registradas.</p></article>
          </div>
        </section>

        <section className={styles.networkTrust} id="confianza-c3">
          <div><span>HECHO PARA GENERAR CONFIANZA</span><h2>La red crece con reglas claras.</h2></div>
          <div className={styles.networkTrustCards}>
            <article><b>01</b><h3>Identidad empresarial</h3><p>CUIT y documentación se revisan antes de operar.</p></article>
            <article><b>02</b><h3>Privacidad comercial</h3><p>Cotizaciones y archivos se muestran sólo a quien corresponde.</p></article>
            <article><b>03</b><h3>Accesos personales</h3><p>Los equipos trabajan con usuarios y roles identificables.</p></article>
            <article><b>04</b><h3>Historia de la operación</h3><p>Solicitudes, ofertas, avisos y adjudicaciones permanecen trazables.</p></article>
          </div>
        </section>

        <section className={styles.networkExtras}>
          <p><b>Además:</b> perfiles empresariales, gestión de equipos, notificaciones y espacios de publicidad sectorial para llegar a una audiencia B2B específica.</p>
        </section>

        <section className={styles.networkCta} id="registro-c3"><span>COMPRAR · VENDER · O HACER AMBAS</span><h2>Tu empresa tiene un lugar en esta red.</h2><Link href="/">Registrar empresa</Link><small>El alta requiere verificación empresarial.</small></section>
      </main>
      <footer className={styles.networkFooter}><Brand /><div><a href="mailto:info@miconect.com">Contacto</a><Link href="/">Términos</Link><Link href="/">Privacidad</Link></div><p>Operada por MINPA S.A.S. · Miconect facilita el contacto y no es parte de las operaciones comerciales entre empresas.</p></footer>
    </div>
  );
}

export default function LandingPreviewsPage() {
  const [activeVersion, setActiveVersion] = useState(0);
  return (
    <div className={styles.gallery}>
      <PreviewSwitcher active={activeVersion} onChange={setActiveVersion} />
      <div className={styles.canvas} key={activeVersion}>
        {activeVersion === 0 && <CordilleraLanding />}
        {activeVersion === 1 && <ControlRoomLanding />}
        {activeVersion === 2 && <NetworkLanding />}
      </div>
    </div>
  );
}
