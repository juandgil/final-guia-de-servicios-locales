import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private apiUrl = `${environment.apiUrl}/reviews`;

  constructor(private http: HttpClient) { }

  /**
   * Obtiene las reseñas para un servicio específico
   * @param serviceId ID del servicio
   * @returns Observable con la lista de reseñas
   */
  getReviewsByService(serviceId: string): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/services/${serviceId}/reviews`).pipe(
      map(response => response.data.reviews),
      catchError(error => {
        console.error('Error al obtener reseñas:', error);
        return throwError(() => new Error('Error al cargar las reseñas.'));
      })
    );
  }

  /**
   * Crea una nueva reseña para un servicio
   * @param serviceId ID del servicio
   * @param reviewData Datos de la reseña
   * @returns Observable con la respuesta de la API
   */
  createReview(serviceId: string, reviewData: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/services/${serviceId}/reviews`, reviewData).pipe(
      map(response => response.data.review),
      catchError(error => {
        console.error('Error al crear reseña:', error);
        return throwError(() => new Error(error.error.message || 'Error al publicar la reseña.'));
      })
    );
  }

  /**
   * Actualiza una reseña existente
   * @param reviewId ID de la reseña
   * @param reviewData Nuevos datos de la reseña
   * @returns Observable con la respuesta de la API
   */
  updateReview(reviewId: string, reviewData: any): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${reviewId}`, reviewData).pipe(
      map(response => response.data.review),
      catchError(error => {
        console.error('Error al actualizar reseña:', error);
        return throwError(() => new Error(error.error.message || 'Error al actualizar la reseña.'));
      })
    );
  }

  /**
   * Elimina una reseña
   * @param reviewId ID de la reseña
   * @returns Observable con la respuesta de la API
   */
  deleteReview(reviewId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${reviewId}`).pipe(
      catchError(error => {
        console.error('Error al eliminar reseña:', error);
        return throwError(() => new Error(error.error.message || 'Error al eliminar la reseña.'));
      })
    );
  }
}
