import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { getApi, postApi } from "services/api";
import {
  FaArrowRight,
  FaBath,
  FaBed,
  FaBars,
  FaBuilding,
  FaCheckCircle,
  FaChevronDown,
  FaHandshake,
  FaHome,
  FaKey,
  FaMapMarkerAlt,
  FaRulerCombined,
  FaSearch,
  FaTimes,
} from "react-icons/fa";

/* ---------------------------------------------------------------------------
 * Marca y contenidos base
 * ------------------------------------------------------------------------- */

const BRAND = {
  name: "Nova",
  suffix: "Real Estate",
  claim: "Bienes raíces · Asesoría personalizada",
};

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=2000&q=80";

const FALLBACK_PHOTOS = [
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=80",
];

// Los tipos llegan en inglés o español según el origen del dato: se muestra un
// nombre consistente y en español.
const TYPE_LABELS = {
  apartment: "Departamento",
  departamento: "Departamento",
  depa: "Departamento",
  house: "Casa",
  casa: "Casa",
  residential: "Residencial",
  residencial: "Residencial",
  commercial: "Comercial",
  comercial: "Comercial",
  office: "Oficina",
  oficina: "Oficina",
  local: "Local",
  loft: "Loft",
  studio: "Estudio",
  estudio: "Estudio",
  land: "Terreno",
  terreno: "Terreno",
  bodega: "Bodega",
};

const typeLabel = (type) => {
  const clean = String(type || "").trim();
  if (!clean) return "Propiedad";
  const mapped = TYPE_LABELS[clean.toLowerCase()];
  if (mapped) return mapped;
  return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
};

const STEPS = [
  {
    icon: FaSearch,
    title: "Elige tu propiedad",
    text: "Filtra por tipo, zona y presupuesto. Todas las fichas vienen de nuestro inventario real.",
  },
  {
    icon: FaHandshake,
    title: "Agenda una visita",
    text: "Un asesor te acompaña, resuelve dudas y te comparte documentos y detalles legales.",
  },
  {
    icon: FaKey,
    title: "Cierra con confianza",
    text: "Acompañamiento en oferta, crédito y firma para que la operación llegue a buen término.",
  },
];

const BUDGETS = [
  { value: "ALL", label: "Cualquier presupuesto" },
  { value: "LOW", label: "Hasta $5,000,000" },
  { value: "MID", label: "$5,000,000 – $10,000,000" },
  { value: "HIGH", label: "Más de $10,000,000" },
];

/* ---------------------------------------------------------------------------
 * Utilidades
 * ------------------------------------------------------------------------- */

const formatPrice = (price) => {
  const value = Number(price);
  if (!value) return "Precio a consultar";
  const formatted = value.toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  });
  return value < 100000 ? `${formatted} / mes` : formatted;
};

const zoneOf = (property) => {
  const location = String(property?.location || "").trim();
  if (!location) return "Zona por confirmar";
  const parts = location.split(",").map((part) => part.trim()).filter(Boolean);
  return parts[parts.length - 1];
};

const photoOf = (property, index = 0) => {
  const photos = Array.isArray(property?.photos) ? property.photos.filter(Boolean) : [];
  if (photos.length > 0) return photos[0];
  return FALLBACK_PHOTOS[index % FALLBACK_PHOTOS.length];
};

const statusMeta = (status) => {
  const value = String(status || "").toLowerCase();
  if (value === "sold") return { label: "Vendida", className: "bg-slate-900 text-white" };
  if (value === "pending") return { label: "En proceso", className: "bg-amber-500 text-white" };
  if (value === "available") return { label: "Disponible", className: "bg-emerald-500 text-white" };
  return { label: status || "Disponible", className: "bg-slate-700 text-white" };
};

const matchesBudget = (price, budget) => {
  const value = Number(price) || 0;
  if (budget === "LOW") return value > 0 && value <= 5000000;
  if (budget === "MID") return value > 5000000 && value <= 10000000;
  if (budget === "HIGH") return value > 10000000;
  return true;
};

/* ---------------------------------------------------------------------------
 * Piezas de interfaz
 * ------------------------------------------------------------------------- */

const BrandMark = ({ size = "md" }) => (
  <div className="flex items-center gap-2.5">
    <div
      className={`${
        size === "lg" ? "h-11 w-11 text-lg" : "h-9 w-9 text-sm"
      } flex items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-violet-500 font-display font-extrabold text-white shadow-lg shadow-brand-600/25`}
    >
      N
    </div>
    <div className="leading-tight">
      <p className="font-display text-base font-extrabold tracking-tight text-slate-900">
        {BRAND.name}
        <span className="ml-1 font-semibold text-slate-500">{BRAND.suffix}</span>
      </p>
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
        Monterrey
      </p>
    </div>
  </div>
);

const SectionHeading = ({ eyebrow, title, description, action }) => (
  <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
    <div>
      {eyebrow ? (
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-brand-600">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="font-display text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl">
        {title}
      </h2>
      {description ? <p className="mt-2 max-w-2xl text-sm text-slate-500">{description}</p> : null}
    </div>
    {action}
  </div>
);

const Field = ({ label, children, htmlFor }) => (
  <div>
    <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-semibold text-slate-600">
      {label}
    </label>
    {children}
  </div>
);

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100";

/* ---------------------------------------------------------------------------
 * Landing
 * ------------------------------------------------------------------------- */

export default function ClientPortal() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState([]);
  const [zones, setZones] = useState([]);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [zoneFilter, setZoneFilter] = useState("ALL");
  const [budget, setBudget] = useState("ALL");

  const [selected, setSelected] = useState(null);
  const [activePhoto, setActivePhoto] = useState(0);

  const [contactProperty, setContactProperty] = useState(null);
  const [contactOpen, setContactOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    document.title = "Nova Real Estate · Casas y departamentos";
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      const response = await getApi("api/public/properties");

      if (cancelled) return;

      if (response?.status === 200) {
        const list = Array.isArray(response.data?.properties) ? response.data.properties : [];
        setProperties(list);
        setZones(Array.isArray(response.data?.zones) ? response.data.zones : []);
      } else {
        setProperties([]);
        setZones([]);
      }

      setLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const types = useMemo(() => {
    const map = new Map();
    properties.forEach((property) => {
      const label = typeLabel(property.propertyType);
      map.set(label, (map.get(label) || 0) + 1);
    });
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [properties]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return properties.filter((property) => {
      const haystack = `${property.name || ""} ${property.location || ""} ${property.propertyType || ""}`.toLowerCase();
      const matchesQuery = !query || haystack.includes(query);
      const matchesType = typeFilter === "ALL" || typeLabel(property.propertyType) === typeFilter;
      const matchesZone = zoneFilter === "ALL" || zoneOf(property) === zoneFilter;

      return matchesQuery && matchesType && matchesZone && matchesBudget(property.price, budget);
    });
  }, [properties, search, typeFilter, zoneFilter, budget]);

  const hasFilters = search || typeFilter !== "ALL" || zoneFilter !== "ALL" || budget !== "ALL";

  const resetFilters = () => {
    setSearch("");
    setTypeFilter("ALL");
    setZoneFilter("ALL");
    setBudget("ALL");
  };

  const openContact = (property = null, presetMessage = "") => {
    setContactProperty(property);
    setContactOpen(true);
    setSent(false);
    setForm((prev) => ({
      ...prev,
      message:
        presetMessage ||
        (property
          ? `Me interesa la propiedad "${property.name}" (${property.location}). ¿Podemos agendar una visita?`
          : ""),
    }));
  };

  const closeContact = () => {
    setContactOpen(false);
    setContactProperty(null);
    setSent(false);
  };

  const submitContact = async (event) => {
    event.preventDefault();

    const name = form.name.trim();
    const phone = form.phone.replace(/\D/g, "");
    const email = form.email.trim();

    if (name.length < 3) {
      toast.error("Escribe tu nombre completo.");
      return;
    }

    if (phone.length < 10 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Compártenos un teléfono de 10 dígitos o un correo válido.");
      return;
    }

    setSending(true);
    const response = await postApi("api/public/inquiry", {
      leadName: name,
      leadEmail: email || null,
      leadPhoneNumber: phone || null,
      notes: form.message.trim() || null,
      propertyName: contactProperty?.name || null,
    });
    setSending(false);

    if (response?.status === 201 || response?.status === 200) {
      setSent(true);
      setForm({ name: "", email: "", phone: "", message: "" });
    } else {
      toast.error(
        response?.response?.data?.message ||
          "No pudimos enviar tu solicitud. Intenta de nuevo en un momento.",
      );
    }
  };

  const goToCatalog = () => {
    const section = document.getElementById("propiedades");
    if (section) section.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  /* ---------------------------------------------------------------- render */

  return (
    <div className="nova-landing min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 md:h-20 md:px-8">
          <a href="/" className="flex items-center" aria-label="Nova Real Estate">
            <BrandMark />
          </a>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Principal">
            {[
              ["Propiedades", "#propiedades"],
              ["Zonas", "#zonas"],
              ["Cómo funciona", "#proceso"],
              ["Contacto", "#contacto"],
            ].map(([label, href]) => (
              <a
                key={href}
                href={href}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
              >
                {label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <button
              onClick={() => navigate("/auth/sign-in")}
              className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              Acceso asesores
            </button>
            <button
              onClick={() => openContact(null)}
              className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-brand-700"
            >
              Solicitar asesoría
            </button>
          </div>

          <button
            onClick={() => setMobileMenu((prev) => !prev)}
            className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 md:hidden"
            aria-label="Abrir menú"
          >
            {mobileMenu ? <FaTimes size={18} /> : <FaBars size={18} />}
          </button>
        </div>

        {mobileMenu ? (
          <div className="border-t border-slate-200 bg-white px-5 py-4 md:hidden">
            <nav className="flex flex-col gap-1" aria-label="Principal móvil">
              {[
                ["Propiedades", "#propiedades"],
                ["Zonas", "#zonas"],
                ["Cómo funciona", "#proceso"],
                ["Contacto", "#contacto"],
              ].map(([label, href]) => (
                <a
                  key={href}
                  href={href}
                  onClick={() => setMobileMenu(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  {label}
                </a>
              ))}
            </nav>
            <div className="mt-3 flex flex-col gap-2 border-t border-slate-200 pt-3">
              <button
                onClick={() => {
                  setMobileMenu(false);
                  openContact(null);
                }}
                className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white"
              >
                Solicitar asesoría
              </button>
              <button
                onClick={() => navigate("/auth/sign-in")}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700"
              >
                Acceso asesores
              </button>
            </div>
          </div>
        ) : null}
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-brand-900">
            <img
              src={HERO_IMAGE}
              alt=""
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950/85 via-slate-900/70 to-brand-900/70" />
          </div>

          <div className="relative mx-auto max-w-6xl px-5 pb-14 pt-16 md:px-8 md:pb-20 md:pt-24">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/90 backdrop-blur">
                <FaBuilding size={11} />
                Catálogo actualizado desde el CRM
              </span>

              <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.08] tracking-tight text-white md:text-6xl">
                Encuentra tu próxima
                <span className="block bg-gradient-to-r from-brand-200 to-white bg-clip-text text-transparent">
                  casa o departamento
                </span>
              </h1>

              <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-200 md:text-lg">
                Inventario verificado, fichas completas y asesoría de principio a fin. Compra, renta
                o invierte con acompañamiento real.
              </p>
            </div>

            {/* Buscador */}
            <div className="mt-9 rounded-2xl border border-white/40 bg-white/95 p-4 shadow-2xl backdrop-blur md:p-5">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                <div className="relative md:col-span-4">
                  <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Buscar por nombre o colonia"
                    aria-label="Buscar propiedades"
                    className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                  />
                </div>

                <div className="relative md:col-span-3">
                  <select
                    value={typeFilter}
                    onChange={(event) => setTypeFilter(event.target.value)}
                    aria-label="Tipo de propiedad"
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-3.5 pr-9 text-sm font-medium text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                  >
                    <option value="ALL">Todos los tipos</option>
                    {types.map(([label]) => (
                      <option key={label} value={label}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <FaChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={10} />
                </div>

                <div className="relative md:col-span-3">
                  <select
                    value={zoneFilter}
                    onChange={(event) => setZoneFilter(event.target.value)}
                    aria-label="Zona"
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-3.5 pr-9 text-sm font-medium text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                  >
                    <option value="ALL">Todas las zonas</option>
                    {zones.map((zone) => (
                      <option key={zone} value={zone}>
                        {zone}
                      </option>
                    ))}
                  </select>
                  <FaChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={10} />
                </div>

                <div className="md:col-span-2">
                  <button
                    onClick={goToCatalog}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-700"
                  >
                    Buscar
                    <FaArrowRight size={11} />
                  </button>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <FaCheckCircle className="text-emerald-500" size={11} />
                  {properties.length} propiedades publicadas
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <FaCheckCircle className="text-emerald-500" size={11} />
                  {zones.length} zonas con inventario
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <FaCheckCircle className="text-emerald-500" size={11} />
                  Asesoría sin costo
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Catálogo */}
        <section id="propiedades" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-14 md:px-8 md:py-20">
          <SectionHeading
            eyebrow="Catálogo"
            title="Propiedades disponibles"
            description="Fichas reales de nuestro inventario, con datos de contacto directo con un asesor."
            action={
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-900"
              >
                Limpiar filtros
              </button>
            }
          />

          <div className="mb-6 flex flex-wrap gap-2">
            <button
              onClick={() => setTypeFilter("ALL")}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${
                typeFilter === "ALL"
                  ? "bg-slate-900 text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300"
              }`}
            >
              Todas ({properties.length})
            </button>
            {types.map(([label, count]) => (
              <button
                key={label}
                onClick={() => setTypeFilter(label)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${
                  typeFilter === label
                    ? "bg-slate-900 text-white"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                }`}
              >
                {label} ({count})
              </button>
            ))}

            <div className="relative ml-auto">
              <select
                value={budget}
                onChange={(event) => setBudget(event.target.value)}
                aria-label="Presupuesto"
                className="appearance-none rounded-full border border-slate-200 bg-white py-1.5 pl-3.5 pr-8 text-xs font-semibold text-slate-600 focus:border-brand-500 focus:outline-none"
              >
                {BUDGETS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <FaChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={9} />
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((key) => (
                <div key={key} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  <div className="h-52 animate-pulse bg-slate-100" />
                  <div className="space-y-3 p-5">
                    <div className="h-3 w-20 animate-pulse rounded bg-slate-100" />
                    <div className="h-4 w-40 animate-pulse rounded bg-slate-100" />
                    <div className="h-3 w-32 animate-pulse rounded bg-slate-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <FaHome size={20} />
              </div>
              <h3 className="mt-4 font-display text-lg font-bold text-slate-900">
                {properties.length === 0
                  ? "Estamos preparando el inventario"
                  : "Sin resultados con estos filtros"}
              </h3>
              <p className="mx-auto mt-1.5 max-w-md text-sm text-slate-500">
                {properties.length === 0
                  ? "Muy pronto publicaremos propiedades disponibles. Déjanos tus datos y te avisamos primero."
                  : "Prueba con otra zona, tipo de propiedad o limpia los filtros."}
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {properties.length > 0 ? (
                  <button
                    onClick={resetFilters}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300"
                  >
                    Limpiar filtros
                  </button>
                ) : null}
                <button
                  onClick={() => openContact(null)}
                  className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-700"
                >
                  Hablar con un asesor
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="mb-5 text-xs font-semibold text-slate-400">
                {filtered.length} resultado{filtered.length === 1 ? "" : "s"}
                {hasFilters ? " con tus filtros" : ""}
              </p>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filtered.map((property, index) => {
                  const status = statusMeta(property.status);
                  const zone = zoneOf(property);

                  return (
                    <article
                      key={property.id}
                      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lg"
                    >
                      <button
                        onClick={() => {
                          setSelected(property);
                          setActivePhoto(0);
                        }}
                        className="relative block h-52 w-full overflow-hidden bg-gradient-to-br from-slate-200 to-slate-300 text-left"
                        aria-label={`Ver detalle de ${property.name}`}
                      >
                        <img
                          src={photoOf(property, index)}
                          alt={property.name}
                          loading="lazy"
                          onError={(event) => {
                            event.currentTarget.style.display = "none";
                          }}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <span
                          className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${status.className}`}
                        >
                          {status.label}
                        </span>
                        <span className="absolute right-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-700">
                          {typeLabel(property.propertyType)}
                        </span>
                      </button>

                      <div className="flex flex-1 flex-col p-5">
                        <p className="text-lg font-extrabold tracking-tight text-slate-900">
                          {formatPrice(property.price)}
                        </p>
                        <h3 className="mt-1 line-clamp-1 font-display text-sm font-bold text-slate-800">
                          {property.name}
                        </h3>
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                          <FaMapMarkerAlt size={10} className="text-slate-400" />
                          <span className="line-clamp-1">{property.location || zone}</span>
                        </p>

                        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3 text-xs font-semibold text-slate-500">
                          {property.bedrooms ? (
                            <span className="inline-flex items-center gap-1.5">
                              <FaBed size={12} className="text-slate-400" />
                              {property.bedrooms} rec.
                            </span>
                          ) : null}
                          {property.bathrooms ? (
                            <span className="inline-flex items-center gap-1.5">
                              <FaBath size={12} className="text-slate-400" />
                              {property.bathrooms} baños
                            </span>
                          ) : null}
                          {property.squareFeet ? (
                            <span className="inline-flex items-center gap-1.5">
                              <FaRulerCombined size={11} className="text-slate-400" />
                              {property.squareFeet} m²
                            </span>
                          ) : null}
                        </div>

                        <div className="mt-4 flex gap-2">
                          <button
                            onClick={() => {
                              setSelected(property);
                              setActivePhoto(0);
                            }}
                            className="flex-1 rounded-xl bg-slate-900 px-3 py-2.5 text-xs font-bold text-white transition-colors hover:bg-slate-800"
                          >
                            Ver detalle
                          </button>
                          <button
                            onClick={() => openContact(property)}
                            className="flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-bold text-slate-700 transition-colors hover:border-brand-300 hover:text-brand-700"
                          >
                            Solicitar info
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </section>

        {/* Zonas */}
        {!loading && zones.length > 1 ? (
          <section id="zonas" className="border-y border-slate-200 bg-white">
            <div className="mx-auto max-w-6xl scroll-mt-20 px-5 py-14 md:px-8 md:py-20">
              <SectionHeading
                eyebrow="Cobertura"
                title="Zonas con inventario activo"
                description="Trabajamos las colonias y municipios donde tenemos propiedades publicadas hoy."
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {zones.slice(0, 8).map((zone) => {
                  const count = properties.filter((property) => zoneOf(property) === zone).length;

                  return (
                    <button
                      key={zone}
                      onClick={() => {
                        setZoneFilter(zone);
                        goToCatalog();
                      }}
                      className="group rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:bg-white hover:shadow-card"
                    >
                      <div className="flex items-center justify-between">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                          <FaMapMarkerAlt size={13} />
                        </span>
                        <FaArrowRight
                          size={11}
                          className="text-slate-300 transition-colors group-hover:text-brand-500"
                        />
                      </div>
                      <p className="mt-4 font-display text-sm font-bold text-slate-900">{zone}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {count} propiedad{count === 1 ? "" : "es"}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        ) : null}

        {/* Cómo funciona */}
        <section id="proceso" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-14 md:px-8 md:py-20">
          <SectionHeading
            eyebrow="Proceso"
            title="Así trabajamos contigo"
            description="Sin comisiones sorpresa ni letras chiquitas: un asesor te acompaña en cada etapa."
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <div key={step.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    <step.icon size={15} />
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                    Paso {index + 1}
                  </span>
                </div>
                <h3 className="mt-4 font-display text-base font-bold text-slate-900">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{step.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Asesoría / contacto */}
        <section id="contacto" className="scroll-mt-20 border-t border-slate-200 bg-white">
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-5 py-14 md:px-8 md:py-20 lg:grid-cols-2">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-600">Asesoría</p>
              <h2 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl">
                Cuéntanos qué buscas y te contactamos hoy
              </h2>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-500">
                Ya sea que quieras comprar, rentar, vender o compartir un roomie, te ayudamos a
                encontrar la mejor opción con inventario verificado.
              </p>

              <ul className="mt-6 space-y-3">
                {[
                  "Respuesta de un asesor en horario hábil",
                  "Fichas completas y visitas coordinadas",
                  "Acompañamiento en crédito y documentación",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-slate-600">
                    <FaCheckCircle className="mt-0.5 shrink-0 text-emerald-500" size={13} />
                    {item}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => navigate("/auth/sign-in")}
                className="mt-7 inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-900"
              >
                Soy asesor · entrar al CRM
                <FaArrowRight size={10} />
              </button>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 md:p-7">
              {sent ? (
                <div className="flex h-full flex-col items-center justify-center py-10 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                    <FaCheckCircle size={20} />
                  </div>
                  <h3 className="mt-4 font-display text-lg font-bold text-slate-900">
                    Solicitud enviada
                  </h3>
                  <p className="mt-1.5 max-w-xs text-sm text-slate-500">
                    Un asesor te contactará muy pronto. Gracias por confiar en Nova.
                  </p>
                  <button
                    onClick={() => setSent(false)}
                    className="mt-5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300"
                  >
                    Enviar otra solicitud
                  </button>
                </div>
              ) : (
                <form onSubmit={submitContact} className="space-y-4">
                  <Field label="Nombre completo" htmlFor="contact-name">
                    <input
                      id="contact-name"
                      value={form.name}
                      onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                      placeholder="Tu nombre"
                      className={inputClass}
                      required
                    />
                  </Field>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Teléfono" htmlFor="contact-phone">
                      <input
                        id="contact-phone"
                        value={form.phone}
                        onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                        placeholder="81 1234 5678"
                        inputMode="tel"
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Correo" htmlFor="contact-email">
                      <input
                        id="contact-email"
                        type="email"
                        value={form.email}
                        onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                        placeholder="tu@correo.com"
                        className={inputClass}
                      />
                    </Field>
                  </div>

                  <Field label="¿Qué estás buscando?" htmlFor="contact-message">
                    <textarea
                      id="contact-message"
                      value={form.message}
                      onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
                      rows={4}
                      placeholder="Zona, presupuesto, número de recámaras…"
                      className={`${inputClass} resize-none`}
                    />
                  </Field>

                  <button
                    type="submit"
                    disabled={sending}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {sending ? "Enviando…" : "Enviar solicitud"}
                    {!sending ? <FaArrowRight size={11} /> : null}
                  </button>

                  <p className="text-center text-[11px] leading-relaxed text-slate-400">
                    Al enviar aceptas que un asesor te contacte por teléfono o correo.
                  </p>
                </form>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-950">
        <div className="mx-auto max-w-6xl px-5 py-10 md:px-8">
          <div className="flex flex-wrap items-start justify-between gap-8">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-violet-500 font-display text-sm font-extrabold text-white">
                  N
                </div>
                <p className="font-display text-base font-extrabold text-white">
                  {BRAND.name}
                  <span className="ml-1 font-semibold text-slate-400">{BRAND.suffix}</span>
                </p>
              </div>
              <p className="mt-3 max-w-xs text-xs leading-relaxed text-slate-400">{BRAND.claim}</p>
            </div>

            <nav className="flex flex-wrap gap-x-8 gap-y-2 text-xs font-semibold text-slate-400" aria-label="Pie">
              <a href="#propiedades" className="hover:text-white">
                Propiedades
              </a>
              <a href="#zonas" className="hover:text-white">
                Zonas
              </a>
              <a href="#proceso" className="hover:text-white">
                Cómo funciona
              </a>
              <a href="#contacto" className="hover:text-white">
                Contacto
              </a>
              <button onClick={() => navigate("/auth/sign-in")} className="hover:text-white">
                Acceso asesores
              </button>
            </nav>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5 text-[11px] text-slate-500">
            <p>© {new Date().getFullYear()} Nova Real Estate. Todos los derechos reservados.</p>
            <p>Catálogo conectado a Nova CRM</p>
          </div>
        </div>
      </footer>

      {/* Modal de detalle */}
      {selected ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur md:px-6">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-600">
                  {typeLabel(selected.propertyType)}
                </p>
                <h3 className="mt-1 truncate font-display text-lg font-extrabold text-slate-900 md:text-xl">
                  {selected.name}
                </h3>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                  <FaMapMarkerAlt size={10} />
                  {selected.location || "Ubicación por confirmar"}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                aria-label="Cerrar detalle"
              >
                <FaTimes size={15} />
              </button>
            </div>

            <div className="px-5 py-5 md:px-6">
              <div className="overflow-hidden rounded-xl bg-gradient-to-br from-slate-200 to-slate-300">
                <img
                  src={selected.photos?.[activePhoto] || photoOf(selected, 0)}
                  alt={selected.name}
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                  className="h-64 w-full object-cover md:h-80"
                />
              </div>

              {Array.isArray(selected.photos) && selected.photos.length > 1 ? (
                <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                  {selected.photos.map((photo, index) => (
                    <button
                      key={`${photo}-${index}`}
                      onClick={() => setActivePhoto(index)}
                      className={`h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                        activePhoto === index ? "border-brand-500" : "border-transparent opacity-70 hover:opacity-100"
                      }`}
                      aria-label={`Foto ${index + 1}`}
                    >
                      <img src={photo} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              ) : null}

              <div className="mt-5 flex flex-wrap items-end justify-between gap-4 rounded-xl bg-slate-50 p-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                    Precio
                  </p>
                  <p className="mt-1 font-display text-2xl font-extrabold text-slate-900">
                    {formatPrice(selected.price)}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide ${statusMeta(selected.status).className}`}
                >
                  {statusMeta(selected.status).label}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3">
                {[
                  { icon: FaBed, label: "Recámaras", value: selected.bedrooms || "—" },
                  { icon: FaBath, label: "Baños", value: selected.bathrooms || "—" },
                  { icon: FaRulerCombined, label: "Superficie", value: selected.squareFeet ? `${selected.squareFeet} m²` : "—" },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-slate-200 p-3 text-center">
                    <item.icon className="mx-auto text-slate-400" size={14} />
                    <p className="mt-1.5 text-sm font-bold text-slate-900">{item.value}</p>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>

              {selected.description ? (
                <div className="mt-5">
                  <h4 className="font-display text-sm font-bold text-slate-900">Descripción</h4>
                  <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-slate-600">
                    {selected.description}
                  </p>
                </div>
              ) : null}

              <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                <button
                  onClick={() => {
                    openContact(selected);
                    setSelected(null);
                  }}
                  className="flex-1 rounded-xl bg-brand-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-700"
                >
                  Solicitar información
                </button>
                <button
                  onClick={() => setSelected(null)}
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 hover:border-slate-300"
                >
                  Seguir explorando
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Modal de contacto */}
      {contactOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-600">
                  Asesoría
                </p>
                <h3 className="mt-1 font-display text-lg font-extrabold text-slate-900">
                  Solicitar información
                </h3>
                {contactProperty ? (
                  <p className="mt-0.5 text-xs text-slate-500">{contactProperty.name}</p>
                ) : null}
              </div>
              <button
                onClick={closeContact}
                className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                aria-label="Cerrar"
              >
                <FaTimes size={15} />
              </button>
            </div>

            <div className="px-5 py-5">
              {sent ? (
                <div className="flex flex-col items-center py-6 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                    <FaCheckCircle size={20} />
                  </div>
                  <h4 className="mt-4 font-display text-base font-bold text-slate-900">
                    ¡Solicitud enviada!
                  </h4>
                  <p className="mt-1.5 max-w-xs text-sm text-slate-500">
                    Un asesor te contactará muy pronto para darte seguimiento.
                  </p>
                  <button
                    onClick={closeContact}
                    className="mt-5 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white"
                  >
                    Cerrar
                  </button>
                </div>
              ) : (
                <form onSubmit={submitContact} className="space-y-4">
                  <Field label="Nombre completo" htmlFor="modal-name">
                    <input
                      id="modal-name"
                      value={form.name}
                      onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                      placeholder="Tu nombre"
                      className={inputClass}
                      required
                    />
                  </Field>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Teléfono" htmlFor="modal-phone">
                      <input
                        id="modal-phone"
                        value={form.phone}
                        onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                        placeholder="81 1234 5678"
                        inputMode="tel"
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Correo" htmlFor="modal-email">
                      <input
                        id="modal-email"
                        type="email"
                        value={form.email}
                        onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                        placeholder="tu@correo.com"
                        className={inputClass}
                      />
                    </Field>
                  </div>

                  <Field label="Mensaje" htmlFor="modal-message">
                    <textarea
                      id="modal-message"
                      value={form.message}
                      onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
                      rows={3}
                      className={`${inputClass} resize-none`}
                    />
                  </Field>

                  <button
                    type="submit"
                    disabled={sending}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {sending ? "Enviando…" : "Enviar solicitud"}
                    {!sending ? <FaArrowRight size={11} /> : null}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
