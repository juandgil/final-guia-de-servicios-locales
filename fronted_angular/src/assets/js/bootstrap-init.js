/**
 * Script para inicializar correctamente los componentes de Bootstrap
 * y evitar errores de backdrop
 */
(function() {
  console.log('Inicializando Bootstrap...');

  // Se ejecuta cuando el DOM está completamente cargado
  document.addEventListener('DOMContentLoaded', function() {
    // Prevenir inicialización automática de modales
    // y configurar manualmente con opciones específicas
    const modals = document.querySelectorAll('.modal');

    if (modals.length) {
      console.log('Encontrados ' + modals.length + ' modales para inicializar');

      // Definir opciones para los modales
      const modalOptions = {
        backdrop: true,
        keyboard: true,
        focus: true
      };

      // Inicializar cada modal con opciones seguras
      modals.forEach(function(modalEl) {
        try {
          const modalId = modalEl.id;
          console.log('Inicializando modal: ' + modalId);

          // Verificar que no esté ya inicializado
          if (!window.bootstrap.Modal.getInstance(modalEl)) {
            new window.bootstrap.Modal(modalEl, modalOptions);
            console.log('Modal ' + modalId + ' inicializado correctamente');
          }
        } catch (error) {
          console.error('Error al inicializar modal:', error);
        }
      });
    }

    // Gestionar los enlaces para abrir modales
    const modalTriggers = document.querySelectorAll('[data-bs-toggle="modal"]');

    if (modalTriggers.length) {
      console.log('Encontrados ' + modalTriggers.length + ' triggers de modal');

      modalTriggers.forEach(function(trigger) {
        trigger.addEventListener('click', function(event) {
          event.preventDefault();

          const targetId = this.getAttribute('data-bs-target');
          if (!targetId) return;

          const targetModal = document.querySelector(targetId);
          if (!targetModal) return;

          try {
            const bsModal = window.bootstrap.Modal.getInstance(targetModal) ||
                           new window.bootstrap.Modal(targetModal, {
                             backdrop: true,
                             keyboard: true,
                             focus: true
                           });

            bsModal.show();
            console.log('Modal ' + targetId + ' mostrado correctamente');
          } catch (error) {
            console.error('Error al mostrar modal ' + targetId + ':', error);
          }
        });
      });
    }
  });
})();
