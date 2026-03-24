// Simple notification utility that creates toast-like notifications
// Usage: showSimpleNotification('success', 'Title', 'Message')

let notificationId = 0;

export const showSimpleNotification = (
    type: 'success' | 'error' | 'warning' | 'info',
    title: string,
    message: string,
    duration: number = 5000
) => {
    // Create container if it doesn't exist
    let container = document.getElementById('notification-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notification-container';
        container.className = 'fixed top-4 right-4 z-50 space-y-2';
        document.body.appendChild(container);
    }

    // Create notification element
    const notificationElement = document.createElement('div');
    const id = `notification-${++notificationId}`;
    notificationElement.id = id;

    // Determine colors based on type (dark theme)
    const colors = {
        success: { border: 'border-green-400', icon: 'text-green-400', bg: 'bg-green-500/10', bgDark: 'bg-slate-800' },
        error: { border: 'border-red-400', icon: 'text-red-400', bg: 'bg-red-500/10', bgDark: 'bg-slate-800' },
        warning: { border: 'border-amber-400', icon: 'text-amber-400', bg: 'bg-amber-500/10', bgDark: 'bg-slate-800' },
        info: { border: 'border-blue-400', icon: 'text-blue-400', bg: 'bg-blue-500/10', bgDark: 'bg-slate-800' }
    };
    const color = colors[type];

    notificationElement.className = `
    max-w-sm w-full ${color.bgDark} rounded-lg shadow-lg border-l-4 p-4 
    transform transition-all duration-300 ease-in-out backdrop-blur-md
    ${color.border} ${color.bg} border border-slate-700/50
  `;
    notificationElement.innerHTML = `
    <div class="flex justify-between items-start">
      <div class="flex-1">
        <div class="flex items-center mb-2">
          <div class="flex-shrink-0 mr-3 ${color.icon}">
            ${getIconSVG(type)}
          </div>
          <p class="text-sm font-semibold text-slate-100">${title}</p>
        </div>
        <p class="text-sm text-slate-300 ml-8">${message}</p>
      </div>
      <button 
        class="flex-shrink-0 ml-4 text-slate-400 hover:text-slate-200 transition-colors"
        onclick="document.getElementById('${id}').remove()"
      >
        <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
        </svg>
      </button>
    </div>
  `;

    // Add to container
    container.appendChild(notificationElement);

    // Animate in
    setTimeout(() => {
        notificationElement.style.transform = 'translateX(0)';
        notificationElement.style.opacity = '1';
    }, 10);

    // Auto remove after duration
    setTimeout(() => {
        if (document.getElementById(id)) {
            notificationElement.style.transform = 'translateX(100%)';
            notificationElement.style.opacity = '0';
            setTimeout(() => {
                if (document.getElementById(id)) {
                    document.getElementById(id)?.remove();
                }
            }, 300);
        }
    }, duration);
};

function getIconSVG(type: string): string {
    switch (type) {
        case 'success':
            return `<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
      </svg>`;
        case 'error':
            return `<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
      </svg>`;
        case 'warning':
            return `<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
      </svg>`;
        case 'info':
            return `<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
      </svg>`;
        default:
            return '';
    }
}

export default showSimpleNotification;
