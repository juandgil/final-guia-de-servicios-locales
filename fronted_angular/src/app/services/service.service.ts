import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, of, throwError, BehaviorSubject, forkJoin } from 'rxjs';
import { map, tap, switchMap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ServiceService {
  private apiUrl = `${environment.apiUrl}/services`;

  // Caché de servicios para usuarios no autenticados
  private featuredServicesCache: any[] = [];
  private allServicesCache: any[] = [];
  private serviceDetailsCache: {[key: string]: any} = {};
  private featuredServicesLoaded = false;

  constructor(private http: HttpClient) {
    // Precargar servicios destacados en segundo plano
    this.preloadFeaturedServices();
  }

  /**
   * Precarga los servicios destacados en segundo plano para tenerlos disponibles
   * Esto mejora la experiencia al navegar directamente a la galería
   */
  private preloadFeaturedServices(): void {
    if (!this.featuredServicesLoaded) {
      this.http.get<any>(`${this.apiUrl}/featured`).pipe(
        tap(response => {
          if (response && response.data && response.data.services) {
            this.featuredServicesCache = response.data.services;
          } else if (Array.isArray(response)) {
            this.featuredServicesCache = response;
          }
          this.featuredServicesLoaded = true;
          console.log('Servicios destacados precargados en caché');
        }),
        catchError(error => {
          console.error('Error al precargar servicios destacados:', error);
          return of(null);
        })
      ).subscribe();
    }
  }

  /**
   * Obtener todos los servicios
   * @returns Observable con la lista de servicios
   */
  getServices(): Observable<any> {
    return this.http.get<any>(this.apiUrl).pipe(
      tap(response => {
        // Guardar en caché
        if (response && response.data && response.data.services) {
          this.allServicesCache = response.data.services;
        } else if (Array.isArray(response)) {
          this.allServicesCache = response;
        }
      }),
      catchError(error => {
        console.error('Error al obtener servicios:', error);
        return throwError(() => new Error(error.error?.message || 'Error al obtener servicios'));
      })
    );
  }

  /**
   * Obtener un servicio por su ID
   * @param id ID del servicio
   * @returns Observable con los datos del servicio
   */
  getServiceById(id: string): Observable<any> {
    // Verificar primero si tenemos el servicio en caché
    const cachedService = this.getServicePreviewFromCache(id);

    // Si no hay una versión en caché y los servicios destacados no se han cargado aún,
    // intentamos cargar los servicios destacados primero
    if (!cachedService && !this.featuredServicesLoaded) {
      return this.getFeaturedServices().pipe(
        switchMap(() => {
          // Verificar de nuevo la caché después de cargar los destacados
          const updatedCache = this.getServicePreviewFromCache(id);
          if (updatedCache) {
            console.log('Servicio encontrado en caché tras cargar destacados');
            return this.getServiceDetailsWithFallback(id, updatedCache);
          }
          return this.getServiceDetailsWithFallback(id, null);
        }),
        catchError(() => {
          // Si falla al cargar destacados, continuamos con la solicitud normal
          return this.getServiceDetailsWithFallback(id, cachedService);
        })
      );
    }

    // Si ya tenemos datos en caché o los destacados ya se cargaron
    return this.getServiceDetailsWithFallback(id, cachedService);
  }

  /**
   * Intenta obtener detalles del servicio con caché de respaldo
   */
  private getServiceDetailsWithFallback(id: string, cachedService: any): Observable<any> {
    // Si tenemos una versión del servicio en caché, la usamos inicialmente
    if (cachedService) {
      console.log('Usando datos en caché para ID:', id);
    }

    // Intentamos obtener el servicio del servidor
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(response => {
        // Extraer el servicio de la respuesta si está en un objeto data
        const service = response.data?.service || response;

        // Asegurarse de que tenga un ID
        if (!service.id && service._id) {
          service.id = service._id;
        } else if (!service.id && id) {
          service.id = id;
        }

        // Guardar en caché
        this.serviceDetailsCache[id] = service;
        return service;
      }),
      catchError(error => {
        // Si el error es de autenticación (401/403), es un comportamiento esperado para usuarios no autenticados
        if (error.status === 401 || error.status === 403) {
          console.log(`Acceso restringido para servicio con ID ${id}: Obteniendo versión pública`);

          // Intentar obtener la versión pública del servicio
          return this.http.get<any>(`${this.apiUrl}/${id}/public`).pipe(
            map(response => {
              const publicService = response.data?.service || response;

              // Guardar en caché la versión pública
              if (publicService) {
                this.serviceDetailsCache[id] = publicService;
                console.log('Versión pública del servicio guardada en caché');
              }

              return publicService;
            }),
            catchError(publicError => {
              console.error(`Error al obtener la versión pública del servicio:`, publicError);

              // Si falla la versión pública y tenemos caché, usar la caché
              if (cachedService) {
                console.log('Mostrando datos públicos desde caché para usuario no autenticado');
                return of(cachedService);
              }

              // Si no hay caché, devolver error descriptivo
              return throwError(() => new Error('Se requiere inicio de sesión para ver los detalles de este servicio.'));
            })
          );
        } else {
          console.error(`Error al obtener servicio con ID ${id}:`, error);
        }

        // Si falla con cualquier otro error y tenemos el servicio en caché, devolver la versión en caché
        if (cachedService) {
          console.log('Mostrando datos públicos desde caché para usuario no autenticado');
          return of(cachedService);
        }

        // Si hay error pero no tenemos caché, devolver error descriptivo
        let errorMsg = 'Error al obtener el servicio';

        if (error.status === 404) {
          errorMsg = 'El servicio solicitado no existe o ha sido removido.';
        } else if (error.error?.message) {
          errorMsg = error.error.message;
        }

        return throwError(() => new Error(errorMsg));
      })
    );
  }

  /**
   * Obtener servicios destacados
   * @returns Observable con la lista de servicios destacados
   */
  getFeaturedServices(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/featured`).pipe(
      tap(response => {
        // Guardar en caché
        if (response && response.data && response.data.services) {
          this.featuredServicesCache = response.data.services;
        } else if (Array.isArray(response)) {
          this.featuredServicesCache = response;
        }
      }),
      catchError(error => {
        console.error('Error al obtener servicios destacados:', error);
        return throwError(() => new Error(error.error?.message || 'Error al obtener servicios destacados'));
      })
    );
  }

  /**
   * Obtener servicios por categoría
   * @param categoryId ID de la categoría
   * @returns Observable con la lista de servicios de la categoría
   */
  getServicesByCategory(categoryId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/category/${categoryId}`).pipe(
      catchError(error => {
        console.error(`Error al obtener servicios de la categoría ${categoryId}:`, error);
        return throwError(() => new Error(error.error?.message || 'Error al obtener servicios por categoría'));
      })
    );
  }

  /**
   * Buscar servicios
   * @param query Término de búsqueda
   * @returns Observable con la lista de servicios que coinciden con la búsqueda
   */
  searchServices(query: string): Observable<any> {
    // Usar HttpParams para asegurar la codificación correcta de los parámetros
    let params = new HttpParams()
      .set('query', query)
      .set('ignoreCase', 'true') // Ignorar mayúsculas/minúsculas
      .set('ignoreAccents', 'true'); // Ignorar acentos

    return this.http.get<any>(`${this.apiUrl}/search`, { params }).pipe(
      catchError(error => {
        console.error(`Error al buscar servicios con término "${query}":`, error);
        return throwError(() => new Error(error.error?.message || 'Error al buscar servicios'));
      })
    );
  }

  /**
   * Registrar un nuevo servicio
   * @param serviceData Datos del servicio a registrar
   * @returns Observable con la respuesta
   */
  registerService(serviceData: any): Observable<any> {
    // Si hay una imagen, usar FormData
    if (serviceData.serviceImage instanceof File) {
      const formData = new FormData();

      // Añadir todos los campos al FormData
      Object.keys(serviceData).forEach(key => {
        if (key === 'serviceImage') {
          formData.append('images', serviceData[key]);
        } else if (key !== 'terms') { // No enviar el campo terms al backend
          formData.append(key, serviceData[key]);
        }
      });

      return this.http.post<any>(this.apiUrl, formData).pipe(
        catchError(error => {
          console.error('Error al registrar servicio:', error);
          return throwError(() => new Error(error.error?.message || 'Error al registrar el servicio'));
        })
      );
    } else {
      // Si no hay imagen, enviar como JSON
      const { terms, serviceImage, ...data } = serviceData;

      return this.http.post<any>(this.apiUrl, data).pipe(
        catchError(error => {
          console.error('Error al registrar servicio:', error);
          return throwError(() => new Error(error.error?.message || 'Error al registrar el servicio'));
        })
      );
    }
  }

  /**
   * Actualizar un servicio existente
   * @param id ID del servicio a actualizar
   * @param serviceData Datos actualizados del servicio
   * @returns Observable con la respuesta
   */
  updateService(id: string, serviceData: any): Observable<any> {
    // Si hay una imagen, usar FormData
    if (serviceData.serviceImage instanceof File) {
      const formData = new FormData();

      // Añadir todos los campos al FormData
      Object.keys(serviceData).forEach(key => {
        if (key === 'serviceImage') {
          formData.append('images', serviceData[key]);
        } else if (key !== 'terms') { // No enviar el campo terms al backend
          formData.append(key, serviceData[key]);
        }
      });

      return this.http.patch<any>(`${this.apiUrl}/${id}`, formData).pipe(
        catchError(error => {
          console.error(`Error al actualizar servicio con ID ${id}:`, error);
          return throwError(() => new Error(error.error?.message || 'Error al actualizar el servicio'));
        })
      );
    } else {
      // Si no hay imagen, enviar como JSON
      const { terms, serviceImage, ...data } = serviceData;

      return this.http.patch<any>(`${this.apiUrl}/${id}`, data).pipe(
        catchError(error => {
          console.error(`Error al actualizar servicio con ID ${id}:`, error);
          return throwError(() => new Error(error.error?.message || 'Error al actualizar el servicio'));
        })
      );
    }
  }

  /**
   * Eliminar un servicio
   * @param id ID del servicio a eliminar
   * @returns Observable con la respuesta
   */
  deleteService(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      catchError(error => {
        console.error(`Error al eliminar servicio con ID ${id}:`, error);
        return throwError(() => new Error(error.error?.message || 'Error al eliminar el servicio'));
      })
    );
  }

  /**
   * Obtiene todos los servicios con filtros opcionales
   * @param filters Objeto con filtros (page, limit, etc.)
   * @returns Observable con la lista de servicios
   */
  getServicesFiltered(filters: any = {}): Observable<any> {
    let params = new HttpParams();

    // Añadir filtros a los parámetros
    Object.keys(filters).forEach(key => {
      if (filters[key] !== null && filters[key] !== undefined) {
        params = params.set(key, filters[key]);
      }
    });

    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map(response => response.data.services),
      catchError(error => {
        console.error('Error al obtener servicios:', error);
        return throwError(() => new Error('Error al cargar los servicios. Por favor, inténtelo de nuevo más tarde.'));
      })
    );
  }

  /**
   * Obtiene servicios por categoría
   * @param categoryId ID de la categoría
   * @param filters Filtros adicionales (page, limit, etc.)
   * @returns Observable con la lista de servicios de la categoría
   */
  getServicesByCategoryFiltered(categoryId: string, filters: any = {}): Observable<any> {
    let params = new HttpParams();

    Object.keys(filters).forEach(key => {
      if (filters[key] !== null && filters[key] !== undefined) {
        // Asegurarse de que los valores numéricos se envíen como números
        if (key === 'minRating' || key === 'page' || key === 'limit') {
          params = params.set(key, filters[key].toString());
        } else {
          params = params.set(key, filters[key]);
        }
      }
    });

    return this.http.get<any>(`${this.apiUrl}/category/${categoryId}`, { params }).pipe(
      map(response => ({
        services: response.data.services,
        pagination: response.pagination,
        category: response.category
      })),
      catchError(error => {
        console.error('Error al obtener servicios por categoría:', error);
        return throwError(() => new Error('Error al cargar los servicios de esta categoría.'));
      })
    );
  }

  /**
   * Obtiene servicios relacionados
   * @param serviceId ID del servicio actual
   * @param categoryId ID de la categoría
   * @param limit Número máximo de servicios a obtener
   * @returns Observable con la lista de servicios relacionados
   */
  getRelatedServices(serviceId: string, categoryId: string, limit: number = 3): Observable<any> {
    // En un caso real, el backend debería tener un endpoint específico para esto
    // Simulamos filtrando por categoría y excluyendo el servicio actual
    return this.getServicesByCategoryFiltered(categoryId, { limit: limit + 1 }).pipe(
      map(response => {
        const services = response.services.filter((service: any) => service.id !== serviceId);
        return services.slice(0, limit);
      }),
      catchError(error => {
        console.error('Error al obtener servicios relacionados:', error);
        return of([]);  // En caso de error, retornamos un array vacío
      })
    );
  }

  /**
   * Verifica si un usuario ya tiene servicios registrados
   * @returns Observable<boolean> true si el usuario ya tiene un servicio, false si no
   */
  getUserServices(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/my-services`).pipe(
      map(response => response.data.services),
      catchError(error => {
        console.error('Error al verificar servicios del usuario:', error);
        return throwError(() => new Error('Error al verificar si ya tienes servicios registrados.'));
      })
    );
  }

  /**
   * Verifica si un usuario ya tiene servicios registrados
   * @returns Observable<boolean> true si el usuario ya tiene un servicio, false si no
   */
  hasUserRegisteredService(): Observable<boolean> {
    return this.getUserServices().pipe(
      map(services => services && services.length > 0),
      catchError(() => of(false))
    );
  }

  /**
   * Obtener una versión de vista previa de un servicio desde la caché
   * @param id ID del servicio
   * @returns El servicio en modo vista previa o null si no se encuentra en caché
   *
   * Esta función está diseñada para proporcionar una versión limitada de los servicios
   * a usuarios no autenticados, ocultando información sensible como teléfonos y correos.
   * Es parte del flujo normal de la aplicación mostrar estos datos limitados cuando
   * el usuario no ha iniciado sesión y recibe un 401/403 del servidor.
   */
  getServicePreviewFromCache(id: string): any | null {
    // Buscar el servicio en las diferentes cachés
    const cachedService = this.serviceDetailsCache[id] ||
                          this.featuredServicesCache.find(s => s.id === id) ||
                          this.allServicesCache.find(s => s.id === id);

    if (!cachedService) {
      return null;
    }

    // Asegurar que las propiedades de rating estén disponibles
    const rating = cachedService.rating || (cachedService.reviewStats?.avgRating || 0);
    const reviewCount = cachedService.reviewCount || (cachedService.reviewStats?.quantity || 0);

    // Crear versión de vista previa
    return {
      ...cachedService,
      isPreview: true,
      // Asegurar que las propiedades de rating sean consistentes
      rating: rating,
      reviewCount: reviewCount,
      // Ocultar información sensible
      phone: 'Inicia sesión para ver',
      email: 'Inicia sesión para ver',
      contactInfo: 'Disponible al iniciar sesión'
    };
  }
}
