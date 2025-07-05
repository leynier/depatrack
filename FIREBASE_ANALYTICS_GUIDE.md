# Firebase Analytics - Guía de Uso

## 📊 Configuración Completada

Firebase Analytics ha sido configurado e integrado en tu proyecto. Aquí tienes todo lo que necesitas saber para usarlo efectivamente.

## 🔧 Configuración Requerida

### 1. Variables de Entorno

Asegúrate de que tu archivo `.env` o `.env.local` contenga:

```env
VITE_FIREBASE_API_KEY=tu-api-key
VITE_FIREBASE_AUTH_DOMAIN=tu-auth-domain
VITE_FIREBASE_PROJECT_ID=tu-project-id
VITE_FIREBASE_STORAGE_BUCKET=tu-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=tu-messaging-sender-id
VITE_FIREBASE_APP_ID=tu-app-id
VITE_FIREBASE_MEASUREMENT_ID=tu-measurement-id  # ← NECESARIO para Analytics
```

### 2. Obtener el Measurement ID

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Ve a **Analytics** > **Configuración**
4. Copia el **Measurement ID** (formato: G-XXXXXXXXXX)

## 🚀 Uso en Componentes Vue

### Ejemplo Básico

```vue
<template>
  <div>
    <button @click="handleLogin">Iniciar Sesión</button>
    <button @click="handleSearch">Buscar</button>
    <button @click="handlePropertyCreate">Crear Propiedad</button>
  </div>
</template>

<script setup lang="ts">
import { useAnalytics } from '@/composables/useAnalytics'

const { track, trackAuth, trackProperty, trackInteraction } = useAnalytics()

const handleLogin = async () => {
  // Tu lógica de login aquí
  await authService.login()
  
  // Tracking del evento
  trackAuth.login('email')
}

const handleSearch = () => {
  const searchTerm = 'apartamento madrid'
  
  // Tu lógica de búsqueda aquí
  performSearch(searchTerm)
  
  // Tracking del evento
  trackInteraction.search(searchTerm)
}

const handlePropertyCreate = () => {
  // Tu lógica de creación aquí
  createProperty()
  
  // Tracking del evento
  trackProperty.created('apartment')
}
</script>
```

### Tracking de Errores

```vue
<script setup lang="ts">
import { useAnalytics } from '@/composables/useAnalytics'

const { trackInteraction } = useAnalytics()

const handleAsyncOperation = async () => {
  try {
    await someAsyncOperation()
  } catch (error) {
    // Tracking del error
    trackInteraction.error(error.message, 'property_creation')
  }
}
</script>
```

### Tracking de Performance

```vue
<script setup lang="ts">
import { useAnalytics } from '@/composables/useAnalytics'

const { trackTiming } = useAnalytics()

const handleDataLoad = async () => {
  const startTime = performance.now()
  
  await loadPropertyData()
  
  const loadTime = performance.now() - startTime
  trackTiming('data_load', loadTime, 'properties')
}
</script>
```

## 📈 Eventos Automáticos

### Tracking de Rutas

✅ **Ya configurado automáticamente** - Cada cambio de ruta se trackea automáticamente.

## 🔍 Integración con Servicios Existentes

### En AuthService

```typescript
// En src/services/auth.ts
import { analyticsService } from '@/services/analytics'

export class AuthService {
  async login(email: string, password: string) {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password)
      
      // Tracking del login exitoso
      analyticsService.trackLogin('email')
      analyticsService.setUserId(userCredential.user.uid)
      
      return this.mapFirebaseUser(userCredential.user)
    } catch (error) {
      // Tracking del error de login
      analyticsService.trackError('Login failed', error.code)
      throw error
    }
  }
}
```

### En PropertiesStore

```typescript
// En src/stores/properties.ts
import { analyticsService } from '@/services/analytics'

export const usePropertiesStore = defineStore('properties', () => {
  const createProperty = async (propertyData: CreatePropertyData) => {
    try {
      const property = await firestoreService.createProperty(propertyData)
      
      // Tracking de creación exitosa
      analyticsService.trackPropertyCreated(property.type)
      
      return property
    } catch (error) {
      // Tracking del error
      analyticsService.trackError('Property creation failed', 'properties_store')
      throw error
    }
  }
})
```

## 📊 Eventos Personalizados

### Eventos de Negocio

```typescript
import { analyticsService } from '@/services/analytics'

// Tracking de conversión
analyticsService.logEvent('conversion', {
  conversion_type: 'property_contact',
  property_id: 'prop123',
  value: 1
})

// Tracking de engagement
analyticsService.logEvent('engagement', {
  engagement_type: 'property_favorite',
  property_id: 'prop123',
  user_segment: 'premium'
})

// Tracking de feature usage
analyticsService.logEvent('feature_used', {
  feature_name: 'advanced_search',
  feature_category: 'search'
})
```

### Propiedades de Usuario

```typescript
import { analyticsService } from '@/services/analytics'

// Establecer propiedades del usuario
analyticsService.setUserProperties({
  user_type: 'premium',
  preferred_location: 'madrid',
  properties_owned: 5,
  signup_date: '2024-01-15'
})
```

## 🎯 Mejores Prácticas

### 1. Consistencia en Naming

```typescript
// ✅ Bueno - Nombres consistentes
analyticsService.logEvent('property_created', { property_type: 'apartment' })
analyticsService.logEvent('property_updated', { property_type: 'apartment' })
analyticsService.logEvent('property_deleted', { property_type: 'apartment' })

// ❌ Malo - Nombres inconsistentes
analyticsService.logEvent('prop_created', { type: 'apt' })
analyticsService.logEvent('property_edit', { propertyType: 'apartment' })
```

### 2. Parámetros Útiles

```typescript
// ✅ Bueno - Información contextual útil
analyticsService.logEvent('search_performed', {
  search_term: 'apartamento madrid',
  search_type: 'advanced',
  filters_applied: 3,
  results_count: 25,
  page_number: 1
})

// ❌ Malo - Información insuficiente
analyticsService.logEvent('search', {})
```

### 3. Evitar Información Sensible

```typescript
// ✅ Bueno - Sin información personal
analyticsService.logEvent('profile_updated', {
  fields_updated: ['name', 'preferences'],
  user_segment: 'premium'
})

// ❌ Malo - Información personal
analyticsService.logEvent('profile_updated', {
  name: 'Juan Pérez',
  email: 'juan@email.com',
  phone: '123456789'
})
```

## 🔧 Debugging y Testing

### Modo Debug

Para habilitar el modo debug en desarrollo:

```typescript
// En src/config/firebase.ts
import { getAnalytics } from 'firebase/analytics'

export const analytics = typeof window !== 'undefined' && firebaseConfig.measurementId 
  ? getAnalytics(app)
  : null

// Habilitar debug en desarrollo
if (import.meta.env.DEV && analytics) {
  // Esto te permitirá ver los eventos en tiempo real en Firebase Console
  console.log('Analytics initialized in debug mode')
}
```

### Verificar Eventos

1. Ve a Firebase Console
2. Analytics > Eventos
3. Busca tus eventos personalizados en "Eventos en tiempo real"

## 🚀 Despliegue

### Configuración de Producción

Asegúrate de que las variables de entorno estén configuradas en tu hosting:

```bash
# Netlify, Vercel, etc.
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

### Verificar en Producción

1. Despliega tu aplicación
2. Ve a Firebase Console > Analytics
3. Verifica que los eventos se están registrando correctamente

## 📋 Checklist de Implementación

- [x] ✅ Firebase Analytics configurado
- [x] ✅ Servicio de Analytics creado
- [x] ✅ Composable de Vue creado
- [x] ✅ Tracking automático de rutas habilitado
- [ ] ⚠️ Measurement ID configurado en variables de entorno
- [ ] ⚠️ Eventos integrados en servicios existentes
- [ ] ⚠️ Eventos personalizados implementados
- [ ] ⚠️ Testing en Firebase Console

## 💡 Próximos Pasos

1. **Configurar Measurement ID** - Obtener de Firebase Console
2. **Integrar en servicios existentes** - AuthService, PropertiesStore, etc.
3. **Definir eventos clave** - Conversiones, engagement, errores
4. **Configurar dashboards** - En Firebase Console o Google Analytics
5. **Monitorear y optimizar** - Usar los datos para mejorar la UX

¡Firebase Analytics está listo para proporcionar insights valiosos sobre el uso de tu aplicación! 🚀