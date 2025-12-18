# Specification: Multilingual Support (Spanish)

**Feature ID:** F026
**Priority:** High
**Effort:** Medium (1 week)
**Dependencies:** All UI features (F001-F025)
**Status:** Ready for Implementation

---

## Table of Contents

1. [Overview](#overview)
2. [Technical Architecture](#technical-architecture)
3. [Translation File Structure](#translation-file-structure)
4. [Implementation Details](#implementation-details)
5. [UI Components](#ui-components)
6. [Locale-Specific Formatting](#locale-specific-formatting)
7. [Translation Workflow](#translation-workflow)
8. [Testing Requirements](#testing-requirements)
9. [Deployment Checklist](#deployment-checklist)

---

## Overview

### Purpose
Implement full Spanish localization for the BRITE POOL platform to serve Costa Rica-based users and Spanish-speaking community members, using next-intl for robust internationalization.

### Key Requirements
- Full Spanish translation for all public-facing pages
- Full Spanish translation for all member dashboard areas
- JSON-based translation files organized by feature/namespace
- Language switcher component in header/navbar
- Automatic locale detection based on browser preferences
- Locale-specific date/number formatting for Costa Rica (es-CR)
- Support for English (en) and Spanish (es) languages
- RTL support NOT needed for this implementation
- Persistent locale preference stored in cookies
- Fallback to English for missing translations

### Success Metrics
- 100% of UI strings are translatable (no hardcoded English)
- Zero layout breaks when switching languages
- Locale detection works correctly for 95%+ of Spanish users
- Translation files are maintainable by non-developers
- Language switch is instant (< 100ms)

---

## Technical Architecture

### next-intl Integration

**Installation:**
```bash
npm install next-intl
```

**Key Files:**
```
britepool/
├── i18n/
│   ├── request.ts          # i18n request configuration
│   └── routing.ts          # Locale routing configuration
├── messages/
│   ├── en.json            # English translations
│   ├── es.json            # Spanish translations
│   └── README.md          # Translation guide
├── middleware.ts          # Locale detection middleware
└── next.config.js         # i18n configuration
```

### Routing Strategy

**App Router Integration:**
Uses `[locale]` dynamic segment at root level:

```
app/
├── [locale]/
│   ├── layout.tsx         # Root layout with locale provider
│   ├── page.tsx          # Home page
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── contract-review/page.tsx
│   └── dashboard/
│       ├── layout.tsx
│       ├── page.tsx
│       ├── committees/
│       ├── events/
│       └── ...
```

**URL Structure:**
- English: `/en/dashboard` or `/dashboard` (default)
- Spanish: `/es/dashboard` or `/es/panel`

### Locale Detection Strategy

Priority order:
1. URL path segment (`/es/...`)
2. Cookie (`NEXT_LOCALE`)
3. Accept-Language header
4. Default locale (en)

---

## Translation File Structure

### Namespace Organization

**Strategy:** Organize translations by feature/domain for maintainability

**File Structure:**
```json
// messages/en.json
{
  "common": {
    "appName": "BRITE POOL",
    "appTagline": "Ministerium of Empowerment",
    "loading": "Loading...",
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "submit": "Submit",
    "close": "Close",
    "search": "Search",
    "filter": "Filter",
    "download": "Download",
    "upload": "Upload"
  },
  "navigation": {
    "home": "Home",
    "dashboard": "Dashboard",
    "events": "Events",
    "committees": "Committees",
    "learning": "Learning",
    "gallery": "Gallery",
    "map": "Map",
    "profile": "Profile",
    "settings": "Settings",
    "logout": "Logout"
  },
  "auth": {
    "login": "Log In",
    "register": "Register",
    "logout": "Log Out",
    "email": "Email",
    "password": "Password",
    "confirmPassword": "Confirm Password",
    "forgotPassword": "Forgot Password?",
    "resetPassword": "Reset Password",
    "name": "Full Name",
    "loginTitle": "Welcome Back",
    "registerTitle": "Join BRITE POOL",
    "loginSuccess": "Successfully logged in",
    "loginError": "Invalid email or password",
    "registerSuccess": "Account created successfully",
    "alreadyHaveAccount": "Already have an account?",
    "dontHaveAccount": "Don't have an account?"
  },
  "contract": {
    "title": "Membership Agreement",
    "subtitle": "Review and Accept",
    "scrollToEnable": "Please scroll to the bottom to enable acceptance",
    "agreeCheckbox": "I have read and agree to the terms above",
    "acceptButton": "Accept Contract",
    "downloadPdf": "Download PDF",
    "processing": "Processing...",
    "mustAccept": "You must accept the membership agreement to continue",
    "newVersion": "A new version of the membership agreement is available",
    "versionLabel": "Version {version}",
    "publishedOn": "Published on {date}"
  },
  "dashboard": {
    "welcome": "Welcome, {name}",
    "quickActions": "Quick Actions",
    "upcomingEvents": "Upcoming Events",
    "myCommittees": "My Committees",
    "recentActivity": "Recent Activity",
    "participationHours": "Participation Hours",
    "equityUnits": "Equity Units",
    "viewAll": "View All",
    "noData": "No data available"
  },
  "events": {
    "title": "Events",
    "upcoming": "Upcoming Events",
    "past": "Past Events",
    "myEvents": "My Events",
    "createEvent": "Create Event",
    "editEvent": "Edit Event",
    "eventName": "Event Name",
    "eventDescription": "Description",
    "startTime": "Start Time",
    "endTime": "End Time",
    "location": "Location",
    "virtualLink": "Virtual Link",
    "capacity": "Capacity",
    "register": "Register",
    "unregister": "Unregister",
    "registered": "Registered",
    "waitlisted": "Waitlisted",
    "full": "Event Full",
    "type": {
      "COMMITTEE_MEETING": "Committee Meeting",
      "WORKSHOP": "Workshop",
      "SANCTUARY_EVENT": "Sanctuary Event",
      "VIRTUAL_WEBINAR": "Virtual Webinar"
    }
  },
  "committees": {
    "title": "Committees",
    "myCommittees": "My Committees",
    "allCommittees": "All Committees",
    "join": "Join Committee",
    "leave": "Leave Committee",
    "members": "Members",
    "tasks": "Tasks",
    "description": "Description",
    "type": {
      "GOVERNANCE": "Governance",
      "WEALTH": "Wealth",
      "EDUCATION": "Education",
      "HEALTH": "Health",
      "OPERATIONS": "Operations"
    }
  },
  "learning": {
    "title": "Learning",
    "myCourses": "My Courses",
    "allCourses": "All Courses",
    "browse": "Browse Courses",
    "enroll": "Enroll",
    "continue": "Continue Learning",
    "completed": "Completed",
    "inProgress": "In Progress",
    "lessons": "Lessons",
    "duration": "Duration",
    "minutes": "minutes",
    "progress": "Progress",
    "certificate": "Certificate"
  },
  "gallery": {
    "title": "Media Gallery",
    "albums": "Albums",
    "photos": "Photos",
    "videos": "Videos",
    "upload": "Upload Media",
    "createAlbum": "Create Album",
    "viewAlbum": "View Album",
    "category": {
      "PROJECT_PROGRESS": "Project Progress",
      "EVENTS": "Events",
      "SANCTUARY_NATURE": "Sanctuary & Nature",
      "CONSTRUCTION": "Construction",
      "COMMUNITY": "Community",
      "AERIAL": "Aerial"
    },
    "type": {
      "PHOTO": "Photo",
      "VIDEO": "Video",
      "DRONE_FOOTAGE": "Drone Footage",
      "TIMELAPSE": "Timelapse"
    }
  },
  "map": {
    "title": "Interactive Map",
    "legend": "Legend",
    "addLocation": "Add Location",
    "editLocation": "Edit Location",
    "locationName": "Location Name",
    "coordinates": "Coordinates",
    "type": {
      "FACILITY": "Facility",
      "DEVELOPMENT_ZONE": "Development Zone",
      "POINT_OF_INTEREST": "Point of Interest",
      "NATURAL_FEATURE": "Natural Feature",
      "INFRASTRUCTURE": "Infrastructure"
    },
    "status": {
      "PLANNED": "Planned",
      "IN_PROGRESS": "In Progress",
      "COMPLETED": "Completed",
      "OPERATIONAL": "Operational"
    }
  },
  "sacredLedger": {
    "title": "Sacred Ledger",
    "logHours": "Log Hours",
    "myContributions": "My Contributions",
    "totalHours": "Total Hours",
    "totalEquity": "Total Equity Units",
    "pending": "Pending Approval",
    "approved": "Approved",
    "rejected": "Rejected",
    "hours": "Hours",
    "description": "Description",
    "category": "Category",
    "status": "Status",
    "approvedBy": "Approved By",
    "approvedAt": "Approved At"
  },
  "profile": {
    "title": "Profile",
    "editProfile": "Edit Profile",
    "personalInfo": "Personal Information",
    "name": "Name",
    "email": "Email",
    "phone": "Phone",
    "location": "Location",
    "bio": "Bio",
    "timezone": "Timezone",
    "language": "Language",
    "changePassword": "Change Password",
    "currentPassword": "Current Password",
    "newPassword": "New Password",
    "confirmPassword": "Confirm Password",
    "saveChanges": "Save Changes",
    "changesSaved": "Changes saved successfully"
  },
  "subscriptions": {
    "title": "Subscription",
    "currentPlan": "Current Plan",
    "upgradePlan": "Upgrade Plan",
    "manageBilling": "Manage Billing",
    "tier": {
      "FREE": "Free",
      "BASIC": "Basic",
      "PREMIUM": "Premium",
      "PLATINUM": "Platinum"
    },
    "status": {
      "ACTIVE": "Active",
      "INACTIVE": "Inactive",
      "PAST_DUE": "Past Due",
      "CANCELLED": "Cancelled"
    }
  },
  "announcements": {
    "title": "Announcements",
    "viewAll": "View All Announcements",
    "priority": {
      "URGENT": "Urgent",
      "IMPORTANT": "Important",
      "INFO": "Info"
    }
  },
  "validation": {
    "required": "This field is required",
    "emailInvalid": "Please enter a valid email",
    "passwordTooShort": "Password must be at least 8 characters",
    "passwordMismatch": "Passwords do not match",
    "phoneInvalid": "Please enter a valid phone number",
    "urlInvalid": "Please enter a valid URL"
  },
  "errors": {
    "generic": "An error occurred. Please try again.",
    "network": "Network error. Please check your connection.",
    "unauthorized": "You are not authorized to perform this action.",
    "notFound": "The requested resource was not found.",
    "serverError": "Server error. Please try again later."
  },
  "dates": {
    "today": "Today",
    "yesterday": "Yesterday",
    "tomorrow": "Tomorrow",
    "thisWeek": "This Week",
    "thisMonth": "This Month",
    "lastMonth": "Last Month",
    "custom": "Custom Range"
  },
  "pagination": {
    "previous": "Previous",
    "next": "Next",
    "page": "Page",
    "of": "of",
    "showing": "Showing {from} to {to} of {total} results"
  }
}
```

**Spanish Translation (messages/es.json):**
```json
{
  "common": {
    "appName": "BRITE POOL",
    "appTagline": "Ministerio de Empoderamiento",
    "loading": "Cargando...",
    "save": "Guardar",
    "cancel": "Cancelar",
    "delete": "Eliminar",
    "edit": "Editar",
    "submit": "Enviar",
    "close": "Cerrar",
    "search": "Buscar",
    "filter": "Filtrar",
    "download": "Descargar",
    "upload": "Subir"
  },
  "navigation": {
    "home": "Inicio",
    "dashboard": "Panel",
    "events": "Eventos",
    "committees": "Comités",
    "learning": "Aprendizaje",
    "gallery": "Galería",
    "map": "Mapa",
    "profile": "Perfil",
    "settings": "Configuración",
    "logout": "Cerrar Sesión"
  },
  "auth": {
    "login": "Iniciar Sesión",
    "register": "Registrarse",
    "logout": "Cerrar Sesión",
    "email": "Correo Electrónico",
    "password": "Contraseña",
    "confirmPassword": "Confirmar Contraseña",
    "forgotPassword": "¿Olvidó su Contraseña?",
    "resetPassword": "Restablecer Contraseña",
    "name": "Nombre Completo",
    "loginTitle": "Bienvenido de Nuevo",
    "registerTitle": "Únete a BRITE POOL",
    "loginSuccess": "Inicio de sesión exitoso",
    "loginError": "Correo o contraseña inválidos",
    "registerSuccess": "Cuenta creada exitosamente",
    "alreadyHaveAccount": "¿Ya tiene una cuenta?",
    "dontHaveAccount": "¿No tiene una cuenta?"
  },
  "contract": {
    "title": "Acuerdo de Membresía",
    "subtitle": "Revisar y Aceptar",
    "scrollToEnable": "Por favor, desplácese hasta el final para habilitar la aceptación",
    "agreeCheckbox": "He leído y acepto los términos anteriores",
    "acceptButton": "Aceptar Contrato",
    "downloadPdf": "Descargar PDF",
    "processing": "Procesando...",
    "mustAccept": "Debe aceptar el acuerdo de membresía para continuar",
    "newVersion": "Una nueva versión del acuerdo de membresía está disponible",
    "versionLabel": "Versión {version}",
    "publishedOn": "Publicado el {date}"
  },
  "dashboard": {
    "welcome": "Bienvenido, {name}",
    "quickActions": "Acciones Rápidas",
    "upcomingEvents": "Próximos Eventos",
    "myCommittees": "Mis Comités",
    "recentActivity": "Actividad Reciente",
    "participationHours": "Horas de Participación",
    "equityUnits": "Unidades de Patrimonio",
    "viewAll": "Ver Todo",
    "noData": "No hay datos disponibles"
  },
  "events": {
    "title": "Eventos",
    "upcoming": "Próximos Eventos",
    "past": "Eventos Pasados",
    "myEvents": "Mis Eventos",
    "createEvent": "Crear Evento",
    "editEvent": "Editar Evento",
    "eventName": "Nombre del Evento",
    "eventDescription": "Descripción",
    "startTime": "Hora de Inicio",
    "endTime": "Hora de Finalización",
    "location": "Ubicación",
    "virtualLink": "Enlace Virtual",
    "capacity": "Capacidad",
    "register": "Registrarse",
    "unregister": "Cancelar Registro",
    "registered": "Registrado",
    "waitlisted": "En Lista de Espera",
    "full": "Evento Lleno",
    "type": {
      "COMMITTEE_MEETING": "Reunión de Comité",
      "WORKSHOP": "Taller",
      "SANCTUARY_EVENT": "Evento del Santuario",
      "VIRTUAL_WEBINAR": "Seminario Web Virtual"
    }
  },
  "committees": {
    "title": "Comités",
    "myCommittees": "Mis Comités",
    "allCommittees": "Todos los Comités",
    "join": "Unirse al Comité",
    "leave": "Dejar Comité",
    "members": "Miembros",
    "tasks": "Tareas",
    "description": "Descripción",
    "type": {
      "GOVERNANCE": "Gobernanza",
      "WEALTH": "Riqueza",
      "EDUCATION": "Educación",
      "HEALTH": "Salud",
      "OPERATIONS": "Operaciones"
    }
  },
  "learning": {
    "title": "Aprendizaje",
    "myCourses": "Mis Cursos",
    "allCourses": "Todos los Cursos",
    "browse": "Explorar Cursos",
    "enroll": "Inscribirse",
    "continue": "Continuar Aprendiendo",
    "completed": "Completado",
    "inProgress": "En Progreso",
    "lessons": "Lecciones",
    "duration": "Duración",
    "minutes": "minutos",
    "progress": "Progreso",
    "certificate": "Certificado"
  },
  "gallery": {
    "title": "Galería de Medios",
    "albums": "Álbumes",
    "photos": "Fotos",
    "videos": "Videos",
    "upload": "Subir Medios",
    "createAlbum": "Crear Álbum",
    "viewAlbum": "Ver Álbum",
    "category": {
      "PROJECT_PROGRESS": "Progreso del Proyecto",
      "EVENTS": "Eventos",
      "SANCTUARY_NATURE": "Santuario y Naturaleza",
      "CONSTRUCTION": "Construcción",
      "COMMUNITY": "Comunidad",
      "AERIAL": "Aéreo"
    },
    "type": {
      "PHOTO": "Foto",
      "VIDEO": "Video",
      "DRONE_FOOTAGE": "Metraje de Dron",
      "TIMELAPSE": "Timelapse"
    }
  },
  "map": {
    "title": "Mapa Interactivo",
    "legend": "Leyenda",
    "addLocation": "Agregar Ubicación",
    "editLocation": "Editar Ubicación",
    "locationName": "Nombre de Ubicación",
    "coordinates": "Coordenadas",
    "type": {
      "FACILITY": "Instalación",
      "DEVELOPMENT_ZONE": "Zona de Desarrollo",
      "POINT_OF_INTEREST": "Punto de Interés",
      "NATURAL_FEATURE": "Característica Natural",
      "INFRASTRUCTURE": "Infraestructura"
    },
    "status": {
      "PLANNED": "Planificado",
      "IN_PROGRESS": "En Progreso",
      "COMPLETED": "Completado",
      "OPERATIONAL": "Operacional"
    }
  },
  "sacredLedger": {
    "title": "Libro Sagrado",
    "logHours": "Registrar Horas",
    "myContributions": "Mis Contribuciones",
    "totalHours": "Total de Horas",
    "totalEquity": "Total de Unidades de Patrimonio",
    "pending": "Pendiente de Aprobación",
    "approved": "Aprobado",
    "rejected": "Rechazado",
    "hours": "Horas",
    "description": "Descripción",
    "category": "Categoría",
    "status": "Estado",
    "approvedBy": "Aprobado Por",
    "approvedAt": "Aprobado El"
  },
  "profile": {
    "title": "Perfil",
    "editProfile": "Editar Perfil",
    "personalInfo": "Información Personal",
    "name": "Nombre",
    "email": "Correo Electrónico",
    "phone": "Teléfono",
    "location": "Ubicación",
    "bio": "Biografía",
    "timezone": "Zona Horaria",
    "language": "Idioma",
    "changePassword": "Cambiar Contraseña",
    "currentPassword": "Contraseña Actual",
    "newPassword": "Nueva Contraseña",
    "confirmPassword": "Confirmar Contraseña",
    "saveChanges": "Guardar Cambios",
    "changesSaved": "Cambios guardados exitosamente"
  },
  "subscriptions": {
    "title": "Suscripción",
    "currentPlan": "Plan Actual",
    "upgradePlan": "Actualizar Plan",
    "manageBilling": "Administrar Facturación",
    "tier": {
      "FREE": "Gratis",
      "BASIC": "Básico",
      "PREMIUM": "Premium",
      "PLATINUM": "Platino"
    },
    "status": {
      "ACTIVE": "Activo",
      "INACTIVE": "Inactivo",
      "PAST_DUE": "Vencido",
      "CANCELLED": "Cancelado"
    }
  },
  "announcements": {
    "title": "Anuncios",
    "viewAll": "Ver Todos los Anuncios",
    "priority": {
      "URGENT": "Urgente",
      "IMPORTANT": "Importante",
      "INFO": "Información"
    }
  },
  "validation": {
    "required": "Este campo es obligatorio",
    "emailInvalid": "Por favor ingrese un correo electrónico válido",
    "passwordTooShort": "La contraseña debe tener al menos 8 caracteres",
    "passwordMismatch": "Las contraseñas no coinciden",
    "phoneInvalid": "Por favor ingrese un número de teléfono válido",
    "urlInvalid": "Por favor ingrese una URL válida"
  },
  "errors": {
    "generic": "Ocurrió un error. Por favor intente de nuevo.",
    "network": "Error de red. Por favor verifique su conexión.",
    "unauthorized": "No está autorizado para realizar esta acción.",
    "notFound": "El recurso solicitado no fue encontrado.",
    "serverError": "Error del servidor. Por favor intente más tarde."
  },
  "dates": {
    "today": "Hoy",
    "yesterday": "Ayer",
    "tomorrow": "Mañana",
    "thisWeek": "Esta Semana",
    "thisMonth": "Este Mes",
    "lastMonth": "Mes Pasado",
    "custom": "Rango Personalizado"
  },
  "pagination": {
    "previous": "Anterior",
    "next": "Siguiente",
    "page": "Página",
    "of": "de",
    "showing": "Mostrando {from} a {to} de {total} resultados"
  }
}
```

### Translation Keys Best Practices

1. **Namespacing:** Use dot notation for organization (`auth.login`, `dashboard.welcome`)
2. **Consistency:** Keep key names consistent across locales
3. **Variables:** Use ICU MessageFormat for dynamic values (`{name}`, `{count}`)
4. **Pluralization:** Use next-intl's built-in plural support
5. **No HTML:** Keep HTML out of translation strings (use components)

---

## Implementation Details

### Phase 1: Core Setup (Days 1-2)

**1.1 Install Dependencies**
```bash
npm install next-intl
```

**1.2 Create i18n Configuration**

**File: `i18n/routing.ts`**
```typescript
import { defineRouting } from 'next-intl/routing';
import { createSharedPathnamesNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  // All locales supported
  locales: ['en', 'es'],

  // Default locale
  defaultLocale: 'en',

  // Locale prefix strategy
  localePrefix: 'as-needed' // /en/path or /path (en) vs /es/path
});

// Lightweight wrappers around Next.js navigation APIs
export const { Link, redirect, usePathname, useRouter } =
  createSharedPathnamesNavigation(routing);
```

**File: `i18n/request.ts`**
```typescript
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  // Validate locale from request
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default
  };
});
```

**1.3 Update Next.js Config**

**File: `next.config.js`**
```javascript
const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

module.exports = withNextIntl(nextConfig);
```

**1.4 Create Middleware**

**File: `middleware.ts`**
```typescript
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Match all pathnames except for
  // - … if they start with `/api`, `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
```

**1.5 Update Root Layout**

**File: `app/[locale]/layout.tsx`**
```typescript
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import './globals.css';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function RootLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  // Ensure valid locale
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  // Load messages for current locale
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

### Phase 2: Translation Files (Days 2-3)

**2.1 Create Base Translation Files**
- Create `messages/en.json` (full English translations)
- Create `messages/es.json` (full Spanish translations)
- Create `messages/README.md` (translation guide)

**2.2 Translation File Management**

**File: `messages/README.md`**
```markdown
# BRITE POOL Translation Guide

## Overview
This directory contains all translation files for the BRITE POOL platform.

## Supported Languages
- English (en) - Default
- Spanish (es) - Costa Rica locale

## File Structure
- `en.json` - English translations
- `es.json` - Spanish translations

## Adding New Translations

1. Add the key to `en.json` in the appropriate namespace
2. Add the corresponding Spanish translation to `es.json`
3. Use the key in your component via `useTranslations()`

## Translation Variables

Use ICU MessageFormat for dynamic content:
```json
{
  "welcome": "Welcome, {name}",
  "itemCount": "You have {count, plural, =0 {no items} =1 {one item} other {# items}}"
}
```

## Important Notes
- Keep keys consistent across all language files
- Use lowercase for keys (camelCase)
- Organize by namespace (domain/feature)
- No HTML in translation strings
- Keep translations culturally appropriate
```

### Phase 3: UI Components (Days 3-5)

**3.1 Language Switcher Component**

**File: `components/LanguageSwitcher.tsx`**
```typescript
'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';
import { useState, useTransition } from 'react';

export default function LanguageSwitcher() {
  const t = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇨🇷' }
  ];

  const handleLanguageChange = (newLocale: string) => {
    startTransition(() => {
      router.replace(pathname, { locale: newLocale });
    });
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isPending}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-stone-warm transition-colors"
        aria-label="Change language"
      >
        <span className="text-xl">
          {languages.find(lang => lang.code === locale)?.flag}
        </span>
        <span className="text-sm font-medium text-earth-dark">
          {languages.find(lang => lang.code === locale)?.code.toUpperCase()}
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-stone z-20">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-stone-warm transition-colors first:rounded-t-lg last:rounded-b-lg ${
                  locale === lang.code ? 'bg-sage/10' : ''
                }`}
              >
                <span className="text-2xl">{lang.flag}</span>
                <span className="text-sm font-medium text-earth-dark">
                  {lang.name}
                </span>
                {locale === lang.code && (
                  <svg
                    className="w-5 h-5 ml-auto text-sage"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
```

**3.2 Update Navigation Component**

**File: `components/Navbar.tsx` (Example)**
```typescript
'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import LanguageSwitcher from './LanguageSwitcher';

export default function Navbar() {
  const t = useTranslations('navigation');

  return (
    <nav className="bg-white border-b border-stone">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="font-serif text-xl text-earth-brown">
              BRITE POOL
            </Link>

            <div className="hidden md:flex items-center gap-6">
              <Link href="/dashboard" className="nav-link">
                {t('dashboard')}
              </Link>
              <Link href="/events" className="nav-link">
                {t('events')}
              </Link>
              <Link href="/committees" className="nav-link">
                {t('committees')}
              </Link>
              <Link href="/learning" className="nav-link">
                {t('learning')}
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <Link href="/profile" className="btn-secondary">
              {t('profile')}
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
```

**3.3 Usage in Pages**

**Server Components:**
```typescript
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';

export default async function DashboardPage() {
  const t = await getTranslations('dashboard');

  return (
    <div>
      <h1>{t('welcome', { name: 'John' })}</h1>
      <p>{t('quickActions')}</p>
    </div>
  );
}

// For metadata
export async function generateMetadata({ params: { locale } }) {
  const t = await getTranslations({ locale, namespace: 'dashboard' });

  return {
    title: t('title')
  };
}
```

**Client Components:**
```typescript
'use client';

import { useTranslations } from 'next-intl';

export default function EventCard() {
  const t = useTranslations('events');

  return (
    <div>
      <h3>{t('eventName')}</h3>
      <button>{t('register')}</button>
    </div>
  );
}
```

### Phase 4: Locale-Specific Formatting (Day 5)

**4.1 Date Formatting**

```typescript
import { useFormatter } from 'next-intl';

export default function EventDate({ date }: { date: Date }) {
  const format = useFormatter();

  return (
    <div>
      {/* Full date and time for Costa Rica */}
      <p>{format.dateTime(date, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        timeZone: 'America/Costa_Rica'
      })}</p>

      {/* Relative time */}
      <p>{format.relativeTime(date)}</p>
    </div>
  );
}
```

**4.2 Number Formatting**

```typescript
import { useFormatter } from 'next-intl';

export default function ParticipationStats({ hours, equity }: any) {
  const format = useFormatter();

  return (
    <div>
      {/* Number formatting for Costa Rica (es-CR) */}
      <p>Hours: {format.number(hours, { maximumFractionDigits: 2 })}</p>

      {/* Currency formatting (Costa Rican Colón) */}
      <p>Value: {format.number(equity, {
        style: 'currency',
        currency: 'CRC'
      })}</p>
    </div>
  );
}
```

**4.3 List Formatting**

```typescript
import { useFormatter } from 'next-intl';

export default function CommitteeMembers({ members }: any) {
  const format = useFormatter();

  return (
    <div>
      <p>{format.list(members, { type: 'conjunction' })}</p>
      {/* English: "Alice, Bob, and Charlie" */}
      {/* Spanish: "Alice, Bob y Charlie" */}
    </div>
  );
}
```

**4.4 Create Formatting Utilities**

**File: `lib/i18n/formatters.ts`**
```typescript
import { Formats } from 'next-intl';

export const formats: Formats = {
  dateTime: {
    short: {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    },
    medium: {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    },
    long: {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      weekday: 'long'
    },
    full: {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      weekday: 'long',
      hour: 'numeric',
      minute: 'numeric',
      timeZone: 'America/Costa_Rica'
    }
  },
  number: {
    precise: {
      maximumFractionDigits: 2
    },
    currency: {
      style: 'currency',
      currency: 'CRC',
      currencyDisplay: 'symbol'
    },
    percent: {
      style: 'percent',
      maximumFractionDigits: 1
    }
  }
};
```

**Update `i18n/request.ts`:**
```typescript
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';
import { formats } from '@/lib/i18n/formatters';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
    formats,
    timeZone: 'America/Costa_Rica'
  };
});
```

### Phase 5: Database Schema Update (Day 6)

**5.1 Update User Preference**

The `language` field already exists in `UserProfile.language` (defaulting to 'en'). No schema changes needed, but ensure it's used:

```typescript
// In profile update API
await prisma.userProfile.update({
  where: { userId },
  data: {
    language: newLocale // 'en' or 'es'
  }
});
```

**5.2 Locale Detection from User Profile**

**Update `middleware.ts`:**
```typescript
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { NextRequest } from 'next/server';

export default async function middleware(request: NextRequest) {
  // Check if user has locale preference in cookie or database
  // This is handled by next-intl automatically via cookie

  const handleI18nRouting = createMiddleware(routing);
  const response = handleI18nRouting(request);

  return response;
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
```

### Phase 6: Translation Workflow (Day 7)

**6.1 Translation Management Script**

**File: `scripts/check-translations.js`**
```javascript
const fs = require('fs');
const path = require('path');

const enFile = path.join(__dirname, '../messages/en.json');
const esFile = path.join(__dirname, '../messages/es.json');

const en = JSON.parse(fs.readFileSync(enFile, 'utf8'));
const es = JSON.parse(fs.readFileSync(esFile, 'utf8'));

function flattenObject(obj, prefix = '') {
  return Object.keys(obj).reduce((acc, key) => {
    const value = obj[key];
    const newKey = prefix ? `${prefix}.${key}` : key;

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      Object.assign(acc, flattenObject(value, newKey));
    } else {
      acc[newKey] = value;
    }

    return acc;
  }, {});
}

const enFlat = flattenObject(en);
const esFlat = flattenObject(es);

const enKeys = Object.keys(enFlat);
const esKeys = Object.keys(esFlat);

// Check for missing translations
const missingInSpanish = enKeys.filter(key => !esKeys.includes(key));
const missingInEnglish = esKeys.filter(key => !enKeys.includes(key));

console.log('\n=== Translation Check ===\n');

if (missingInSpanish.length > 0) {
  console.log('❌ Missing in Spanish (es.json):');
  missingInSpanish.forEach(key => console.log(`  - ${key}`));
  console.log('');
}

if (missingInEnglish.length > 0) {
  console.log('❌ Missing in English (en.json):');
  missingInEnglish.forEach(key => console.log(`  - ${key}`));
  console.log('');
}

if (missingInSpanish.length === 0 && missingInEnglish.length === 0) {
  console.log('✅ All translations are in sync!');
  console.log(`Total keys: ${enKeys.length}`);
}

process.exit(missingInSpanish.length > 0 || missingInEnglish.length > 0 ? 1 : 0);
```

**Add to package.json:**
```json
{
  "scripts": {
    "check-translations": "node scripts/check-translations.js"
  }
}
```

**6.2 Translation Workflow Guidelines**

**For Developers:**
1. Add new English translation to `messages/en.json`
2. Use translation key in component
3. Run `npm run check-translations` to see missing Spanish translations
4. Either translate yourself or create ticket for translator

**For Translators:**
1. Run `npm run check-translations` to see missing translations
2. Add Spanish translations to `messages/es.json`
3. Verify translation in context by switching language in app
4. Submit PR with completed translations

---

## UI Components

### LanguageSwitcher Component Variations

**Dropdown Version (Default):**
See Phase 3.1 above

**Toggle Version (Alternative):**
```typescript
'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';
import { useTransition } from 'react';

export default function LanguageToggle() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const toggleLanguage = () => {
    const newLocale = locale === 'en' ? 'es' : 'en';
    startTransition(() => {
      router.replace(pathname, { locale: newLocale });
    });
  };

  return (
    <button
      onClick={toggleLanguage}
      disabled={isPending}
      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-stone-warm hover:bg-stone transition-colors"
      aria-label="Toggle language"
    >
      <span className="text-sm font-medium">
        {locale === 'en' ? '🇺🇸 EN' : '🇨🇷 ES'}
      </span>
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    </button>
  );
}
```

### Footer Language Links

```typescript
import { Link } from '@/i18n/routing';
import { getLocale } from 'next-intl/server';

export default async function Footer() {
  const locale = await getLocale();

  return (
    <footer className="bg-earth-dark text-white py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center">
          <p>&copy; 2025 BRITE POOL</p>
          <div className="flex gap-4">
            <Link
              href="/"
              locale="en"
              className={locale === 'en' ? 'font-bold' : ''}
            >
              English
            </Link>
            <Link
              href="/"
              locale="es"
              className={locale === 'es' ? 'font-bold' : ''}
            >
              Español
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
```

---

## Locale-Specific Formatting

### Costa Rica Specific Settings

**Timezone:** `America/Costa_Rica` (UTC-6)
**Currency:** Costa Rican Colón (CRC / ₡)
**Date Format:** DD/MM/YYYY (Spanish)
**Number Format:** 1.234,56 (Spanish uses comma for decimals)

### Complete Formatting Examples

**File: `components/FormattingExamples.tsx`**
```typescript
import { useFormatter, useLocale } from 'next-intl';

export default function FormattingExamples() {
  const format = useFormatter();
  const locale = useLocale();

  const now = new Date();
  const amount = 1234567.89;
  const participants = ['María', 'José', 'Carmen'];

  return (
    <div className="space-y-4">
      {/* Dates */}
      <div>
        <h3>Date Formatting</h3>
        <p>Short: {format.dateTime(now, 'short')}</p>
        <p>Medium: {format.dateTime(now, 'medium')}</p>
        <p>Long: {format.dateTime(now, 'long')}</p>
        <p>Relative: {format.relativeTime(now)}</p>
      </div>

      {/* Numbers */}
      <div>
        <h3>Number Formatting</h3>
        <p>Plain: {format.number(amount)}</p>
        <p>Precise: {format.number(amount, 'precise')}</p>
        <p>Currency: {format.number(amount, 'currency')}</p>
        <p>Percent: {format.number(0.456, 'percent')}</p>
      </div>

      {/* Lists */}
      <div>
        <h3>List Formatting</h3>
        <p>Conjunction: {format.list(participants, { type: 'conjunction' })}</p>
        <p>Disjunction: {format.list(participants, { type: 'disjunction' })}</p>
      </div>
    </div>
  );
}
```

---

## Translation Workflow

### Process Overview

1. **Development Phase:**
   - Developer adds new feature with English text
   - Developer extracts all strings to `messages/en.json`
   - Developer uses `useTranslations()` in components
   - Developer runs `npm run check-translations`

2. **Translation Phase:**
   - Translator reviews missing keys (from script output)
   - Translator adds Spanish translations to `messages/es.json`
   - Translator tests in-context by switching language
   - Translator commits translations

3. **Review Phase:**
   - Code review ensures no hardcoded strings
   - Native Spanish speaker reviews translations
   - QA tests both languages for layout issues

4. **Deployment:**
   - Both language files deployed together
   - Users can switch language immediately
   - No app restart required

### Translation Guidelines

**For English (en):**
- Use clear, professional language
- Keep it concise (UI space is limited)
- Use active voice
- Be consistent with terminology

**For Spanish (es):**
- Use Costa Rican Spanish conventions
- Use formal "usted" for general interface
- Use informal "tú" only for personal messages
- Keep technical terms (like "dashboard") when commonly used
- Translate action words consistently:
  - "Save" → "Guardar"
  - "Cancel" → "Cancelar"
  - "Delete" → "Eliminar"
  - "Edit" → "Editar"

### Common Translation Pitfalls

**❌ Don't:**
```json
{
  "message": "Click <a href='/help'>here</a> for help"
}
```

**✅ Do:**
```json
{
  "messagePrefix": "Click",
  "messageLink": "here",
  "messageSuffix": "for help"
}
```
```tsx
<p>
  {t('messagePrefix')}{' '}
  <a href="/help">{t('messageLink')}</a>{' '}
  {t('messageSuffix')}
</p>
```

**❌ Don't:**
```json
{
  "welcome": "Welcome back, user!"
}
```

**✅ Do:**
```json
{
  "welcome": "Welcome back, {name}!"
}
```

---

## Testing Requirements

### Unit Tests

**Test Translation Loading:**
```typescript
// __tests__/i18n.test.ts
import { routing } from '@/i18n/routing';

describe('i18n Configuration', () => {
  it('should have correct locales', () => {
    expect(routing.locales).toEqual(['en', 'es']);
  });

  it('should have correct default locale', () => {
    expect(routing.defaultLocale).toBe('en');
  });
});
```

**Test Translation Files:**
```typescript
// __tests__/translations.test.ts
import en from '@/messages/en.json';
import es from '@/messages/es.json';

describe('Translation Files', () => {
  it('should have matching keys', () => {
    const enKeys = Object.keys(en).sort();
    const esKeys = Object.keys(es).sort();

    expect(enKeys).toEqual(esKeys);
  });

  it('should have no empty values', () => {
    const checkEmpty = (obj: any, path = '') => {
      Object.entries(obj).forEach(([key, value]) => {
        const currentPath = path ? `${path}.${key}` : key;

        if (typeof value === 'object') {
          checkEmpty(value, currentPath);
        } else if (!value || value === '') {
          throw new Error(`Empty translation at: ${currentPath}`);
        }
      });
    };

    expect(() => checkEmpty(en)).not.toThrow();
    expect(() => checkEmpty(es)).not.toThrow();
  });
});
```

### Integration Tests

**Test Language Switching:**
```typescript
// __tests__/language-switcher.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import LanguageSwitcher from '@/components/LanguageSwitcher';

jest.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: () => (key: string) => key,
}));

jest.mock('@/i18n/routing', () => ({
  useRouter: () => ({
    replace: jest.fn()
  }),
  usePathname: () => '/dashboard'
}));

describe('LanguageSwitcher', () => {
  it('renders current language', () => {
    render(<LanguageSwitcher />);
    expect(screen.getByText(/EN/i)).toBeInTheDocument();
  });

  it('opens dropdown on click', () => {
    render(<LanguageSwitcher />);
    const button = screen.getByLabelText('Change language');
    fireEvent.click(button);

    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getByText('Español')).toBeInTheDocument();
  });
});
```

### Manual Testing Checklist

**Language Switching:**
- [ ] Language switcher visible in header
- [ ] Clicking switcher shows both language options
- [ ] Switching to Spanish updates all visible text
- [ ] Switching to English updates all visible text
- [ ] Language preference persists after page reload
- [ ] Language preference persists after logout/login

**Locale Detection:**
- [ ] Browser with Spanish locale defaults to Spanish
- [ ] Browser with English locale defaults to English
- [ ] Direct URL navigation to `/es/...` shows Spanish
- [ ] Direct URL navigation to `/en/...` shows English

**Formatting:**
- [ ] Dates display correctly for Costa Rica timezone
- [ ] Numbers use correct decimal separator (, vs .)
- [ ] Currency displays as Costa Rican Colón (₡)
- [ ] Lists use correct conjunctions ("y" vs "and")
- [ ] Relative times work in both languages

**Layout:**
- [ ] No text overflow when switching languages
- [ ] No broken layouts due to longer Spanish text
- [ ] All buttons remain accessible
- [ ] All forms display correctly
- [ ] Mobile responsive in both languages

**Content:**
- [ ] All pages have translations (no English fallback visible)
- [ ] All error messages translated
- [ ] All form validation messages translated
- [ ] All tooltips translated
- [ ] All modal dialogs translated

---

## Deployment Checklist

### Pre-Deployment

- [ ] Install next-intl: `npm install next-intl`
- [ ] Create i18n configuration files
- [ ] Update Next.js config with next-intl plugin
- [ ] Create middleware for locale detection
- [ ] Update app structure to use `[locale]` segment
- [ ] Create complete English translations
- [ ] Create complete Spanish translations
- [ ] Run translation check script (all passing)
- [ ] Update all components to use `useTranslations()`
- [ ] Remove all hardcoded strings
- [ ] Test language switching thoroughly
- [ ] Test locale-specific formatting
- [ ] Test on mobile devices
- [ ] Test with screen readers (accessibility)

### Environment Variables

No additional environment variables needed for next-intl.

### Build & Deploy

1. **Build Test:**
   ```bash
   npm run check-translations
   npm run build
   ```

2. **Verify Build Output:**
   - Check that both locale routes are generated
   - Verify translation files are included in build

3. **Deploy:**
   ```bash
   # Deploy to production
   git push origin main
   ```

4. **Post-Deploy Verification:**
   - [ ] Visit `/en` route - displays English
   - [ ] Visit `/es` route - displays Spanish
   - [ ] Language switcher works
   - [ ] Locale detection from browser works
   - [ ] Cookie persistence works
   - [ ] All formatting correct

### Monitoring

Monitor for:
- Missing translation errors in logs
- Locale detection failures
- Cookie persistence issues
- Performance impact of translation loading

---

## Performance Considerations

### Optimization Strategies

1. **Translation File Size:**
   - Keep translation files under 100KB each
   - Split large namespaces if needed
   - Remove unused translations periodically

2. **Client Bundle:**
   - next-intl only bundles messages for active locale
   - Switching languages triggers new bundle load (acceptable)
   - Use dynamic imports for large feature-specific translations

3. **Caching:**
   - Translation files are cached by Next.js build process
   - Cookie-based locale persistence (no DB lookup needed)
   - Middleware is lightweight (minimal performance impact)

4. **Loading States:**
   - Use loading indicators when switching languages
   - Implement Suspense boundaries for async components
   - Pre-fetch alternate locale on hover (optional optimization)

---

## Future Enhancements

1. **Additional Languages:**
   - French (Haitian community)
   - Portuguese (Brazilian community)
   - Indigenous languages (Bribri, Cabécar)

2. **Advanced Features:**
   - Crowdsourced translation platform
   - Translation memory/glossary
   - Automated translation suggestions (AI-powered)
   - In-context editing for translators

3. **Localization:**
   - Region-specific content (Costa Rica vs other regions)
   - Currency conversion based on user location
   - Distance units (km vs miles)
   - Temperature units (C vs F)

4. **Accessibility:**
   - Screen reader language switching
   - Language-specific voice commands
   - Sign language video translations

---

## Appendix

### Useful Resources

**next-intl Documentation:**
- https://next-intl-docs.vercel.app/

**ICU MessageFormat:**
- https://unicode-org.github.io/icu/userguide/format_parse/messages/

**Costa Rica Locale Info:**
- Locale code: es-CR
- Timezone: America/Costa_Rica (CST, UTC-6)
- Currency: CRC (Costa Rican Colón)
- Date format: DD/MM/YYYY

### Translation Key Naming Conventions

```
{domain}.{feature}.{element}.{property}

Examples:
- auth.login.button.submit
- dashboard.events.card.title
- common.actions.save
- errors.validation.emailInvalid
```

### Common Spanish Translations Reference

| English | Spanish (Costa Rica) |
|---------|----------------------|
| Dashboard | Panel / Tablero |
| Settings | Configuración |
| Profile | Perfil |
| Save | Guardar |
| Cancel | Cancelar |
| Delete | Eliminar |
| Edit | Editar |
| Submit | Enviar |
| Search | Buscar |
| Filter | Filtrar |
| Loading | Cargando |
| Error | Error |
| Success | Éxito |
| Welcome | Bienvenido |
| Logout | Cerrar Sesión |
| Login | Iniciar Sesión |
| Register | Registrarse |

---

**Spec Complete** ✅

Next step: Begin implementation starting with Phase 1 (Core Setup).
