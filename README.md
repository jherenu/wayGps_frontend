# WayGPS - Frontend

## 📁 Estructura del Proyecto
```
frontend/
├── vanilla/          (Código JavaScript puro actual - FUNCIONANDO)
│   ├── css/          (Estilos: equipos, global, moviles)
│   ├── js/           (Scripts: api-client, auth, config, equipos, moviles)
│   └── html/         (Templates: authentication, equipos, moviles)
│
└── react-app/        (Aplicación React moderna - EN DESARROLLO)
    ├── public/
    ├── src/
    └── package.json
```

## 🎯 Estrategia de Migración

**Fase 1: Entorno híbrido (ACTUAL)**
- Código vanilla funcionando en producción
- Estructura React lista para desarrollo

**Fase 2: Migración gradual (FUTURO)**
- Migrar componentes uno por uno
- Probar en paralelo con vanilla
- Reemplazar progresivamente

## 🚀 Comandos de Desarrollo

### React (desarrollo local)
```bash
cd react-app
npm start          # Servidor de desarrollo (localhost:3000)
npm run build      # Compilar para producción
```

### Deployment
```bash
git add .
git commit -m "Descripción"
git push origin master

# En servidor:
cd /root/django-docker-project/frontend
git pull origin master
```

## 🔗 Backend

El backend Django (API REST) está en: `../app/`

**Repositorios:**
- Backend: https://github.com/jherenu/wayGps
- Frontend: https://github.com/jherenu/wayGps_frontend

---

**Última actualización:** 24/10/2025