import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ServiceRegistrationService {
  private apiUrl = `${environment.apiUrl}/services`;

  constructor(private http: HttpClient) { }

  /**
   * Registra un nuevo servicio
   * @param serviceData Los datos del servicio a registrar
   * @returns Observable con la respuesta de la API
   */
  registerService(service: any): Observable<any> {
    const formData = new FormData();

    // Agregar todos los campos del formulario
    Object.keys(service).forEach(key => {
      if (key !== 'serviceImage' && key !== 'terms') {
        formData.append(key, service[key]);
      }
    });

    // Agregar la imagen si existe
    if (service.serviceImage) {
      formData.append('serviceImage', service.serviceImage, service.serviceImage.name);
    } else {
      // Si no hay imagen, usar una imagen por defecto
      formData.append('mainImage', '/assets/img/imagen_default.webp');
    }

    return this.http.post(this.apiUrl, formData)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Actualiza un servicio existente
   * @param id ID del servicio a actualizar
   * @param serviceData Datos actualizados del servicio
   * @returns Observable con la respuesta de la API
   */
  updateService(id: string, serviceData: any): Observable<any> {
    const formData = new FormData();

    Object.keys(serviceData).forEach(key => {
      if (key === 'serviceImage' && serviceData[key] instanceof File) {
        formData.append('images', serviceData[key]);
      } else if (key !== 'serviceImage' && key !== 'terms') {
        formData.append(key, serviceData[key]);
      }
    });

    return this.http.patch<any>(`${this.apiUrl}/${id}`, formData).pipe(
      catchError(error => {
        return throwError(() => new Error(error.error.message || 'Error al actualizar el servicio'));
      })
    );
  }

  /**
   * Elimina un servicio
   * @param id ID del servicio a eliminar
   * @returns Observable con la respuesta de la API
   */
  deleteService(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      catchError(error => {
        return throwError(() => new Error(error.error.message || 'Error al eliminar el servicio'));
      })
    );
  }

  private handleError(error: any): Observable<never> {
    return throwError(() => new Error(error.error.message || 'Error al registrar el servicio'));
  }
}
