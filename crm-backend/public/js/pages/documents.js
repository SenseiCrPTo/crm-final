// js/pages/documents.js

/**
 * Отрисовывает страницу-заглушку для раздела "Документы".
 * @param {HTMLElement} container - Контейнер для рендеринга.
 */
export function renderDocuments(container) {
    container.innerHTML = `
        <div class="text-center py-10">
            <span class="material-icons text-6xl text-gray-600">folder_off</span>
            <h2 class="mt-4 text-2xl font-bold text-gray-300">Раздел "Документы" в разработке</h2>
            <p class="mt-2 text-gray-400">Этот функционал скоро появится.</p>
        </div>
    `;
}