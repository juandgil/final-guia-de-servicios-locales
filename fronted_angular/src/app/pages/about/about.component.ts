import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.css']
})
export class AboutComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
    // Inicializar comportamiento del acordeón y otros elementos
    this.setupAccordion();
    this.setupContactForm();
    this.setupStatsAnimations();
  }

  // Configurar el acordeón
  private setupAccordion(): void {
    // Bootstrap se encarga automáticamente del acordeón
  }

  // Configurar el formulario de contacto
  private setupContactForm(): void {
    setTimeout(() => {
      const form = document.getElementById('contact-form');
      if (!form) return;

      form.addEventListener('submit', (e) => {
        e.preventDefault();

        // Mostrar alerta de función no disponible
        this.showAlert('info', 'Esta opción todavía no está disponible. Gracias por tu comprensión.');

        // Limpiar el formulario
        (form as HTMLFormElement).reset();

        /* Código comentado para futura implementación
        // Obtener los valores de los campos
        const nameInput = document.getElementById('name') as HTMLInputElement;
        const emailInput = document.getElementById('email') as HTMLInputElement;
        const subjectInput = document.getElementById('subject') as HTMLInputElement;
        const messageInput = document.getElementById('message') as HTMLTextAreaElement;

        if (!nameInput || !emailInput || !subjectInput || !messageInput) return;

        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        const subject = subjectInput.value.trim();
        const message = messageInput.value.trim();

        // Validar los campos
        if (!name || !email || !subject || !message) {
          this.showAlert('error', 'Por favor completa todos los campos del formulario.');
          return;
        }

        // Validar formato de email
        if (!this.isValidEmail(email)) {
          this.showAlert('error', 'Por favor ingresa un correo electrónico válido.');
          return;
        }

        // En un caso real, aquí enviaríamos los datos al servidor
        // Por ahora, mostraremos un mensaje de éxito como simulación

        this.showAlert('success', '¡Gracias por tu mensaje! Te responderemos lo antes posible.');

        // Limpiar el formulario
        (form as HTMLFormElement).reset();
        */
      });
    }, 500);
  }

  // Configurar animaciones para estadísticas
  private setupStatsAnimations(): void {
    setTimeout(() => {
      const statsSection = document.querySelector('.stats-section');

      if (!statsSection) return;

      // Detectar cuando el elemento es visible en el viewport
      const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          // Iniciar animación de números
          this.animateNumbers();
          // Desconectar observer después de iniciar la animación
          observer.disconnect();
        }
      }, { threshold: 0.5 });

      observer.observe(statsSection);
    }, 500);
  }

  // Animar los números de estadísticas
  private animateNumbers(): void {
    const numberElements = document.querySelectorAll('.stat-number');

    numberElements.forEach(element => {
      // Obtener el valor final (sin formatear)
      const finalValue = element.textContent?.replace(/[^\d]/g, '') || '0';
      element.textContent = '0';

      // Animar desde 0 hasta el valor final
      let startValue = 0;
      const increment = Math.ceil(parseInt(finalValue) / 40); // 40 pasos para la animación
      const duration = 1500; // 1.5 segundos
      const interval = duration / 40;

      const timer = setInterval(() => {
        startValue += increment;
        if (startValue > parseInt(finalValue)) {
          element.textContent = element.textContent?.includes('+') ?
            parseInt(finalValue).toLocaleString() + '+' :
            parseInt(finalValue).toLocaleString();
          clearInterval(timer);
        } else {
          element.textContent = element.textContent?.includes('+') ?
            parseInt(startValue.toString()).toLocaleString() + '+' :
            parseInt(startValue.toString()).toLocaleString();
        }
      }, interval);
    });
  }

  // Validar formato de email
  private isValidEmail(email: string): boolean {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  }

  // Mostrar alerta
  private showAlert(type: string, message: string): void {
    // Crear elemento de alerta
    const alertElement = document.createElement('div');
    alertElement.className = `alert alert-${type === 'success' ? 'success' : type === 'info' ? 'info' : 'danger'} alert-dismissible fade show mt-3`;
    alertElement.setAttribute('role', 'alert');

    alertElement.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

    // Buscar el formulario
    const form = document.getElementById('contact-form');

    if (form) {
      // Insertar la alerta después del formulario
      form.parentNode?.insertBefore(alertElement, form.nextSibling);

      // Eliminar la alerta después de 5 segundos
      setTimeout(() => {
        alertElement.classList.remove('show');
        setTimeout(() => {
          alertElement.remove();
        }, 300);
      }, 5000);
    }
  }
}
